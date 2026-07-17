//! AI 响应抽取 + 验证 — CLAUDE.md 契约段 三层 fallback。

/// 从 AI raw 文本抽取 JSON 子串 ── 三 case fallback。
pub fn extract_json(raw: &str) -> Option<String> {
    let t = raw.trim();

    // case 1: 直接是 JSON
    if t.starts_with('{') || t.starts_with('[') {
        return Some(t.to_string());
    }

    // case 2: ```json ... ``` 包裹
    if let Some(start) = t.find("```") {
        let after = &t[start + 3..];
        let after = after.trim_start_matches("json").trim_start();
        if let Some(end) = after.rfind("```") {
            let inner = after[..end].trim();
            if inner.starts_with('{') || inner.starts_with('[') {
                return Some(inner.to_string());
            }
        }
    }

    // case 3: 文本中找首个 { 到末尾 } 之间
    let first = t.find(|c: char| c == '{' || c == '[')?;
    let last = t.rfind(|c: char| c == '}' || c == ']')?;
    if last > first {
        Some(t[first..=last].to_string())
    } else {
        None
    }
}

pub fn is_repair_failed_sentinel(value: &serde_json::Value) -> bool {
    value
        .as_object()
        .and_then(|obj| obj.get("_jsonita_repair_failed"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

/// 取 repair-failed 哨兵里模型给的 `reason`（trim 后非空才返回）。
pub fn repair_failed_reason(value: &serde_json::Value) -> Option<String> {
    value
        .as_object()
        .and_then(|obj| obj.get("reason"))
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pure_json() {
        assert_eq!(extract_json(r#"{"a":1}"#).as_deref(), Some(r#"{"a":1}"#));
        assert_eq!(extract_json("  \n[1,2]\n").as_deref(), Some("[1,2]"));
    }

    #[test]
    fn markdown_fenced() {
        let raw = "```json\n{\"a\":1}\n```";
        assert_eq!(extract_json(raw).as_deref(), Some("{\"a\":1}"));
    }

    #[test]
    fn markdown_fenced_no_lang() {
        let raw = "```\n{\"a\":1}\n```";
        assert_eq!(extract_json(raw).as_deref(), Some("{\"a\":1}"));
    }

    #[test]
    fn text_wrapped() {
        let raw = "Sure! Here's the fixed JSON:\n{\"a\":1}\nLet me know if you need more.";
        assert_eq!(extract_json(raw).as_deref(), Some("{\"a\":1}"));
    }

    #[test]
    fn nothing_to_extract() {
        assert_eq!(extract_json("no json here"), None);
    }

    #[test]
    fn detects_repair_failed_sentinel() {
        let value: serde_json::Value =
            serde_json::json!({ "_jsonita_repair_failed": true, "reason": "too broken" });
        assert!(is_repair_failed_sentinel(&value));
        assert!(!is_repair_failed_sentinel(&serde_json::json!({ "ok": true })));
        assert!(!is_repair_failed_sentinel(&serde_json::json!([1, 2, 3])));
    }

    #[test]
    fn extracts_repair_failed_reason() {
        let value = serde_json::json!({ "_jsonita_repair_failed": true, "reason": "not JSON" });
        assert_eq!(repair_failed_reason(&value).as_deref(), Some("not JSON"));
        // 空 / 缺失 reason → None
        assert_eq!(repair_failed_reason(&serde_json::json!({ "reason": "  " })), None);
        assert_eq!(repair_failed_reason(&serde_json::json!({ "_jsonita_repair_failed": true })), None);
    }
}
