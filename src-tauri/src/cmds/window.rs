//! window 分组 ── show/hide/toggle 接 M0-N3 模块；resize/reset 接 M1-N9 智能缩放。
//!
//! Spec ref: design/06 § 7 智能缩放 4 层逻辑 · spec/02 § 6.1.6

use tauri::{Manager, State};

use crate::error::JsonitaError;
use crate::store::{SettingsStore, WindowStore};
use crate::types::{ContentMetrics, ThemeMode};
use crate::window;

#[tauri::command]
pub async fn window_show(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        win.show()?;
        win.set_focus()?;
        let _ = tauri::Emitter::emit(&app, "window:shown", ());
    }
    Ok(())
}

#[tauri::command]
pub async fn window_hide(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        window::animated_hide(win);
    }
    Ok(())
}

#[tauri::command]
pub async fn window_toggle(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    window::toggle(&app)?;
    Ok(())
}

/// 智能缩放 ── design/06 § 7.1 4 层逻辑。
#[tauri::command]
pub async fn window_resize_for_content(
    app: tauri::AppHandle,
    metrics: ContentMetrics,
    settings: State<'_, SettingsStore>,
    window_store: State<'_, WindowStore>,
) -> Result<(u32, u32), JsonitaError> {
    let s = settings.get();
    let cur = window_store.get();

    // 用户手动拖边后进入 user-sized 状态：自动缩放暂停，直到 Reset Size 清掉 window.json。
    if should_skip_auto_resize(s.smart_width, cur.user_dragged) {
        return Ok((cur.width, cur.height));
    }

    // ideal size = content-derived width/height, clamped to sane floating-panel bounds.
    // Soft wrap keeps width conservative while still allowing height to grow with lines/font.
    let font_size = metrics.font_size.clamp(10.0, 24.0);
    let char_px = (font_size * 0.62).ceil() as u32;
    let visible_cols = if metrics.soft_wrap_on {
        metrics.max_line_chars.min(88)
    } else {
        metrics.max_line_chars
    };
    let chrome_w = if s.single_pane_mode { 220 } else { 300 };
    let needed_w = visible_cols
        .saturating_mul(char_px)
        .saturating_add(chrome_w);
    let line_px = (font_size * 1.55).ceil() as u32;
    let needed_h = metrics
        .line_count
        .saturating_mul(line_px)
        .saturating_add(120);

    let screen_w = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.size().width)
        .unwrap_or(1920);
    let screen_h = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.size().height)
        .unwrap_or(1080);
    let max_w_cap = if s.single_pane_mode { 1200 } else { 1400 };
    let max_w_ratio = if s.single_pane_mode { 0.62 } else { 0.7 };
    let min_w = 860;
    let min_h = 560;
    let max_w = std::cmp::min(max_w_cap, (screen_w as f64 * max_w_ratio) as u32);
    let max_h = std::cmp::min(900, (screen_h as f64 * 0.72) as u32);
    let ideal_w = needed_w.clamp(min_w, max_w);
    let ideal_h = needed_h.clamp(min_h, max_h);

    let new_w = settle_auto_size(cur.width, ideal_w, min_w, max_w);
    let new_h = settle_auto_size(cur.height, ideal_h, min_h, max_h);

    if metrics.non_whitespace_chars <= 2 && new_w <= cur.width && new_h <= cur.height {
        return Ok((cur.width, cur.height));
    }

    if new_w == cur.width && new_h == cur.height {
        return Ok((cur.width, cur.height));
    }

    // 自身 resize ── 不让 Resized handler 错标 userDragged
    window_store.begin_self_resize();
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        let _ = win.set_size(tauri::LogicalSize::new(new_w as f64, new_h as f64));
    }
    window_store.end_self_resize();

    // 保存（不 set userDragged）
    window_store.set(crate::store::WindowState {
        width: new_w,
        height: new_h,
        user_dragged: false,
    })?;

    // 通知前端
    let _ = tauri::Emitter::emit(
        &app,
        "window:resized",
        crate::types::WindowResizedPayload {
            width: new_w,
            height: new_h,
            source: "auto",
        },
    );

    Ok((new_w, new_h))
}

#[tauri::command]
pub async fn window_reset_size(window_store: State<'_, WindowStore>) -> Result<(), JsonitaError> {
    window_store.reset()
}

fn settle_auto_size(current: u32, ideal: u32, min: u32, max: u32) -> u32 {
    let ideal = ideal.clamp(min, max);
    let shrink_threshold = 120;
    let grow_threshold = 72;

    if current < min {
        return min;
    }
    if current > max {
        return max;
    }
    if ideal > current.saturating_add(grow_threshold) {
        return ideal;
    }
    if current > ideal.saturating_add(shrink_threshold) {
        return ideal;
    }
    current
}

fn should_skip_auto_resize(smart_width: bool, user_dragged: bool) -> bool {
    !smart_width || user_dragged
}

#[cfg(test)]
mod tests {
    use super::{settle_auto_size, should_skip_auto_resize};

    #[test]
    fn user_dragged_size_locks_auto_resize() {
        assert!(should_skip_auto_resize(true, true));
        assert!(should_skip_auto_resize(false, false));
        assert!(!should_skip_auto_resize(true, false));
    }

    #[test]
    fn restores_size_below_auto_floor() {
        assert_eq!(settle_auto_size(520, 860, 860, 1400), 860);
    }

    #[test]
    fn ignores_small_growth_inside_comfort_band() {
        assert_eq!(settle_auto_size(860, 900, 860, 1400), 860);
    }

    #[test]
    fn shrinks_only_after_large_gap() {
        assert_eq!(settle_auto_size(920, 860, 860, 1400), 920);
        assert_eq!(settle_auto_size(1040, 860, 860, 1400), 860);
    }

    #[test]
    fn grows_when_content_exceeds_comfort_band() {
        assert_eq!(settle_auto_size(860, 960, 860, 1400), 960);
    }
}

/// 主题解析 + 原生 vibrancy 材质 / 窗口 appearance 跟随（design/06 § 2.6 · design/03 § 11）。
/// 前端 useEffectiveTheme 在挂载与每次切换时调用，传 mode = "light" | "dark" | "system"。
/// system 由原生读 `NSApp.effectiveAppearance` 解析（权威，不靠 webview matchMedia），
/// 返回解析后的 effective = "light" | "dark" 给前端作为唯一权威值。
#[tauri::command]
pub async fn window_set_theme(
    app: tauri::AppHandle,
    mode: ThemeMode,
) -> Result<String, JsonitaError> {
    let Some(win) = app.get_webview_window(window::MAIN_LABEL) else {
        // 无主窗口（极少）：退回粗解析，system 当 light。
        return Ok(if matches!(mode, ThemeMode::Dark) {
            "dark"
        } else {
            "light"
        }
        .to_string());
    };
    let w = win.clone();
    let (tx, rx) = std::sync::mpsc::channel();
    // AppKit（setAppearance / effectiveAppearance / set_effects）必须在主线程；本 command 跑在
    // async worker 线程，直接调会闪退（切主题崩溃的根因）。marshal 回主线程执行并回传解析值。
    win.run_on_main_thread(move || {
        let dark = window::apply_glass_mode(&w, mode);
        let _ = tx.send(dark);
    })?;
    let dark = rx.recv().unwrap_or(false);
    Ok(if dark { "dark" } else { "light" }.to_string())
}
