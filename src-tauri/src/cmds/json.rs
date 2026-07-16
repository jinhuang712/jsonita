//! json_ops 分组 ── 纯计算无状态，见 spec/M01-json-engine.md 与 spec/S02-ipc-boundary.md。
//!
//! M1-N2 起接入 `engine::*` 真实实现；CPU 密集走 `spawn_blocking` 不阻塞 main 进程
//! 避免阻塞 Tauri 主运行时。

use tauri::State;

use crate::engine;
use crate::error::JsonitaError;
use crate::store::SettingsStore;
use crate::types::{FormatOpts, StringifyOpts, UnwrapOpts};

#[tauri::command]
pub async fn json_format(
    text: String,
    opts: FormatOpts,
    settings: State<'_, SettingsStore>,
) -> Result<String, JsonitaError> {
    // always_string_to_json=true 时先把顶层 stringified JSON 解成 JSON；
    // 再按 auto_unwrap(nested) unwrap，最后 format。
    let auto_unwrap = settings.auto_unwrap();
    let always_string_to_json = settings.get().always_string_to_json;
    let timeout_ms = settings.unwrap_timeout_ms();
    tauri::async_runtime::spawn_blocking(move || {
        let mut text = text;
        if always_string_to_json {
            if let Ok(serde_json::Value::String(inner)) =
                serde_json::from_str::<serde_json::Value>(&text)
            {
                let looks_json = serde_json::from_str::<serde_json::Value>(&inner)
                    .map(|v| v.is_object() || v.is_array())
                    .unwrap_or(false);
                if looks_json {
                    text = inner;
                }
            }
        }
        let processed = if auto_unwrap {
            engine::unwrap::unwrap(
                &text,
                UnwrapOpts {
                    timeout_ms,
                    max_depth: None,
                },
            )?
        } else {
            text
        };
        engine::json::format(&processed, opts)
    })
    .await
    .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn json_minify(text: String) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::json::minify(&text))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn json_unwrap_stringified(
    text: String,
    opts: UnwrapOpts,
) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::unwrap::unwrap(&text, opts))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn json_stringify(text: String, opts: StringifyOpts) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::stringify::json_to_string(&text, opts))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

/// String → JSON 互转，对应前端 String to JSON pane。
#[tauri::command]
pub async fn json_parse(text: String) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::stringify::string_to_json(&text))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}
