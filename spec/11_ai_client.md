SPEC · 章节 11

# AI 客户端

DeepSeek 请求 / Prompt / 响应验证 / Diff / 错误透传 ── 先讲设计原则与协议选型，再讲核心算法，最后给契约。

REF

对外 IPC 类型 `AiFixReq` /`AiFixResp` 定义见 [13 § 3.4](13_schemas.md)；API key 走本地 `secrets.json` （ [13 § 6](13_schemas.md) ），设计动因见 [plan/03 § 2.5](../plan/03_tech_stack.md) /[10 § 6](10_storage.md)。本章描述 设计原则 + 协议构造 + 算法。

一 · 设计

## 1设计原则

AI 在 Jsonita 是 可选附加能力 而非核心 ── 用户大部分时候不会用，但用的时候必须可靠 / 可控 / 透明。五条硬约束：

| 原则 | 含义 | 实现影响 |

| --- | --- | --- |

| 用户用自己 API key | 不当家长， 不限频， 不缓存 请求结果 | 没有 client-side rate limit；每次都打 DeepSeek |

| 仅修复，不解释 | prompt 严格要求"只返回合法 JSON" | system prompt 5 条规则 + `response_format: json_object` 双保险 |

| 错误透传 | 上游 429 / 5xx 原样回前端 + 携带 retry-after | Rust 错误结构带 status / body / retry_after_sec；IPC 到前端为 retryAfterSec |

| 开关完全关 | `ai_enabled = false` 时入口隐藏 + Rust 端 early return | 命令入口检查 settings；UI 不渲染 AI Fix Tab |

| 无 telemetry | 用户 JSON 不发到任何 Jsonita 自己的后端 | 只有 `api.deepseek.com` 出网；tauri.conf http allowlist 限定 |

## 2为何选 DeepSeek（而非 OpenAI / Claude）

OpenAI 兼容 API ：DeepSeek 完全兼容 OpenAI Chat Completions 协议 ── 同一套 `ChatRequest` / `ChatResponse` 结构可以零成本支持其他兼容 provider（Moonshot / Together 等）

价格 + 性能 ：deepseek-chat 在 JSON 修复任务上表现稳定，价格约为 GPT-4 的 1/20

支持 `response_format: json_object` ：强制返回 JSON（避免模型用 markdown code fence 包裹），这是修复任务的关键能力

v2 扩展路径 ：保留 `settings.ai_provider` 预留字段（v1 写死 deepseek），未来切换 provider 改 URL + key account 名即可

## 3模块结构 & 关注点分离

| 层 | 模块 | 职责 |

| --- | --- | --- |

| Rust 后端 | `ai/deepseek.rs` | 构造 HTTP 请求、发送、解析 / 拆解状态码 / emit 进度事件 |

| `ai/prompt.rs` | system + user prompt 模板拼装（纯字符串函数，无 IO） |  |

| `ai/validate.rs` | 从 AI 响应中抽取 JSON（容忍 markdown 包裹 / 解释文字）+ 合法性二次验证 |  |

| React 前端 | `panes/AiFixPane.tsx` | AI Fix 状态容器；交互呈现见 [design/02 § 4](../design/02_interaction.md#4ai-fix-流程仅错误时) |

| `store/ai.ts` | zustand store：status (idle / requesting / awaiting-decision) + before/after + 错误 |  |

关键划分：prompt 与 validate 是 纯函数 （无 IO，可独立单测）；deepseek 处理网络 + 状态机 + 错误映射；前端只关心 status 三态 + diff 渲染。

二 · 机制

## 4Prompt 设计

### 4.15 条规则的设计意图

Output a SINGLE valid JSON ── 阻止模型输出多份候选 / 解释

NO explanation / markdown / code fence ── 双重保险（虽然 `response_format: json_object` 也强制了）

Preserve original intent ── 关键。明确告诉模型"只修语法，不改值" ── 防止模型"过度修复"（如把空字符串改成 null）

Already-valid JSON returned unchanged ── 避免误触发时输入返回不同的结果（影响 diff 体验）

无法修复时返回特殊标记 `{"_jsonita_repair_failed": true, "reason": "..."}` ── 模型无法修时给出明确信号，前端可以 UI 提示而不是把空对象当成功

### 4.2system + user 模板（核心 ~25 行）

````

// src-tauri/src/ai/prompt.rs ── 纯函数
pub fn system_prompt() -> &'static str {
    r#"You are a JSON repair tool. Your only job is to fix invalid JSON.

RULES:
1. Output a SINGLE valid JSON object or array.
2. Do NOT add any explanation, markdown, code fence, or commentary.
3. Preserve the original intent: keep all keys and values exactly as the user
   typed them, only fix syntax (quotes, commas, brackets, escapes).
4. If the input is already valid JSON, return it unchanged (after standard
   pretty-printing).
5. If repair is impossible, return:
   { "_jsonita_repair_failed": true, "reason": "<short reason>" }

OUTPUT FORMAT: plain JSON text. No prefix, no suffix."#
}

