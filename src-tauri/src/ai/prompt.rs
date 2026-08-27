//! Prompt 构造 — 纯函数（无 IO）。
//!
//! Spec ref: CLAUDE.md 契约段 prompt 边界。

use std::fmt::Write;

pub fn system_prompt() -> &'static str {
    r#"You are a JSON repair tool. Your only job is to fix invalid JSON.

RULES:
1. Output a SINGLE valid JSON object or array.
2. Do NOT add any explanation, markdown, code fence, or commentary.
3. Preserve the original intent: keep all keys and values exactly as the user
   typed them, only fix syntax (quotes, commas, brackets, escapes).
4. If the input is already valid JSON, return it unchanged (after standard
   pretty-printing).
5. ALWAYS attempt a repair. Be aggressive: close unterminated strings, drop
   trailing junk, recover values from broken tokens, fix truncated keys by
   appending a closing quote, and make reasonable inferences for missing
   braces. Only return the repair-failed sentinel when literally nothing
   can be salvaged from the input.
6. If repair is impossible, return:
   { "_jsonita_repair_failed": true, "reason": "<short reason>" }

OUTPUT FORMAT: plain JSON text. No prefix, no suffix."#
}

pub fn user_prompt(text: &str, line: Option<u32>, col: Option<u32>, msg: Option<&str>) -> String {
    let mut p = String::with_capacity(text.len() + 128);
    p.push_str("Fix this JSON:\n\n```\n");
    p.push_str(text);
    p.push_str("\n```\n");
    if let (Some(l), Some(c)) = (line, col) {
        let _ = write!(p, "\nHint: parse error at line {}, column {}", l, c);
        if let Some(m) = msg {
            let _ = write!(p, " ({})", m);
        }
        p.push('.');
    }
    p
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_prompt_lists_6_rules() {
        let s = system_prompt();
        assert!(s.contains("RULES:"));
        for n in 1..=6 {
            assert!(s.contains(&format!("{}.", n)), "rule {} missing", n);
        }
        assert!(s.contains("_jsonita_repair_failed"));
    }

    #[test]
    fn user_prompt_with_hint() {
        let p = user_prompt("{a:1}", Some(1), Some(2), Some("key must be string"));
        assert!(p.contains("Fix this JSON"));
        assert!(p.contains("line 1, column 2"));
        assert!(p.contains("key must be string"));
    }

    #[test]
    fn user_prompt_no_hint() {
        let p = user_prompt("{}", None, None, None);
        assert!(!p.contains("Hint"));
    }
}
