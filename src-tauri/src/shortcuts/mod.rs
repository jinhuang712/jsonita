//! Global shortcuts registration & accessibility permission entry.
//!
//! Spec ref: `spec/07_menubar.html` § 2 全局快捷键 / § 3 macOS Accessibility 权限
//! M0-N4 范围：硬编码 ⌘⇧J → window::toggle；权限缺失时发 event +
//! 提供 query/retry 命令给前端 Modal。
//! 自定义快捷键 / 冲突检测 → M2-N5。

use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState as TauriShortcutState,
};

use crate::window;

const TOGGLE_KEY: Code = Code::KeyJ;

fn toggle_shortcut() -> Shortcut {
    #[cfg(target_os = "macos")]
    let mods = Modifiers::META | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let mods = Modifiers::CONTROL | Modifiers::SHIFT;
    Shortcut::new(Some(mods), TOGGLE_KEY)
}

/// 启动时调一次 ── 注册 ⌘⇧J 默认快捷键。
/// 失败时不阻塞启动（macOS Accessibility 权限缺失场景），改 emit event 让前端引导。
pub fn register_defaults(app: &AppHandle) -> Result<(), String> {
    let shortcut = toggle_shortcut();
    // 重试时先 unregister 旧的（首次启动是 no-op）
    let _ = app.global_shortcut().unregister(shortcut.clone());

    let app_clone = app.clone();
    match app
        .global_shortcut()
        .on_shortcut(shortcut, move |_app, _sc, event| {
            if event.state() == TauriShortcutState::Pressed {
                let _ = window::toggle(&app_clone);
            }
        }) {
        Ok(_) => Ok(()),
        Err(e) => {
            let msg = e.to_string();
            // 通知前端：可能是 macOS Input Monitoring/Accessibility 缺权限
            let _ = app.emit("permission:accessibility_missing", &msg);
            Err(msg)
        }
    }
}

/// 前端查 ⌘⇧J 是否已注册成功（mount 时调一次决定要不要弹 Modal）。
#[tauri::command]
pub fn shortcut_status(app: AppHandle) -> bool {
    app.global_shortcut().is_registered(toggle_shortcut())
}

/// 前端 Modal 上"重试"或周期轮询调用；权限授予后调用应转 true。
#[tauri::command]
pub fn shortcut_retry(app: AppHandle) -> bool {
    register_defaults(&app).is_ok()
}

/// macOS Accessibility 设置页直跳（spec/07 § 3.2 命令）。
#[tauri::command]
pub fn open_accessibility_settings() {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let _ = Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn();
    }
}
