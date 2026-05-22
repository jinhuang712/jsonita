//! window 分组 ── show/hide/toggle 接 M0-N3 模块；resize/reset 接 M1-N9 智能宽度。
//!
//! Spec ref: spec/06 § 7 智能宽度 4 层逻辑 · spec/02 § 6.1.6

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
    }
    Ok(())
}

#[tauri::command]
pub async fn window_hide(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
        win.hide()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn window_toggle(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    window::toggle(&app)?;
    Ok(())
}

/// 智能宽度 ── spec/06 § 7.1 4 层逻辑。
#[tauri::command]
pub async fn window_resize_for_content(
    app: tauri::AppHandle,
    metrics: ContentMetrics,
    settings: State<'_, SettingsStore>,
    window_store: State<'_, WindowStore>,
) -> Result<(u32, u32), JsonitaError> {
    let s = settings.get();
    let cur = window_store.get();

    // 层 1: user_dragged 锁定
    if cur.user_dragged {
        return Ok((cur.width, cur.height));
    }
    // 层 2: soft_wrap 开时跳过
    if metrics.soft_wrap_on {
        return Ok((cur.width, cur.height));
    }
    // 层 3: settings.smart_width 关时跳过
    if !s.smart_width {
        return Ok((cur.width, cur.height));
    }
    // 层 4: max_line_chars > 80 才触发
    if metrics.max_line_chars <= 80 {
        return Ok((cur.width, cur.height));
    }

    // ideal_w = clamp(needed, 720, min(1400, screen×70%))
    let needed = metrics.max_line_chars * 8 + 64;
    let screen_w = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.size().width)
        .unwrap_or(1920);
    let max_w = std::cmp::min(1400, (screen_w as f64 * 0.7) as u32);
    let ideal_w = needed.clamp(720, max_w);

    let new_w = ideal_w;
    let new_h = cur.height;

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