pub fn user_prompt(text: &str, line: Option<u32>, col: Option<u32>, msg: Option<&str>) -> String {
    let mut p = String::from("Fix this JSON:\n\n```\n");
    p.push_str(text);
    p.push_str("\n```\n");
    if let (Some(l), Some(c)) = (line, col) {
        use std::fmt::Write;
        let _ = write!(p, "\nHint: parse error at line {}, column {}", l, c);
        if let Some(m) = msg { let _ = write!(p, " ({})", m); }
        p.push('.');
    }
    p
}

````

error_loc 注入：把 CodeMirror linter 拿到的 line/col/msg 拼进 user prompt。这是显著提升修复准确率的 hint ── 没有这个 hint 时模型经常修错位置。

## 5请求执行流程

### 5.1关键步骤

整体走单次 `ai_fix` command：前端进入 `requesting` loading 状态，Rust 在 60s timeout 内完成 HTTP、状态码映射、响应抽取和二次 JSON 验证后一次性返回结果或错误。

| 步骤 | 动作 | 失败处理 |

| --- | --- | --- |

| 1. 双重开关 | 检查 `settings.ai_enabled` | false 时 early return `AiDisabled` （UI 友好提示"在 Settings 启用 AI Fix"） |

| 2. 取 key | `secrets::get("deepseek_api_key")` | None →`Secrets("no api key")` |

| 3. 构造 body | system + user 拼装 + 设置默认参数 | 纯字符串操作，无失败 |

| 4. 构造 HTTP client | 60s timeout | 构建失败 →`Http { status: 0, body }` |

| 5. POST | reqwest 60s timeout | 网络错 →`Http { status: 0, body }` |

| 6. 状态码分支 | 429 / 5xx / 4xx / 200 | 分别映射为 RateLimit / Http |

| 7. 抽 content | `choices[0].message.content` | 空 → 当成 AiInvalidJson |

| 8. extract + 验证 | `validate::extract_json` + `serde_json::from_str` | 失败 →`AiInvalidJson { raw }` |

### 5.2请求默认参数

| 参数 | 值 | 理由 |

| --- | --- | --- |

| model | `settings.ai_model_id` （默认 `deepseek-chat` ） | plan/01 F7.3 用户可改 |

| temperature | 0.0 | 修复任务无创造性需求，最低温更可控可复现 |

| max_tokens | `clamp(input_chars/3 × 2, 512, 8192)` | 修复后输出 ≈ 输入大小；字符 ÷ 3 ≈ tokens；× 2 留余量 |

| stream | false （v1） | 简化端到端验证；v2 可换流式 |

| response_format | `{ type: "json_object" }` | DeepSeek / OpenAI 兼容，强制返回 JSON |

| request_id | UUID v4 by caller | 幂等去重（前端双击 AI Fix 不重复扣 token） |

### 5.3fix 核心骨架

