//! settings 分组 ── JSON 文件持久化，见 spec/30-operations.md。
//!
//! M2-N1 真实化：读 / patch / 重置 走 SettingsStore；改后 emit `settings:changed` 广播。

use tauri::{Emitter, State};

use crate::error::JsonitaError;
use crate::store::SettingsStore;
use crate::types::Settings;

#[tauri::command]
pub fn settings_get_all(store: State<'_, SettingsStore>) -> Settings {
    store.get()
}

#[tauri::command]
pub async fn settings_set(
    app: tauri::AppHandle,
    patch: serde_json::Value,
    store: State<'_, SettingsStore>,
) -> Result<Settings, JsonitaError> {
    let obj = patch
        .as_object()
        .ok_or_else(|| JsonitaError::Io("patch must be object".into()))?
        .clone();
    let updated = store.patch(obj)?;
    // emit broadcast — 其他窗口 store 同步更新。
    let _ = app.emit("settings:changed", &updated);
    Ok(updated)
}

#[tauri::command]
pub async fn settings_reset(
    app: tauri::AppHandle,
    store: State<'_, SettingsStore>,
) -> Result<Settings, JsonitaError> {
    let updated = store.reset()?;
    let _ = app.emit("settings:changed", &updated);
    Ok(updated)
}
