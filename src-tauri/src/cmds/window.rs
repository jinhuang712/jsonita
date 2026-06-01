//! window 分组 ── show/hide/toggle 接 M0-N3 模块；resize/reset 接 M1-N9 智能缩放。
//!
//! Spec ref: spec/06 § 7 智能缩放 4 层逻辑 · spec/02 § 6.1.6

use tauri::{Manager, State};

use crate::error::JsonitaError;
use crate::store::{SettingsStore, WindowStore};
use crate::types::ContentMetrics;
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

/// 智能缩放 ── spec/06 § 7.1 4 层逻辑。
#[tauri::command]
pub async fn window_resize_for_content(
    app: tauri::AppHandle,
    metrics: ContentMetrics,
    settings: State<'_, SettingsStore>,
    window_store: State<'_, WindowStore>,
) -> Result<(u32, u32), JsonitaError> {
    let s = settings.get();
    let cur = window_store.get();

    // 用户拖边仍会记忆尺寸；是否继续按内容自动缩放只由 smart_width 控制。
    // 这样粘贴 / 编辑 / 字体变化不会被历史上的 resize 事件永久锁住。
    if !s.smart_width {
        return Ok((cur.width, cur.height));
    }

    // ideal size = content-derived width/height, clamped to sane floating-panel bounds.
    // Soft wrap keeps width conservative while still allowing height to grow with lines/font.
    let font_size = metrics.font_size.clamp(10.0, 24.0);
    let char_px = (font_size * 0.62).ceil() as u32;
    let visible_cols = if metrics.soft_wrap_on {
        metrics.max_line_chars.min(96)
    } else {
        metrics.max_line_chars
    };
    let chrome_w = if s.single_pane_mode { 180 } else { 220 };
    let needed_w = visible_cols.saturating_mul(char_px).saturating_add(chrome_w);
    let line_px = (font_size * 1.55).ceil() as u32;
    let needed_h = metrics.line_count.saturating_mul(line_px).saturating_add(120);

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
    let max_w_cap = if s.single_pane_mode { 900 } else { 1400 };
    let max_w_ratio = if s.single_pane_mode { 0.52 } else { 0.7 };
    let min_w = if s.single_pane_mode { 440 } else { 720 };
    let max_w = std::cmp::min(max_w_cap, (screen_w as f64 * max_w_ratio) as u32);
    let max_h = std::cmp::min(900, (screen_h as f64 * 0.72) as u32);
    let ideal_w = needed_w.clamp(min_w, max_w);
    let ideal_h = needed_h.clamp(480, max_h);

    let new_w = ideal_w;
    let new_h = ideal_h;

    if new_w.abs_diff(cur.width) < 16 && new_h.abs_diff(cur.height) < 16 {
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
pub async fn window_reset_size(
    window_store: State<'_, WindowStore>,
) -> Result<(), JsonitaError> {
    window_store.reset()
}
