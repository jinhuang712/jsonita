//! `JsonitaError` — 全局单一错误枚举。
//!
//! Spec ref: `spec/S03-error-model.md` 与 `spec/appendix/A00-schemas.md`
//! 跨 IPC 序列化为 `{"kind": "...", "data": ...}` (tag/content)
//! 调用方错误契约见 `spec/S02-ipc-boundary.md`

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "data")]
pub enum JsonitaError {
    #[error("JSON parse error at line {line}, col {col}: {msg}")]
    Parse { line: u32, col: u32, msg: String },

    #[error("Unwrap timeout after {ms}ms (depth {depth})")]
    UnwrapTimeout { ms: u64, depth: u32 },

    #[error("SQLite: {0}")]
    Sqlite(String),

    #[error("Secrets: {0}")]
    Secrets(String),

    #[error("HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("AI returned invalid JSON")]
    AiInvalidJson { raw: String },

    #[error("AI could not repair this input: {reason}")]
    AiCannotRepair { reason: String },

    #[error("Rate limited; retry after {retry_after_sec}s")]
    #[serde(rename_all = "camelCase")]
    RateLimit { retry_after_sec: u64 },

    #[error("IO: {0}")]
    Io(String),

    #[error("AI Fix is disabled in Settings")]
    AiDisabled,
}

// 常用 From impls；其他 (rusqlite / reqwest) 在引入对应 crate 时加。
impl From<std::io::Error> for JsonitaError {
    fn from(e: std::io::Error) -> Self {
        JsonitaError::Io(e.to_string())
    }
}

impl From<tauri::Error> for JsonitaError {
    fn from(e: tauri::Error) -> Self {
        JsonitaError::Io(e.to_string())
    }
}
