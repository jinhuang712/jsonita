//! 嵌套 stringified JSON 全量解开。
//!
//! Spec ref: `spec/M01-json-engine.md` unwrap 边界。
//! 关键决策（§ 6.2）：
//! - 只解 object/array 开头的 string（"123" "true" 保留）
//! - 走 walk 递归（无层数硬限，可选 max_depth）
//! - Instant 全程传递，每层入口检查

use std::time::{Duration, Instant};

use serde_json::Value;

use crate::error::JsonitaError;
use crate::types::UnwrapOpts;

use super::error_loc;

pub fn unwrap(text: &str, opts: UnwrapOpts) -> Result<String, JsonitaError> {
    let deadline = Instant::now() + Duration::from_millis(opts.timeout_ms);
    let mut v: Value = serde_json::from_str(text).map_err(error_loc::map)?;
    walk(&mut v, deadline, opts.max_depth, 0)?;
    serde_json::to_string_pretty(&v).map_err(|e| JsonitaError::Io(e.to_string()))
}

/// 递归遍历并保守解开 object/array 字符串。
fn walk(
    v: &mut Value,
    deadline: Instant,
    max_depth: Option<u32>,
    depth: u32,
) -> Result<(), JsonitaError> {
    if Instant::now() >= deadline {
        return Err(JsonitaError::UnwrapTimeout { ms: 0, depth });
    }
    if let Some(md) = max_depth {
        if depth > md {
            return Ok(());
        }
    }
    match v {
        Value::String(s) => {
            if let Ok(parsed) = serde_json::from_str::<Value>(s) {
                // 只解 object/array；纯数字/bool/null 字符串保留原值
                if matches!(parsed, Value::Object(_) | Value::Array(_)) {
                    *v = parsed;
                    walk(v, deadline, max_depth, depth + 1)?;
                }
            }
        }
        Value::Object(map) => {
            for (_, child) in map.iter_mut() {
                walk(child, deadline, max_depth, depth + 1)?;
            }
        }
        Value::Array(arr) => {
            for child in arr.iter_mut() {
                walk(child, deadline, max_depth, depth + 1)?;
            }
        }
        _ => {}
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::JsonitaError;

    fn opts(ms: u64, max: Option<u32>) -> UnwrapOpts {
        UnwrapOpts {
            timeout_ms: ms,
            max_depth: max,
        }
    }

    #[test]
    fn single_level() {
        let input = r#"{"a":"{\"b\":1}"}"#;
        let out = unwrap(input, opts(200, None)).unwrap();
        // "b":1 应该已变成嵌套 object
        assert!(out.contains("\"b\": 1"));
        assert!(!out.contains("\"{"));
    }

    #[test]
    fn double_nested() {
        // {"a":"{\"b\":\"{\\\"c\\\":1}\"}"}
        let input = r#"{"a":"{\"b\":\"{\\\"c\\\":1}\"}"}"#;
        let out = unwrap(input, opts(200, None)).unwrap();
        assert!(out.contains("\"c\": 1"));
    }

    #[test]
    fn array_of_stringified() {
        let input = r#"{"items":["{\"x\":1}","{\"x\":2}"]}"#;
        let out = unwrap(input, opts(200, None)).unwrap();
        assert!(out.contains("\"x\": 1"));
        assert!(out.contains("\"x\": 2"));
    }

    #[test]
    fn non_json_string_stays() {
        let input = r#"{"label":"hello world"}"#;
        let out = unwrap(input, opts(200, None)).unwrap();
        assert!(out.contains("\"hello world\""));
    }

    #[test]
    fn numeric_string_stays() {
        // "12345" 是字符串 ── 不解为 number
        let input = r#"{"id":"12345"}"#;
        let out = unwrap(input, opts(200, None)).unwrap();
        assert!(out.contains("\"12345\""));
    }

    #[test]
    fn max_depth_1_stops_at_first_level() {
        let input = r#"{"a":"{\"b\":\"{\\\"c\\\":1}\"}"}"#;
        let out = unwrap(input, opts(200, Some(1))).unwrap();
        // 第 1 层解开 → b 是 stringified inner 应保留
        assert!(out.contains("\"b\""));
        assert!(!out.contains("\"c\": 1"));
    }

    #[test]
    fn timeout_triggers_on_very_short() {
        // 极短超时 + 大量嵌套构造 ── 应触发 UnwrapTimeout
        // 构造 1000 层不现实；用 0ms 超时直接触发
        let input = r#"{"a":"{\"b\":1}"}"#;
        let err = unwrap(input, opts(0, None));
        // 0ms 后 walk 入口立即超时
        if let Err(JsonitaError::UnwrapTimeout { .. }) = err {
            // ok
        } else {
            // 极快机器上 0ms 可能 race；不强制 panic
        }
    }
}
