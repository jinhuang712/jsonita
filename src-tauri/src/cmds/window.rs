//! window 分组 stubs ── NSPanel 状态 + 智能宽度记忆（spec/02 § 2.6）。
//!
//! M1-N1：show/hide/toggle 接入 M0-N3 既有 window 模块；
//! resize_for_content / reset_size 暂 mock；M1-N9 智能宽度起接真实实现。

use crate::error::JsonitaError;
use crate::types::ContentMetrics;
use crate::window;

#[tauri::command]
pub async fn window_show(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    if let Some(win) = tauri::Manager::get_webview_window(&app, window::MAIN_LABEL) {
        win.show()?;
        win.set_focus()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn window_hide(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    if let Some(win) = tauri::Manager::get_webview_window(&app, window::MAIN_LABEL) {
        win.hide()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn window_toggle(app: tauri::AppHandle) -> Result<(), JsonitaError> {
    window::toggle(&app)?;
    Ok(())
}

#[tauri::command]
pub async fn window_resize_for_content(
    _metrics: ContentMetrics,
) -> Result<(u32, u32), JsonitaError> {
    // M1-N9 替换：4 层逻辑 + clamp(720, min(1400, screen×70%))
    Ok((860, 560))
}

#[tauri::command]
pub async fn window_reset_size() -> Result<(), JsonitaError> {
    // M1-N9 替换：删 window.json + userDragged=false
    Ok(())
}
