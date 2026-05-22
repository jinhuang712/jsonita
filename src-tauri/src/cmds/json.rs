//! json_ops 分组 ── 纯计算无状态（spec/02 § 2.1）。
//!
//! M1-N2 起接入 `engine::*` 真实实现；CPU 密集走 `spawn_blocking` 不阻塞 main 进程
//! （00 § 3 不变量 I-4 main 不阻塞）。

use crate::engine;
use crate::error::JsonitaError;
use crate::types::{FormatOpts, StringifyOpts, UnwrapOpts};

#[tauri::command]
pub async fn json_format(text: String, opts: FormatOpts) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::json::format(&text, opts))
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

/// String → JSON 互转。spec/02 § 6.1 当前只列了 json_stringify（JSON → String）；
/// 反向 string_to_json 在 spec 中通过 →JSON tab 触发，IPC 命令名留 M1-N4 布局时确认；
/// M1-N2 先暴露 engine 函数 + 这个命令，前端先可调。
#[tauri::command]
pub async fn json_parse(text: String) -> Result<String, JsonitaError> {
    tauri::async_runtime::spawn_blocking(move || engine::stringify::string_to_json(&text))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}
