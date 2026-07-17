//! format + minify + sort_keys ── serde_json::Value 中转 + PrettyFormatter。
//!
//! Spec ref: `spec/20-architecture.md` format 与 sort_keys。
//! preserve_order feature 必开（保留用户输入 key 顺序）。

use serde::Serialize;
use serde_json::ser::PrettyFormatter;
use serde_json::Value;

use crate::error::JsonitaError;
use crate::types::{FormatOpts, IndentMode};

use super::error_loc;

pub fn format(text: &str, opts: FormatOpts) -> Result<String, JsonitaError> {
    let mut value: Value = serde_json::from_str(text).map_err(error_loc::map)?;
    if opts.sort_keys {
        sort_keys_recursive(&mut value);
    }
    let indent = indent_bytes(opts.indent);
    let formatter = PrettyFormatter::with_indent(indent);
    let mut writer: Vec<u8> = Vec::with_capacity(text.len() * 2);
    let mut ser = serde_json::Serializer::with_formatter(&mut writer, formatter);
    value
        .serialize(&mut ser)
        .map_err(|e| JsonitaError::Io(e.to_string()))?;
    let mut out = String::from_utf8(writer).map_err(|e| JsonitaError::Io(e.to_string()))?;
    if opts.trailing_newline {
        out.push('\n');
    }
    Ok(out)
}

pub fn minify(text: &str) -> Result<String, JsonitaError> {
    let value: Value = serde_json::from_str(text).map_err(error_loc::map)?;
    serde_json::to_string(&value).map_err(|e| JsonitaError::Io(e.to_string()))
}

/// 递归字典序排序 object key；array 顺序保持。
fn sort_keys_recursive(v: &mut Value) {
    match v {
        Value::Object(map) => {
            let mut keys: Vec<String> = map.keys().cloned().collect();
            keys.sort();
            let mut new_map = serde_json::Map::with_capacity(keys.len());
            for k in keys {
                let mut val = map.remove(&k).unwrap();
                sort_keys_recursive(&mut val);
                new_map.insert(k, val);
            }
            *map = new_map;
        }
        Value::Array(arr) => arr.iter_mut().for_each(sort_keys_recursive),
        _ => {}
    }
}

fn indent_bytes(mode: IndentMode) -> &'static [u8] {
    match mode {
        IndentMode::Spaces2 => b"  ",
        IndentMode::Spaces4 => b"    ",
        IndentMode::Tab => b"\t",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::JsonitaError;

    fn opts(sort: bool) -> FormatOpts {
        FormatOpts {
            indent: IndentMode::Spaces2,
            sort_keys: sort,
            trailing_newline: false,
        }
    }

    #[test]
    fn format_basic() {
        let input = r#"{"name":"alice","age":30}"#;
        let out = format(input, opts(false)).unwrap();
        assert!(out.contains("\"name\": \"alice\""));
        assert!(out.contains("\"age\": 30"));
    }

    #[test]
    fn format_preserves_order() {
        let input = r#"{"z":1,"a":2,"m":3}"#;
        let out = format(input, opts(false)).unwrap();
        let z = out.find("\"z\"").unwrap();
        let a = out.find("\"a\"").unwrap();
        let m = out.find("\"m\"").unwrap();
        // 不 sort 时应保持输入顺序 z < a < m
        assert!(z < a && a < m);
    }

    #[test]
    fn format_sort_keys() {
        let input = r#"{"z":1,"a":2,"m":3}"#;
        let out = format(input, opts(true)).unwrap();
        let z = out.find("\"z\"").unwrap();
        let a = out.find("\"a\"").unwrap();
        let m = out.find("\"m\"").unwrap();
        // sort 后应为字典序 a < m < z
        assert!(a < m && m < z);
    }

    #[test]
    fn format_sort_keys_nested() {
        let input = r#"{"outer":{"z":1,"a":2}}"#;
        let out = format(input, opts(true)).unwrap();
        let a_pos = out.find("\"a\"").unwrap();
        let z_pos = out.find("\"z\"").unwrap();
        assert!(a_pos < z_pos, "nested 也要 sort");
    }

    #[test]
    fn format_trailing_newline() {
        let input = r#"{"a":1}"#;
        let with_nl = FormatOpts {
            indent: IndentMode::Spaces2,
            sort_keys: false,
            trailing_newline: true,
        };
        let out = format(input, with_nl).unwrap();
        assert!(out.ends_with('\n'));
    }

    #[test]
    fn minify_basic() {
        let input = "{\n  \"a\": 1,\n  \"b\": [1, 2]\n}";
        let out = minify(input).unwrap();
        assert_eq!(out, r#"{"a":1,"b":[1,2]}"#);
    }

    #[test]
    fn format_parse_error_returns_line_col() {
        let input = "{\n  \"a\": ,\n}";
        let err = format(input, opts(false)).unwrap_err();
        match err {
            JsonitaError::Parse { line, col, .. } => {
                assert_eq!(line, 2);
                assert!(col > 0);
            }
            _ => panic!("expected Parse error"),
        }
    }
}
