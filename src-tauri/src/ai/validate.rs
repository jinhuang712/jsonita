//! AI 响应抽取 + 验证 — spec/11 § 6 三层 fallback。

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
}
