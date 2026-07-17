//! window 分组 ── show/hide/toggle 接 M0-N3 模块；resize/reset 接 M1-N9 智能缩放。
//!
//! Spec ref: design/06_window.md 智能缩放与 spec/S01-runtime-lifecycle.md。

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
    let real_size = app.get_webview_window(window::MAIN_LABEL).and_then(|win| {
        let scale = win.scale_factor().ok().filter(|s| *s > 0.0).unwrap_or(1.0);
        win.outer_size().ok().map(|size| {
            (
                (size.width as f64 / scale).round() as u32,
                (size.height as f64 / scale).round() as u32,
            )
        })
    });
    let current_width = real_size.map(|s| s.0).unwrap_or(cur.width);
    let current_height = real_size.map(|s| s.1).unwrap_or(cur.height);

    // 用户手动拖边后进入 user-sized 状态：自动缩放暂停，直到 Reset Size 清掉 window.json。
    if should_skip_auto_resize(s.smart_width, cur.user_dragged) {
        return Ok((current_width, current_height));
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

    // primary_monitor().size() 是物理像素；除以 scale_factor 换成逻辑像素，
    // 否则 Retina 上按物理宽算的 max_w_ratio 上限永不生效（与 main.rs 启动夹取一致）。
    let (screen_w, screen_h) = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| {
            let scale = m.scale_factor();
            let scale = if scale > 0.0 { scale } else { 1.0 };
            (
                (m.size().width as f64 / scale).round() as u32,
                (m.size().height as f64 / scale).round() as u32,
            )
        })
        .unwrap_or((1920, 1080));
    let max_w_cap = if s.single_pane_mode { 1200 } else { 1400 };
    let max_w_ratio = if s.single_pane_mode { 0.62 } else { 0.7 };
    let min_w = 680;
    let min_h = 380;
    let max_w = std::cmp::min(max_w_cap, (screen_w as f64 * max_w_ratio) as u32);
    let max_h = std::cmp::min(900, (screen_h as f64 * 0.72) as u32);
    let ideal_w = needed_w.clamp(min_w, max_w);
    let mut ideal_h = needed_h.clamp(min_h, max_h);

    // 黄金比例约束：宽高比不超过 1.9（太宽扁 → 拉高；太窄长不强制拉宽，
    // 因为窄高通常是内容所致，拉宽只是加白边）。
    let golden_ratio = 1.618;
    let max_ratio = 1.9;
    if ideal_w as f64 / ideal_h.max(1) as f64 > max_ratio {
        ideal_h = ideal_h
            .max((ideal_w as f64 / golden_ratio).round() as u32)
            .clamp(min_h, max_h);
    }

    let new_w = settle_auto_size(current_width, ideal_w, min_w, max_w);
    let new_h = settle_auto_size(current_height, ideal_h, min_h, max_h);

    if metrics.non_whitespace_chars <= 2 && new_w <= current_width && new_h <= current_height {
        return Ok((current_width, current_height));
    }

    if new_w == current_width && new_h == current_height {
        return Ok((current_width, current_height));
    }

    // 自身 resize ── 不让 Resized handler 错标 userDragged；同时保持窗口中心点不漂移。
    window_store.begin_self_resize();
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        let scale = win.scale_factor().ok().filter(|s| *s > 0.0).unwrap_or(1.0);
        let position = win.outer_position().ok();
        let size = win.outer_size().ok();
        let _ = win.set_size(tauri::LogicalSize::new(new_w as f64, new_h as f64));
        if let (Some(pos), Some(size)) = (position, size) {
            let left = pos.x as f64 / scale + (size.width as f64 / scale - new_w as f64) / 2.0;
            let top = pos.y as f64 / scale + (size.height as f64 / scale - new_h as f64) / 2.0;
            let _ = win.set_position(tauri::LogicalPosition::new(left, top));
        }
    }
    let resize_guard = window_store.inner().clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        resize_guard.end_self_resize();
    });

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
pub async fn window_reset_size(
    app: tauri::AppHandle,
    window_store: State<'_, WindowStore>,
) -> Result<(), JsonitaError> {
    window_store.reset()?;
    let st = window_store.get();
    window_store.begin_self_resize();
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        let _ = win.set_size(tauri::LogicalSize::new(st.width as f64, st.height as f64));
    }
    let resize_guard = window_store.inner().clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        resize_guard.end_self_resize();
    });
    Ok(())
}

fn settle_auto_size(current: u32, ideal: u32, min: u32, max: u32) -> u32 {
    let ideal = ideal.clamp(min, max);
    // 阈值按窗口尺寸缩放，避免小窗口吞掉合理变化、大窗口频繁跳动
    let width_pct = (current as f64 / 600.0).clamp(0.8, 1.5);
    let shrink_threshold = (60.0 * width_pct).round() as u32;
    let grow_threshold = (40.0 * width_pct).round() as u32;

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
        assert_eq!(settle_auto_size(400, 600, 600, 1400), 600);
    }

    #[test]
    fn ignores_small_growth_inside_comfort_band() {
        // 600 → grow=40, ideal=620 ≤ 640 → 不增长
        assert_eq!(settle_auto_size(600, 620, 600, 1400), 600);
    }

    #[test]
    fn shrinks_only_after_large_gap() {
        // 600 → shrink=60, current=650 ≤ 660 → 不收缩
        assert_eq!(settle_auto_size(650, 600, 600, 1400), 650);
        // current=680 > 660 → 收缩到 ideal(600)
        assert_eq!(settle_auto_size(680, 600, 600, 1400), 600);
    }

    #[test]
    fn grows_when_content_exceeds_comfort_band() {
        // 600 → grow=40, ideal=660 > 640 → 增长
        assert_eq!(settle_auto_size(600, 660, 600, 1400), 660);
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
    let (tx, rx) = tokio::sync::oneshot::channel();
    // AppKit（setAppearance / effectiveAppearance / set_effects）必须在主线程；本 command 跑在
    // async worker 线程，直接调会闪退（切主题崩溃的根因）。marshal 回主线程执行并 await 回传值，
    // 用 oneshot 让 worker 在等待期间不被同步阻塞。
    win.run_on_main_thread(move || {
        let dark = window::apply_glass_mode(&w, mode);
        let _ = tx.send(dark);
    })?;
    let dark = rx.await.unwrap_or(false);
    Ok(if dark { "dark" } else { "light" }.to_string())
}
