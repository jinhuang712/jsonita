//! `JsonitaError` — 全局单一错误枚举。
//!
//! Spec ref: `spec/13_schemas.html` § 1.1 错误类型表
//! 跨 IPC 序列化为 `{"kind": "...", "data": ...}` (tag/content)
//! UI 分级响应见 `spec/02_ipc.html` § 8 错误矩阵

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

    #[error("Keychain: {0}")]
    Keychain(String),

    #[error("HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("AI returned invalid JSON")]
    AiInvalidJson { raw: String },

    #[error("Rate limited; retry after {retry_after_sec}s")]
    #[serde(rename_all = "camelCase")]
    RateLimit { retry_after_sec: u64 },

    #[error("IO: {0}")]
    Io(String),
}

// 常用 From impls；其他 (rusqlite / reqwest / keyring) 在引入对应 crate 时加。
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