```

// src-tauri/src/ai/deepseek.rs ── 完整实现见源码；这里只展示骨架
pub async fn fix(settings: &Settings, req: &AiFixReq) -> Result<AiFixResp, JsonitaError> {
    let started = Instant::now();

    // 1-2: 检查开关 + 取 key
    if !settings.ai_enabled {
        return Err(JsonitaError::AiDisabled);
    }
    let key = secrets::get("deepseek_api_key")?
        .ok_or_else(|| JsonitaError::Secrets("no api key".into()))?;

    // 3-4: body + HTTP client
    let body = build_request(req, settings)?;
    let client = reqwest::Client::builder().timeout(Duration::from_secs(60)).build()?;

    // 5-6: HTTP + 状态码分支（完整实现 ~40 行，含 RateLimit / Http 映射）
    let resp = client.post(ENDPOINT).bearer_auth(&key).json(&body).send().await?;

    // 7-8: extract + 验证
    let resp_struct: ChatResponse = resp.json().await
        .map_err(|e| JsonitaError::Http { status: 0, body: e.to_string() })?;
    let content = resp_struct.choices.first()
        .map(|c| c.message.content.clone()).unwrap_or_default();
    let fixed = validate::extract_json(&content)
        .ok_or(JsonitaError::AiInvalidJson { raw: content.clone() })?;
    serde_json::from_str::<serde_json::Value>(&fixed)
        .map_err(|_| JsonitaError::AiInvalidJson { raw: content })?;

    Ok(AiFixResp { fixed, model: resp_struct.model.unwrap_or_default(),
                   tokens_in: ..., tokens_out: ..., elapsed_ms: ... })
}

```

## 6响应验证：extract_json 算法

### 6.1三个 case

虽然 prompt 明确禁止 markdown 包裹，但模型偶尔违反指令。 `extract_json` 用三层 fallback 尽量救回：

| case | 识别 | 抽取 |

| --- | --- | --- |

| 1. 纯 JSON | trim 后首字符是 `{` 或 `[` | 直接返回 |

| 2. ``` 包裹 | 含 ``````````` 或 ```````json```` | 取首个 ``` 与末尾 ``` 之间的内容 |

| 3. 文本中夹带 | 找首个 `{[` 到末尾 `}]` | 子串 |

| 都不行 | — | 返回 None →`AiInvalidJson` |

### 6.2核心 ~25 行

````

// src-tauri/src/ai/validate.rs
pub fn extract_json(raw: &str) -> Option<String> {
    let t = raw.trim();

    // case 1: 直接是 JSON
    if t.starts_with('{') || t.starts_with('[') {
        return Some(t.to_string());
    }

    // case 2: ```json ... ``` 包裹
    if let Some(start) = t.find("```") {
        let after = &t[start+3..];
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
    let last  = t.rfind(|c: char| c == '}' || c == ']')?;
    if last > first { Some(t[first..=last].to_string()) } else { None }
}

````

抽取后还要二次验证：把 `extract_json` 返回的字符串再喂 `serde_json::from_str`，失败仍返 `AiInvalidJson`。"形似 JSON" 不等于 "是合法 JSON"，比如缺末尾 `}`、引号不对称等。

## 7错误透传策略

所有错误都映射到 `JsonitaError` 9 个变体（ [13 § 1](13_schemas.md) ）。本章特有的映射：

| 上游情况 | 映射为 | 调用方信息 |

| --- | --- | --- |

| HTTP 401 | `Http { status: 401, body }` | status + body 摘要 |

| HTTP 429 | `RateLimit { retry_after_sec }` （IPC `retryAfterSec` ） | retry-after 秒数 |

| HTTP 5xx | `Http { status, body }` | status + body 摘要 |

| 网络错（reqwest） | `Http { status: 0, body }` | 错误链摘要 |

| AI 返回不合法 | `AiInvalidJson { raw }` | raw model output |

| 无 API key | `Secrets("no api key")` | 缺失凭据摘要 |

retry-after 透传：429 时优先解析 HTTP `Retry-After` header；缺失则默认 60 秒。这样前端倒计时是 遵守上游真实节奏，而非客户端瞎猜。

## 8Diff 与决策流（前端）

### 8.1状态机

前端 store 三态：

idle ：默认；用户未触发 / 上次已 Accept/Reject

requesting ：fix command 进行中

awaiting-decision ：fix 完成，等待 Accept / Reject

error ：命令失败；保留错误信息，用户可修改输入或设置后重试

状态转换由 `startFix` /`setSuccess` /`setError` /`reset` 触发。

