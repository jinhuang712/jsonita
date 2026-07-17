//! 日志脱敏 — 机制级隐私兜底（CLAUDE.md 契约段 日志与隐私）。
//!
//! tracing `Layer::on_event` 无法改写事件字段值（fmt layer 读原始事件），故脱敏放在
//! 写出层：包装 `MakeWriter`，拦截 fmt `.json()` 产出的每行 JSON，按字段名脱敏后再转发。
//! 独立于调用点自律的兜底 —— 即便未来某处误把敏感字段塞进日志，也不会落盘明文。
//!
//! 规则（字段名大小写不敏感）：
//! - denylist（`api_key` / `access_token` / `password` / `secret` / `token` / `authorization`）
//!   → 值整体替换为 `"[redacted]"`
//! - hashlist（`content` / `text` / `body` / `raw` / `document` / `json` / `payload`）
//!   → 字符串值改记 `len=N sha256=XX`（前 8 hex），不落原文
//! - `message` / `msg`（tracing 格式消息字段）兜底：仅当值本身解析为 JSON object/array 时
//!   hash（防 `tracing::error!("{}", raw_json)` 绕过字段名匹配），普通短消息（"window.toggle"）保留可读

use std::io::{self, Write};

use serde_json::Value;
use sha2::{Digest, Sha256};
use tracing_subscriber::fmt::MakeWriter;

const DENYLIST: &[&str] = &[
    "api_key",
    "apikey",
    "access_token",
    "accesstoken",
    "password",
    "secret",
    "token",
    "authorization",
    "x-api-key",
];

const HASHLIST: &[&str] = &[
    "content", "text", "body", "raw", "document", "json", "payload",
];

fn hash_summary(s: &str) -> String {
    let digest = Sha256::digest(s.as_bytes());
    let hex = hex::encode(digest);
    format!("len={} sha256={}", s.len(), &hex[..8])
}

/// 递归脱敏 JSON 值。
fn redact_value(v: &mut Value) {
    match v {
        Value::Object(map) => {
            for (k, val) in map.iter_mut() {
                let key = k.to_ascii_lowercase();
                if DENYLIST.contains(&key.as_str()) {
                    *val = Value::String("[redacted]".into());
                } else if HASHLIST.contains(&key.as_str()) {
                    if let Some(s) = val.as_str() {
                        *val = Value::String(hash_summary(s));
                    } else {
                        redact_value(val);
                    }
                } else if key == "message" || key == "msg" {
                    // tracing 格式消息字段兜底：若值本身是 JSON object/array，视为误录原文 → hash。
                    if let Some(s) = val.as_str() {
                        if let Ok(parsed) = serde_json::from_str::<Value>(s) {
                            if parsed.is_object() || parsed.is_array() {
                                *val = Value::String(hash_summary(s));
                                continue;
                            }
                        }
                    }
                    redact_value(val);
                } else {
                    redact_value(val);
                }
            }
        }
        Value::Array(arr) => arr.iter_mut().for_each(redact_value),
        _ => {}
    }
}

/// 对单行日志脱敏；非 JSON 行原样返回（理论上不会命中，fmt 是 .json()）。
fn redact_line(line: &str) -> String {
    match serde_json::from_str::<Value>(line.trim()) {
        Ok(mut v) => {
            redact_value(&mut v);
            serde_json::to_string(&v).unwrap_or_else(|_| line.to_string())
        }
        Err(_) => line.to_string(),
    }
}

/// 包装任意 `MakeWriter`，在写出前对每行 JSON 脱敏。
pub struct RedactWriter<M>(pub M);

impl<'a, M> MakeWriter<'a> for RedactWriter<M>
where
    M: MakeWriter<'a>,
{
    type Writer = RedactSink<M::Writer>;

    fn make_writer(&'a self) -> Self::Writer {
        RedactSink {
            inner: self.0.make_writer(),
            buf: Vec::new(),
        }
    }
}

/// 单次事件写入的缓冲：fmt 在本实例生命周期内写完整行 + `\n`，drop 时按行脱敏转发。
pub struct RedactSink<W: Write> {
    inner: W,
    buf: Vec<u8>,
}

impl<W: Write> Write for RedactSink<W> {
    fn write(&mut self, data: &[u8]) -> io::Result<usize> {
        self.buf.extend_from_slice(data);
        Ok(data.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        self.inner.flush()
    }
}

impl<W: Write> Drop for RedactSink<W> {
    fn drop(&mut self) {
        if self.buf.is_empty() {
            return;
        }
        let text = String::from_utf8_lossy(&self.buf);
        let mut out = String::new();
        for line in text.split_inclusive('\n') {
            let has_nl = line.ends_with('\n');
            let body = line.strip_suffix('\n').unwrap_or(line);
            if body.trim().is_empty() {
                out.push_str(line);
                continue;
            }
            out.push_str(&redact_line(body));
            if has_nl {
                out.push('\n');
            }
        }
        let _ = self.inner.write_all(out.as_bytes());
        let _ = self.inner.flush();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn denylist_key_redacted() {
        let line = r#"{"level":"info","api_key":"sk-abc123","msg":"x"}"#;
        let out = redact_line(line);
        assert!(out.contains(r#""api_key":"[redacted]""#));
        assert!(!out.contains("sk-abc123"));
    }

    #[test]
    fn hashlist_key_summarized() {
        let line = r#"{"content":"{\"secret\":1}"}"#;
        let out = redact_line(line);
        assert!(out.contains("len=") && out.contains("sha256="));
        assert!(!out.contains("secret"));
    }

    #[test]
    fn nested_and_case_insensitive() {
        let line = r#"{"span":{"API_KEY":"zzz","note":"ok"}}"#;
        let out = redact_line(line);
        assert!(out.contains("[redacted]"));
        assert!(!out.contains("zzz"));
        assert!(out.contains("\"note\":\"ok\""));
    }

    #[test]
    fn plain_metadata_untouched() {
        let line = r#"{"level":"info","version":"1.0.0","msg":"app.start"}"#;
        let out = redact_line(line);
        assert!(out.contains("app.start"));
        assert!(out.contains("1.0.0"));
    }

    #[test]
    fn non_json_passthrough() {
        assert_eq!(redact_line("not json"), "not json");
    }

    #[test]
    fn message_field_json_payload_hashed() {
        // tracing::error!("{}", raw_json) 会把原文放进 message 字段；是 JSON object 时兜底 hash。
        let line = r#"{"level":"error","message":"{\"a\":1,\"secret\":2}"}"#;
        let out = redact_line(line);
        assert!(out.contains("len=") && out.contains("sha256="));
        assert!(!out.contains("\"secret\":2"));
        // 普通短消息保留可读
        let line2 = r#"{"level":"info","message":"window.toggle"}"#;
        let out2 = redact_line(line2);
        assert!(out2.contains("window.toggle"));
    }
}
