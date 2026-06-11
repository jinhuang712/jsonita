//! JSON ↔ String 互转 ── 见 spec/06_json_engine.md。
//!
//! - `json_to_string`: JSON → 转义 quote 包裹字面量（适合嵌入 JS / SQL / YAML）
//! - `string_to_json`: 去外层 quote + 反转义 + 美化输出（4 层嵌套互逆）

use serde_json::Value;

use crate::error::JsonitaError;
use crate::types::{QuoteStyle, StringifyOpts};

use super::error_loc;

pub fn json_to_string(text: &str, opts: StringifyOpts) -> Result<String, JsonitaError> {
    let value: Value = serde_json::from_str(text).map_err(error_loc::map)?;
    let raw = if opts.minify {
        serde_json::to_string(&value).map_err(|e| JsonitaError::Io(e.to_string()))?
    } else {
        serde_json::to_string_pretty(&value).map_err(|e| JsonitaError::Io(e.to_string()))?
    };

    let quote = match opts.quote {
        QuoteStyle::Double => '"',
        QuoteStyle::Single => '\'',
    };

    let mut out = String::with_capacity(raw.len() + 16);
    out.push(quote);
    for c in raw.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            ch if ch == quote => {
                out.push('\\');
                out.push(ch);
            }
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if opts.escape_unicode && (c as u32) > 127 => {
                let mut buf = [0u16; 2];
                for w in c.encode_utf16(&mut buf).iter() {
                    out.push_str(&format!("\\u{:04x}", w));
                }
            }
            c => out.push(c),
        }
    }
    out.push(quote);
    Ok(out)
}

pub fn string_to_json(text: &str) -> Result<String, JsonitaError> {
    let trimmed = text.trim();
    let inner = if trimmed.len() >= 2
        && ((trimmed.starts_with('"') && trimmed.ends_with('"'))
            || (trimmed.starts_with('\'') && trimmed.ends_with('\'')))
    {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    };
    let unescaped = unescape(inner)?;
    let value: Value = serde_json::from_str(&unescaped).map_err(error_loc::map)?;
    serde_json::to_string_pretty(&value).map_err(|e| JsonitaError::Io(e.to_string()))
}

/// 字符串反转义。
fn unescape(s: &str) -> Result<String, JsonitaError> {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('"') => out.push('"'),
            Some('\'') => out.push('\''),
            Some('\\') => out.push('\\'),
            Some('/') => out.push('/'),
            Some('n') => out.push('\n'),
            Some('t') => out.push('\t'),
            Some('r') => out.push('\r'),
            Some('b') => out.push('\u{0008}'),
            Some('f') => out.push('\u{000C}'),
            Some('u') => {
                let hex: String = chars.by_ref().take(4).collect();
                let code = u32::from_str_radix(&hex, 16).map_err(|_| JsonitaError::Parse {
                    line: 0,
                    col: 0,
                    msg: format!("invalid \\u{}", hex),
                })?;
                if let Some(ch) = char::from_u32(code) {
                    out.push(ch);
                }
            }
            None => {
                return Err(JsonitaError::Parse {
                    line: 0,
                    col: 0,
                    msg: "trailing backslash".into(),
                });
            }
            Some(other) => {
                // 未识别 escape ── 保留 raw
                out.push('\\');
                out.push(other);
            }
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn opts(quote: QuoteStyle, escape_unicode: bool, minify: bool) -> StringifyOpts {
        StringifyOpts {
            quote,
            escape_unicode,
            minify,
        }
    }

    #[test]
    fn json_to_string_basic_double() {
        let input = r#"{"a":1}"#;
        let out = json_to_string(input, opts(QuoteStyle::Double, false, true)).unwrap();
        assert_eq!(out, r#""{\"a\":1}""#);
    }

    #[test]
    fn json_to_string_basic_single() {
        let input = r#"{"a":1}"#;
        let out = json_to_string(input, opts(QuoteStyle::Single, false, true)).unwrap();
        assert_eq!(out, r#"'{"a":1}'"#);
    }

    #[test]
    fn json_to_string_escape_unicode() {
        let input = r#"{"k":"中"}"#;
        let out = json_to_string(input, opts(QuoteStyle::Double, true, true)).unwrap();
        assert!(out.contains("\\u4e2d"));
    }

    #[test]
    fn string_to_json_with_outer_quotes() {
        let input = r#""{\"a\":1}""#;
        let out = string_to_json(input).unwrap();
        assert!(out.contains("\"a\""));
    }

    #[test]
    fn string_to_json_without_outer_quotes() {
        let input = r#"{\"a\":1}"#;
        let out = string_to_json(input).unwrap();
        assert!(out.contains("\"a\""));
    }

    #[test]
    fn nested_escape_4_levels_roundtrip() {
        // plan/01 F3.2: 4 层嵌套转义往返一致
        let original = r#"{"a":1}"#;
        let mut s = original.to_string();
        // forward 4 次
        for _ in 0..4 {
            s = json_to_string(&s, opts(QuoteStyle::Double, false, true)).unwrap();
        }
        // reverse 4 次
        for _ in 0..4 {
            s = string_to_json(&s).unwrap();
        }
        // 应解回 {"a":1}（serde_json::to_string_pretty 格式）
        assert!(s.contains("\"a\""));
        assert!(s.contains("1"));
    }
}