键盘决策与面板状态见 [design/02 § 4](../design/02_interaction.md#4ai-fix-流程仅错误时)。

### 8.2Diff 算法

用 npm 包 `diff` （ `^7.0.0` ） 的 `diffLines`；不引入更重的 monaco-diff（300 KB）。输出按行分类为 `eq / add / del`：

```

// src/panes/diff.ts ── 核心 ~15 行
import { diffLines } from 'diff';

export type DiffLine = { type: 'eq' | 'add' | 'del'; text: string };

export function computeDiff(before: string, after: string): DiffLine[] {
  const parts = diffLines(before, after, { newlineIsToken: false });
  const out: DiffLine[] = [];
  for (const p of parts) {
    const lines = p.value.split(/\n/);
    if (lines[lines.length - 1] === '') lines.pop();
    for (const line of lines) {
      out.push({ type: p.added ? 'add' : p.removed ? 'del' : 'eq', text: line });
    }
  }
  return out;
}

```

### 8.3DiffView 组件 props

组件实现见 `src/panes/DiffView.tsx`；视觉效果见 [design/01 AI Fix DiffView mockup](../design/01_mockups.md)。Props 契约：

| prop | 类型 | 说明 |

| --- | --- | --- |

| before | string | 用户原文 |

| after | string | AI 修复后 |

| onAccept | () => void | 替换编辑器内容 + 写入历史 op_type='ai-fix' |

| onReject | () => void | store.reject() → 回 idle |

## 9测试连接（settings 面板用）

关键设计： `ai_test_connection(apiKey, modelId)` 接收待验证的 key + model 作为参数， 不读 secrets.json 里已存的 key。理由：用户在设置面板输入新 key 时，需要"先测试再保存" ── 如果先入 secrets 再测，失败会污染已存的有效 key。

发一个最小请求："respond with `{"ok":true}` only" + max_tokens=4

200 → ok=true + 返回模型 echo（验证 model id 确实可用）

非 200 → ok=false + 错误码 + 前 120 字 body

独立 timeout 15s（不复用 fix 的 60s）

三 · 契约速查

## 10schema 索引

### 10.1对外类型（IPC）

| 类型 | 定义 |

| --- | --- |

| `AiFixReq` ·`AiFixResp` | [13 § 3.4](13_schemas.md) |

| `TestConnectionResp` | [13 § 3.4](13_schemas.md) |

| `JsonitaError::Http / RateLimit / AiInvalidJson / AiDisabled / Secrets` | [13 § 1](13_schemas.md) |

### 10.2内部 HTTP 协议类型（DeepSeek wire format）

这些 struct 不出现在 IPC 边界，只在 `ai/deepseek.rs` 内部用，因此不进 13 § 3。完整字段映射 OpenAI Chat Completions 协议：

| 类型 | 关键字段 |

| --- | --- |

| `ChatRequest` | model / messages[] / temperature / max_tokens / stream / response_format |

| `ChatMessage` | role: "system" \| "user" / content |

| `ResponseFormat` | type: "json_object" |

| `ChatResponse` | choices[] / usage / model |

| `Choice` | message.content / finish_reason |

| `Usage` | prompt_tokens / completion_tokens |

### 10.3函数签名

```

// src-tauri/src/ai/
pub async fn fix(app: &AppHandle, req: AiFixReq) -> Result<AiFixResp, JsonitaError>;
pub async fn test_connection(api_key: String, model_id: String)
    -> Result<TestConnectionResp, JsonitaError>;

// 纯函数（无 IO）
pub fn system_prompt() -> &'static str;
pub fn user_prompt(text: &str, line: Option<u32>, col: Option<u32>, msg: Option<&str>) -> String;
pub fn extract_json(raw: &str) -> Option<String>;

```

四 · 运行时数字

## 11性能与容量

| 指标 | 目标 | 说明 |

| --- | --- | --- |

| typical fix latency | P50 < 3s / P95 < 8s | 跟随 DeepSeek 当前性能；客户端开销 < 100ms |

| 最大输入 | 100 KB | 大于此值时仍会请求；输入上限提示为保留 UI |

| 请求超时 | 60 s（fix）/ 15 s（test_connection） | reqwest client timeout |

| 进度推送频率 | 500 ms / 次 | tokio::time::interval |

| token 上限 | clamp(512, 8192) | 避免模型截断 / 失控扣费 |
