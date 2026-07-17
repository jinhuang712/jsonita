//! JSON ↔ String 互转 ── 见 spec/M01-json-engine.md。
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
                let code = read_hex4(&mut chars)?;
                if (0xD800..=0xDBFF).contains(&code) {
                    // 高代理：JSON 里非 BMP 字符（如 emoji）编码为一对 \uXXXX，
                    // 必须紧跟一个低代理合成一个 code point，否则报错而非静默丢字符。
                    if chars.next() != Some('\\') || chars.next() != Some('u') {
                        return Err(surrogate_err());
                    }
                    let low = read_hex4(&mut chars)?;
                    if !(0xDC00..=0xDFFF).contains(&low) {
                        return Err(surrogate_err());
                    }
                    let combined = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00);
                    match char::from_u32(combined) {
                        Some(ch) => out.push(ch),
                        None => return Err(surrogate_err()),
                    }
                } else if (0xDC00..=0xDFFF).contains(&code) {
                    // 落单低代理 → 非法
                    return Err(surrogate_err());
                } else if let Some(ch) = char::from_u32(code) {
                    out.push(ch);
                } else {
                    return Err(JsonitaError::Parse {
                        line: 0,
                        col: 0,
                        msg: format!("invalid \\u{:04x}", code),
                    });
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

/// 从 `\uXXXX` 后续字符流读 4 位 hex 组成一个 UTF-16 code unit。
fn read_hex4(chars: &mut std::str::Chars<'_>) -> Result<u32, JsonitaError> {
    let hex: String = chars.by_ref().take(4).collect();
    u32::from_str_radix(&hex, 16).map_err(|_| JsonitaError::Parse {
        line: 0,
        col: 0,
        msg: format!("invalid \\u{}", hex),
    })
}

fn surrogate_err() -> JsonitaError {
    JsonitaError::Parse {
        line: 0,
        col: 0,
        msg: "invalid UTF-16 surrogate pair".into(),
    }
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
    fn string_to_json_surrogate_pair_roundtrip() {
        // 非 BMP（emoji）经 escape_unicode 编成代理对后往返不丢字符
        let input = r#"{"e":"😀"}"#;
        let escaped = json_to_string(input, opts(QuoteStyle::Double, true, true)).unwrap();
        assert!(escaped.to_lowercase().contains("\\ud83d"));
        let back = string_to_json(&escaped).unwrap();
        assert!(back.contains('😀'));
    }

    #[test]
    fn string_to_json_lone_surrogate_errors() {
        // 落单高代理 / 落单低代理都应报错而非静默丢字符
        assert!(string_to_json(r#""\ud83d""#).is_err());
        assert!(string_to_json(r#""\ude00""#).is_err());
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
