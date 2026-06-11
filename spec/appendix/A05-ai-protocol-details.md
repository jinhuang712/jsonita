# A05 · AI Protocol Details

核心语义见 [../M02-ai-repair.md](../M02-ai-repair.md)，provider integration contract 见 [../platform/I00-ai-provider-protocol.md](../platform/I00-ai-provider-protocol.md)。本页只列 prompt、wire 参数、响应抽取和 Diff props。

## System prompt

```
You are a JSON repair tool. Your only job is to fix invalid JSON.

RULES:
1. Output a SINGLE valid JSON object or array.
2. Do NOT add any explanation, markdown, code fence, or commentary.
3. Preserve the original intent: keep all keys and values exactly as the user typed them, only fix syntax.
4. If the input is already valid JSON, return it unchanged after standard pretty-printing.
5. If repair is impossible, return:
   { "_jsonita_repair_failed": true, "reason": "<short reason>" }

OUTPUT FORMAT: plain JSON text. No prefix, no suffix.
```

## User prompt shape

| 部分 | 内容 |
| --- | --- |
| header | `Fix this JSON:` |
| body | fenced 用户 JSON 文本。 |
| hint | 可选 `line`、`column`、`msg`。 |

## DeepSeek request defaults

| 参数 | 值 |
| --- | --- |
| endpoint | DeepSeek chat completions compatible endpoint。 |
| model | settings `aiModelId`，默认 `deepseek-chat`。 |
| temperature | `0.0`。 |
| max_tokens | `clamp(input_chars / 3 * 2, 512, 8192)`。 |
| stream | `false`。 |
| response_format | `{ "type": "json_object" }`。 |
| timeout | `60s`。 |
| auth | bearer token from `secrets.json`。 |

## 响应抽取

| case | 识别 | 结果 |
| --- | --- | --- |
| 纯 JSON | trim 后以 `{` 或 `[` 开头 | 直接验证。 |
| fenced | 包含 code fence 或 `json` fence | 取 fence 内文本后验证。 |
| mixed text | 找首个 `{`/`[` 与最后一个 `}`/`]` | 截取后验证。 |
| 失败 | 无法抽取或 parse 失败 | `AiInvalidJson`。 |

## 错误映射

| 上游情况 | JsonitaError |
| --- | --- |
| AI disabled | `AiDisabled` |
| no API key | `Secrets` |
| network / timeout | `Http { status: 0, body }` |
| HTTP 401/403/5xx | `Http { status, body }` |
| HTTP 429 | `RateLimit { retry_after_sec }` |
| empty choices/content | `AiInvalidJson` |
| extracted text parse failure | `AiInvalidJson` |

## Diff props

| prop | 类型 | 说明 |
| --- | --- | --- |
| `before` | `string` | 原输入。 |
| `after` | `string` | AI 修复后且已验证合法 JSON 的文本。 |
| `onAccept` | `() => void` | 覆盖 editor。 |
| `onReject` | `() => void` | 保留原文。 |

