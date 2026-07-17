//! Global shortcuts ── M0-N4 默认 + M2-N5 自定义 + 冲突检测。
//!
//! Spec ref: design/overview.md § 2-4 / § 3 macOS shortcut permission recovery

use std::str::FromStr;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState as TauriShortcutState,
};

use crate::store::SettingsStore;
use crate::types::Settings;
use crate::window;

/// 系统级保留快捷键 ── design/overview.md § 2.4
const RESERVED: &[&str] = &[
    "CmdOrCtrl+Q",
    "CmdOrCtrl+W",
    "CmdOrCtrl+Tab",
    "CmdOrCtrl+Space",
    "CmdOrCtrl+H",
    "F11",
    "F12",
    "Escape",
];

fn is_reserved(acc: &str) -> bool {
    RESERVED.iter().any(|r| acc.eq_ignore_ascii_case(r))
}

/// 解析 "CmdOrCtrl+Shift+J" 风格字符串为 Shortcut。design/overview.md § 2.2
pub fn parse_accelerator(s: &str) -> Result<Shortcut, String> {
    let mut mods = Modifiers::empty();
    let mut code: Option<Code> = None;
    for part in s.split('+') {
        let p = part.trim();
        match p.to_lowercase().as_str() {
            "cmd" | "command" | "meta" => mods |= Modifiers::META,
            "cmdorctrl" => {
                #[cfg(target_os = "macos")]
                {
                    mods |= Modifiers::META;
                }
                #[cfg(not(target_os = "macos"))]
                {
                    mods |= Modifiers::CONTROL;
                }
            }
            "ctrl" | "control" => mods |= Modifiers::CONTROL,
            "alt" | "option" => mods |= Modifiers::ALT,
            "shift" => mods |= Modifiers::SHIFT,
            other => {
                code = Some(parse_code(other).ok_or_else(|| format!("unknown key: {}", other))?);
            }
        }
    }
    let c = code.ok_or_else(|| format!("missing key in '{}'", s))?;
    Ok(Shortcut::new(Some(mods), c))
}

fn parse_code(s: &str) -> Option<Code> {
    let upper = s.to_uppercase();
    if upper.len() == 1 {
        let ch = upper.chars().next()?;
        if ch.is_ascii_alphabetic() {
            return Code::from_str(&format!("Key{}", ch)).ok();
        }
        if ch.is_ascii_digit() {
            return Code::from_str(&format!("Digit{}", ch)).ok();
        }
    }
    // F1..F12 / Comma / Period / Slash 等直接试
    Code::from_str(&upper).ok()
}

/// 启动时调一次 ── 从 SettingsStore 读两个快捷键全注册。
pub fn register_defaults(app: &AppHandle) -> Result<(), String> {
    let settings = app.state::<SettingsStore>().get();
    register_all(app, &settings)
}

/// 注册全部快捷键（toggle） ── 用户改 settings 后调。
pub fn register_all(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    // 先全部 unregister（覆盖式更新）
    let _ = app.global_shortcut().unregister_all();

    register_one(app, "toggle-window", &settings.shortcut_toggle)?;
    Ok(())
}

fn register_one(app: &AppHandle, action: &str, accelerator: &str) -> Result<(), String> {
    let shortcut = parse_accelerator(accelerator)?;
    let app_clone = app.clone();
    let action_str = action.to_string();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _sc, event| {
            if event.state() == TauriShortcutState::Pressed {
                match action_str.as_str() {
                    "toggle-window" => {
                        let _ = window::toggle(&app_clone);
                    }
                    _ => {}
                }
            }
        })
        .map_err(|e| e.to_string())
}

/// 前端查 ⌘⇧J 是否已注册成功（mount 时调一次决定要不要弹 Modal）。
#[tauri::command]
pub fn shortcut_status(app: AppHandle) -> bool {
    // 检查任一已注册即可（无 key 时 toggle_shortcut 默认为 ⌘⇧J）
    let s = app.state::<SettingsStore>().get();
    if let Ok(shortcut) = parse_accelerator(&s.shortcut_toggle) {
        return app.global_shortcut().is_registered(shortcut);
    }
    false
}

/// 前端 Modal 上 "重试" 或周期轮询调用；权限授予后调用应转 true。
#[tauri::command]
pub fn shortcut_retry(app: AppHandle) -> bool {
    register_defaults(&app).is_ok()
}

/// macOS Accessibility 设置页直跳（design/overview.md § 3.2 命令）。
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

// ──────────── M2-N5 自定义快捷键 ────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutRegisterReq {
    pub action: String, // "toggle-window"
    pub accelerator: String,
    #[serde(default)]
    pub force_override: bool,
}

#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum ShortcutRegisterResp {
    Ok,
    Conflict { with_app: Option<String> },
    Reserved,
    InvalidAccelerator { reason: String },
}

/// 设置面板 ShortcutInput 调 → 验证 + 写 SettingsStore + 重新注册。
/// design/overview.md / CLAUDE.md 契约段
#[tauri::command]
pub async fn shortcut_register(app: AppHandle, req: ShortcutRegisterReq) -> ShortcutRegisterResp {
    if !req.force_override && is_reserved(&req.accelerator) {
        return ShortcutRegisterResp::Reserved;
    }
    if let Err(e) = parse_accelerator(&req.accelerator) {
        return ShortcutRegisterResp::InvalidAccelerator { reason: e };
    }

    let field = match req.action.as_str() {
        "toggle-window" => "shortcutToggle",
        _ => {
            return ShortcutRegisterResp::InvalidAccelerator {
                reason: "unknown action".into(),
            };
        }
    };

    let store = app.state::<SettingsStore>();
    let old_settings = store.get();

    let mut patch = serde_json::Map::new();
    patch.insert(
        field.to_string(),
        serde_json::Value::String(req.accelerator.clone()),
    );
    let new_settings = match store.patch(patch) {
        Ok(s) => s,
        Err(e) => {
            return ShortcutRegisterResp::InvalidAccelerator {
                reason: e.to_string(),
            };
        }
    };

    if let Err(_e) = register_all(&app, &new_settings) {
        // 回滚 SettingsStore + 重新注册旧的
        let mut revert = serde_json::Map::new();
        revert.insert(
            field.to_string(),
            serde_json::Value::String(old_settings.shortcut_toggle.clone()),
        );
        let _ = store.patch(revert);
        let _ = register_all(&app, &old_settings);
        return ShortcutRegisterResp::Conflict { with_app: None };
    }

    let _ = app.emit("settings:changed", &new_settings);
    ShortcutRegisterResp::Ok
}
