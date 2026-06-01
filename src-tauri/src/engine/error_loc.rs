//! serde_json::Error → `JsonitaError::Parse` 映射。
//!
//! Spec ref: `spec/09_json_engine.html` § 5 错误位置定位
//! 关键：1-indexed line/col 与用户视角一致 ── CodeMirror linter 喂数据靠这个。

use crate::error::JsonitaError;

pub fn map(e: serde_json::Error) -> JsonitaError {
    let raw = e.to_string();
    // 剥离 " at line X column Y" 后缀（serde-internal）
    let msg = raw.split(" at line ").next().unwrap_or(&raw).to_string();
    JsonitaError::Parse {
        line: e.line() as u32,
        col: e.column() as u32,
        msg: polish(msg),
    }
}

/// 给用户视角的常见错误文案润色（spec/09 § 5.3）。
fn polish(raw: String) -> String {
    // M1-N2 简化：5 类已知 case → 友好文案；其余原样
    let lower = raw.to_ascii_lowercase();
    if lower.contains("expected `,` or `}`") {
        "expected ',' or '}'".to_string()
    } else if lower.contains("trailing comma") {
        "trailing comma not allowed".to_string()
    } else if lower.contains("key must be a string") {
        "key must be a string (use double quotes)".to_string()
    } else if lower.contains("eof while parsing a string") {
        "unterminated string".to_string()
    } else if lower.contains("expected value") {
        "unexpected token, value required".to_string()
    } else {
        raw
    }
}
