//! json_ops 分组 stubs ── 纯计算无状态（spec/02 § 2.1）。
//!
//! M1-N1：返回输入 unchanged 作为 mock 让前端 UI 调通；
//! M1-N2 起接 `engine::*` 实现真实 format / minify / unwrap / stringify。

use crate::error::JsonitaError;
use crate::types::{FormatOpts, StringifyOpts, UnwrapOpts};

#[tauri::command]
pub async fn json_format(text: String, _opts: FormatOpts) -> Result<String, JsonitaError> {
    // M1-N2 替换：engine::json::format(&text, opts)
    Ok(text)
}

#[tauri::command]
pub async fn json_minify(text: String) -> Result<String, JsonitaError> {
    // M1-N2 替换：engine::json::minify(&text)
    Ok(text)
}

#[tauri::command]
pub async fn json_unwrap_stringified(
    text: String,
    _opts: UnwrapOpts,
) -> Result<String, JsonitaError> {
    // M1-N8 替换：engine::unwrap::unwrap(&text, opts)
    Ok(text)
}

#[tauri::command]
pub async fn json_stringify(text: String, _opts: StringifyOpts) -> Result<String, JsonitaError> {
    // M1-N2 替换：engine::stringify::json_to_string(&text, opts)
    Ok(text)
}
