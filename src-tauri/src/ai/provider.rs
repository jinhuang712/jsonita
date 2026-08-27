//! AI provider HTTP 客户端 —— OpenAI 兼容 / Anthropic / OpenCode Zen。
//!
//! fix() 按 settings.ai_provider 分派：Zen 零配置免费层（匿名可调）或 Custom（OpenAI/Anthropic BYO）。
//! Zen 免费模型通过 https://opencode.ai/zen/v1/models 动态发现，*-free + big-pickle 视为免费。

use std::error::Error as StdError;
use std::time::Duration;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::ai::{prompt, validate};
use crate::error::JsonitaError;
use crate::store::{secrets, SettingsStore};
use crate::types::{AiProvider, AiProtocol, Settings};

const TIMEOUT_SEC: u64 = 60;
const TEST_TIMEOUT_SEC: u64 = 15;
const ANTHROPIC_VERSION: &str = "2023-06-01";

const ZEN_CHAT_ENDPOINT: &str = "https://opencode.ai/zen/v1/chat/completions";
const ZEN_RESPONSES_ENDPOINT: &str = "https://opencode.ai/zen/v1/responses";
const ZEN_MODELS_URL: &str = "https://opencode.ai/zen/v1/models";
const OPENROUTER_MODELS_URL: &str = "https://openrouter.ai/api/v1/models";

/// 当前 secret account；旧版用 `deepseek_api_key`，读时兜底、删时一并清。
pub const AI_ACCOUNT: &str = "ai_api_key";
pub const LEGACY_ACCOUNT: &str = "deepseek_api_key";

/// Zen 免费模型硬编码兜底（当 /v1/models 拉取失败时）。
const ZEN_FREE_FALLBACK: &[&str] = &[
    "hy3-free",
    "mimo-v2.5-free",
    "nemotron-3.5-lightning-free",
    "nemotron-3-ultra-free",
    "big-pickle",
    "muse-spark-1.2-contributor-free",
    "deepseek-v4-flash-free",
    "laguna-s-2.1-free",
];

const OPENROUTER_FALLBACK_LIT: &[&str] = &[
    "openai/gpt-4o",
    "inclusionai/ling-3.0-flash-fin:free",
    "dots-studio/dots-3-note-preview:free",
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "thinkingmachines/inkling-small:free",
    "poolside/laguna-s-2.1:free",
    "thinkingmachines/inkling:free",
    "poolside/laguna-xs-2.1:free",
    "cohere/north-mini-code:free",
    "z-ai/glm-5.2:free",
    "nvidia/nemotron-3.5-content-safety:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "minimax/minimax-m2.7:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
];

/// reqwest 错误链展开 —— 否则只拿顶层 "error sending request"，丢了根因。
fn err_chain(e: &reqwest::Error) -> String {
    let mut s = e.to_string();
    let mut src: Option<&dyn StdError> = e.source();
    while let Some(inner) = src {
        s.push_str(" → ");
        s.push_str(&inner.to_string());
        src = inner.source();
    }
    s
}

// ── secret 读写：ai_api_key 优先，deepseek_api_key 兜底 ──────────────

pub fn get_api_key() -> Result<Option<String>, JsonitaError> {
    if let Some(k) = secrets::get(AI_ACCOUNT)? {
        return Ok(Some(k));
    }
    secrets::get(LEGACY_ACCOUNT)
}

pub fn set_api_key(key: &str) -> Result<(), JsonitaError> {
    secrets::set(AI_ACCOUNT, key)
}

/// 删两个 account —— 只删新名会让旧 `deepseek_api_key` 经 fallback 复活。
pub fn delete_api_key() -> Result<(), JsonitaError> {
    secrets::delete(AI_ACCOUNT)?;
    secrets::delete(LEGACY_ACCOUNT)?;
    Ok(())
}

pub fn has_api_key() -> bool {
    get_api_key().ok().flatten().is_some()
}

// ── IPC 类型 ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFixReq {
    pub text: String,
    pub error_line: Option<u32>,
    pub error_col: Option<u32>,
    pub error_msg: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFixResp {
    pub fixed: String,
    pub model: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub elapsed_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResp {
    pub ok: bool,
    pub latency_ms: u64,
    pub model_echoed: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenModelInfo {
    pub id: String,
    pub free: bool,
    pub endpoint: String,
}

// ── wire 结构 ────────────────────────────────────────────────────

/// `{"type":"disabled"}` —— 火山 OpenAI 兼容 与 Anthropic 端点都认，用于关闭推理模型的 thinking。
#[derive(Serialize, Clone, Copy)]
struct ThinkingParam {
    #[serde(rename = "type")]
    kind: &'static str,
}

#[derive(Serialize)]
struct OpenAiRequest<'a> {
    model: &'a str,
    messages: Vec<OpenAiMessage<'a>>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking: Option<ThinkingParam>,
}

#[derive(Serialize)]
struct OpenAiMessage<'a> {
    role: &'a str,
    content: String,
}

#[derive(Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
    #[serde(default)]
    model: Option<String>,
    #[serde(default)]
    usage: Option<OpenAiUsage>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiChoiceMessage,
}

#[derive(Deserialize)]
struct OpenAiChoiceMessage {
    content: String,
}

#[derive(Deserialize, Default)]
struct OpenAiUsage {
    #[serde(default)]
    prompt_tokens: u32,
    #[serde(default)]
    completion_tokens: u32,
}

#[derive(Serialize)]
struct AnthropicRequest<'a> {
    model: &'a str,
    max_tokens: u32,
    system: String,
    messages: Vec<AnthropicMessage>,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    thinking: Option<ThinkingParam>,
}

#[derive(Serialize)]
struct AnthropicMessage {
    role: &'static str,
    content: String,
}

#[derive(Deserialize)]
struct AnthropicResponse {
    #[serde(default)]
    content: Vec<AnthropicBlock>,
    #[serde(default)]
    model: Option<String>,
    #[serde(default)]
    usage: Option<AnthropicUsage>,
}

#[derive(Deserialize)]
struct AnthropicBlock {
    #[serde(default)]
    text: String,
}

#[derive(Deserialize, Default)]
struct AnthropicUsage {
    #[serde(default)]
    input_tokens: u32,
    #[serde(default)]
    output_tokens: u32,
}

// Zen Responses API
#[derive(Serialize)]
struct ZenResponsesRequest {
    model: String,
    input: Vec<ZenResponsesInput>,
    temperature: f32,
    max_output_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    reasoning: Option<ZenReasoningParam>,
}

#[derive(Serialize)]
struct ZenResponsesInput {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ZenReasoningParam {
    effort: String,
}

/// 一次补全的归一化结果，屏蔽协议差异。
struct Completion {
    content: String,
    model: String,
    tokens_in: u32,
    tokens_out: u32,
}

// ── helpers ──────────────────────────────────────────────────────

fn is_zen_free_model(id: &str) -> bool {
    id.ends_with("-free") || id == "big-pickle"
}

fn zen_endpoint_for_model(model_id: &str) -> &'static str {
    if model_id == "muse-spark-1.2-contributor-free" {
        ZEN_RESPONSES_ENDPOINT
    } else {
        ZEN_CHAT_ENDPOINT
    }
}

fn is_responses_model(model_id: &str) -> bool {
    zen_endpoint_for_model(model_id) == ZEN_RESPONSES_ENDPOINT
}

// ── client ──────────────────────────────────────────────────────

/// 绕过系统代理：macOS `open` 启动 app 会继承 shell 的 *_proxy 变量，
/// 但 app 进程内代理端口不可达 → Connection refused。reqwest 的 no_proxy() 已足够；
/// 不再改进程 env（多线程下 remove_var 与并发 getenv 有数据竞争，且 no_proxy 已覆盖）。
fn build_client(timeout_sec: u64) -> Result<reqwest::Client, JsonitaError> {
    reqwest::Client::builder()
        .no_proxy()
        .timeout(Duration::from_secs(timeout_sec))
        .build()
        .map_err(|e| JsonitaError::Http {
            status: 0,
            body: err_chain(&e),
        })
}

// max_tokens 估算：输出约等于输入，字符÷3≈tokens，×2 留余量。
fn estimate_max_tokens(text: &str) -> u32 {
    ((text.chars().count() as f32 / 3.0) * 2.0).clamp(512.0, 8192.0) as u32
}

// 用户填的可能是「Base URL」(火山方舟等厂商控制台给的是 .../api/coding 这类基础地址)，
// 也可能是完整端点 (.../v1/messages)。各厂商约定由客户端在 Base URL 后拼协议标准路径，
// 用户无从得知，故在此补齐；已是完整端点则原样用，避免重复拼、也向后兼容老配置。
fn anthropic_endpoint(url: &str) -> String {
    let base = url.trim().trim_end_matches('/');
    if base.ends_with("/messages") {
        base.to_string()
    } else {
        format!("{base}/v1/messages")
    }
}

fn openai_endpoint(url: &str) -> String {
    let base = url.trim().trim_end_matches('/');
    if base.ends_with("/completions") {
        base.to_string()
    } else {
        format!("{base}/chat/completions")
    }
}

pub async fn fix(settings: &Settings, req: &AiFixReq) -> Result<AiFixResp, JsonitaError> {
    if !settings.ai_enabled {
        return Err(JsonitaError::AiDisabled);
    }

    let started = std::time::Instant::now();
    let mut max_tokens = if settings.ai_max_tokens > 0 {
        settings.ai_max_tokens
    } else {
        estimate_max_tokens(&req.text)
    };
    // 关 thinking 时下发 {"type":"disabled"}；开则不带该参数、用模型默认。
    let thinking = if settings.ai_thinking {
        None
    } else {
        Some(ThinkingParam { kind: "disabled" })
    };
    let system = prompt::system_prompt().to_string();
    let user = prompt::user_prompt(&req.text, req.error_line, req.error_col, req.error_msg.as_deref());

    let completion = match settings.ai_provider {
        AiProvider::Zen => {
            let primary = settings.ai_zen_model_id.trim().to_string();
            if primary.is_empty() {
                return Err(JsonitaError::Secrets("zen model not configured".into()));
            }
            // 构建回退队列：首选模型 + 其余免费模型（去重）
            let mut candidates: Vec<String> = Vec::new();
            candidates.push(primary.clone());
            for &fallback in ZEN_FREE_FALLBACK {
                if fallback != primary {
                    candidates.push(fallback.to_string());
                }
            }
            let mut last_err: Option<JsonitaError> = None;
            let mut completion_opt: Option<Completion> = None;
            for model in candidates {
                let mut try_max = max_tokens;
                if is_responses_model(&model) {
                    try_max = try_max.max(1024);
                }
                let key: Option<&str> = None;
                let zen_thinking = Some(ThinkingParam { kind: "disabled" });
                match zen_call(&model, key, system.clone(), user.clone(), try_max, zen_thinking).await {
                    Ok(c) => {
                        completion_opt = Some(c);
                        break;
                    }
                    Err(JsonitaError::RateLimit { retry_after_sec }) => {
                        last_err = Some(JsonitaError::RateLimit { retry_after_sec });
                        continue; // 免费限流，自动试下一个
                    }
                    Err(e) => {
                        // 401/其他错误直接透出（避免用错误模型掩盖真实问题）
                        // 但若是当前模型非首选且失败，仍尝试下一个 free
                        if model == primary {
                            return Err(e);
                        } else {
                            last_err = Some(e);
                            continue;
                        }
                    }
                }
            }
            match completion_opt {
                Some(c) => c,
                None => return Err(last_err.unwrap_or(JsonitaError::RateLimit { retry_after_sec: 60 })),
            }
        }
        AiProvider::Custom => {
            if settings.ai_base_url.trim().is_empty() || settings.ai_model_id.trim().is_empty() {
                return Err(JsonitaError::Secrets("ai base url / model not configured".into()));
            }
            let key = get_api_key()?.ok_or_else(|| JsonitaError::Secrets("no api key".into()))?;
            match settings.ai_protocol {
                AiProtocol::OpenAi => {
                    openai_call(&settings.ai_base_url, &settings.ai_model_id, &key, system, user, max_tokens, thinking)
                        .await?
                }
                AiProtocol::Anthropic => {
                    anthropic_call(&settings.ai_base_url, &settings.ai_model_id, &key, system, user, max_tokens, thinking)
                        .await?
                }
            }
        }
    };

    let extracted = validate::extract_json(&completion.content)
        .ok_or_else(|| JsonitaError::AiInvalidJson { raw: completion.content.clone() })?;
    let value = serde_json::from_str::<serde_json::Value>(&extracted)
        .map_err(|_| JsonitaError::AiInvalidJson { raw: completion.content.clone() })?;
    if validate::is_repair_failed_sentinel(&value) {
        let reason = validate::repair_failed_reason(&value).unwrap_or_default();
        return Err(JsonitaError::AiCannotRepair { reason });
    }

    Ok(AiFixResp {
        fixed: extracted,
        model: completion.model,
        tokens_in: completion.tokens_in,
        tokens_out: completion.tokens_out,
        elapsed_ms: started.elapsed().as_millis() as u64,
    })
}

async fn zen_call(
    model: &str,
    key: Option<&str>,
    system: String,
    user: String,
    max_tokens: u32,
    thinking: Option<ThinkingParam>,
) -> Result<Completion, JsonitaError> {
    if is_responses_model(model) {
        zen_responses_call(model, key, system, user, max_tokens).await
    } else {
        zen_chat_call(model, key, system, user, max_tokens, thinking).await
    }
}

async fn zen_chat_call(
    model: &str,
    key: Option<&str>,
    system: String,
    user: String,
    max_tokens: u32,
    thinking: Option<ThinkingParam>,
) -> Result<Completion, JsonitaError> {
    let body = OpenAiRequest {
        model,
        messages: vec![
            OpenAiMessage { role: "system", content: system },
            OpenAiMessage { role: "user", content: user },
        ],
        temperature: 0.0,
        max_tokens,
        stream: false,
        thinking,
    };
    let client = build_client(TIMEOUT_SEC)?;
    let mut req = client.post(ZEN_CHAT_ENDPOINT).json(&body);
    if let Some(k) = key.filter(|k| !k.is_empty()) {
        req = req.bearer_auth(k);
    }
    let resp = req
        .send()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: err_chain(&e) })?;
    let resp = check_status(resp).await?;
    let parsed: OpenAiResponse = resp
        .json()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: e.to_string() })?;
    let content = parsed
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();
    let usage = parsed.usage.unwrap_or_default();
    Ok(Completion {
        content,
        model: parsed.model.unwrap_or_else(|| model.to_string()),
        tokens_in: usage.prompt_tokens,
        tokens_out: usage.completion_tokens,
    })
}

async fn zen_responses_call(
    model: &str,
    key: Option<&str>,
    system: String,
    user: String,
    max_tokens: u32,
) -> Result<Completion, JsonitaError> {
    // Zen Responses 固定用 input 数组，JSON 修复关思考以省时（minimal）
    let body = ZenResponsesRequest {
        model: model.to_string(),
        input: vec![
            ZenResponsesInput { role: "system".to_string(), content: system },
            ZenResponsesInput { role: "user".to_string(), content: user },
        ],
        temperature: 0.0,
        max_output_tokens: max_tokens,
        reasoning: Some(ZenReasoningParam { effort: "minimal".to_string() }),
    };
    let client = build_client(TIMEOUT_SEC)?;
    let mut req = client.post(ZEN_RESPONSES_ENDPOINT).json(&body);
    if let Some(k) = key.filter(|k| !k.is_empty()) {
        req = req.bearer_auth(k);
    }
    let resp = req
        .send()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: err_chain(&e) })?;
    let resp = check_status(resp).await?;
    let value: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: e.to_string() })?;

    // 解析 Responses JSON：output[message].content[output_text].text
    let mut content = String::new();
    if let Some(outputs) = value.get("output").and_then(|v| v.as_array()) {
        for out in outputs {
            if out.get("type").and_then(|v| v.as_str()) == Some("message") {
                if let Some(contents) = out.get("content").and_then(|v| v.as_array()) {
                    for c in contents {
                        if c.get("type").and_then(|v| v.as_str()) == Some("output_text") {
                            if let Some(t) = c.get("text").and_then(|v| v.as_str()) {
                                content.push_str(t);
                            }
                        }
                    }
                }
            }
        }
    }
    // fallback: 若未按上述结构，尝试直接取 output_text 顶层
    if content.is_empty() {
        if let Some(t) = value
            .pointer("/output/1/content/0/text")
            .and_then(|v| v.as_str())
        {
            content = t.to_string();
        }
    }

    let model_echoed = value
        .get("model")
        .and_then(|v| v.as_str())
        .unwrap_or(model)
        .to_string();
    let usage = value.get("usage");
    let tokens_in = usage
        .and_then(|u| u.get("input_tokens"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;
    let tokens_out = usage
        .and_then(|u| u.get("output_tokens"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as u32;
    // 检测错误体：若 status != completed 且有 error
    if content.is_empty() {
        if let Some(status) = value.get("status").and_then(|v| v.as_str()) {
            if status != "completed" {
                if let Some(err) = value.get("error").and_then(|v| v.as_str()) {
                    return Err(JsonitaError::Http {
                        status: 500,
                        body: err.to_string(),
                    });
                }
            }
        }
    }
    Ok(Completion {
        content,
        model: model_echoed,
        tokens_in,
        tokens_out,
    })
}

async fn openai_call(
    url: &str,
    model: &str,
    key: &str,
    system: String,
    user: String,
    max_tokens: u32,
    thinking: Option<ThinkingParam>,
) -> Result<Completion, JsonitaError> {
    let body = OpenAiRequest {
        model,
        messages: vec![
            OpenAiMessage { role: "system", content: system },
            OpenAiMessage { role: "user", content: user },
        ],
        temperature: 0.0,
        max_tokens,
        stream: false,
        thinking,
    };
    let client = build_client(TIMEOUT_SEC)?;
    let resp = client
        .post(openai_endpoint(url))
        .bearer_auth(key)
        .json(&body)
        .send()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: err_chain(&e) })?;
    let resp = check_status(resp).await?;
    let parsed: OpenAiResponse = resp
        .json()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: e.to_string() })?;
    let content = parsed
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();
    let usage = parsed.usage.unwrap_or_default();
    Ok(Completion {
        content,
        model: parsed.model.unwrap_or_default(),
        tokens_in: usage.prompt_tokens,
        tokens_out: usage.completion_tokens,
    })
}

async fn anthropic_call(
    url: &str,
    model: &str,
    key: &str,
    system: String,
    user: String,
    max_tokens: u32,
    thinking: Option<ThinkingParam>,
) -> Result<Completion, JsonitaError> {
    let body = AnthropicRequest {
        model,
        max_tokens,
        system,
        messages: vec![AnthropicMessage { role: "user", content: user }],
        temperature: 0.0,
        thinking,
    };
    let client = build_client(TIMEOUT_SEC)?;
    // 官方 API 认 x-api-key；火山方舟等 Anthropic 协议兼容端点走 Authorization: Bearer；两个都发,各端点只看自己认的那个。
    let resp = client
        .post(anthropic_endpoint(url))
        .header("x-api-key", key)
        .header("authorization", format!("Bearer {key}"))
        .header("anthropic-version", ANTHROPIC_VERSION)
        .json(&body)
        .send()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: err_chain(&e) })?;
    let resp = check_status(resp).await?;
    let parsed: AnthropicResponse = resp
        .json()
        .await
        .map_err(|e| JsonitaError::Http { status: 0, body: e.to_string() })?;
    let content = parsed
        .content
        .iter()
        .map(|b| b.text.as_str())
        .collect::<String>();
    let usage = parsed.usage.unwrap_or_default();
    Ok(Completion {
        content,
        model: parsed.model.unwrap_or_default(),
        tokens_in: usage.input_tokens,
        tokens_out: usage.output_tokens,
    })
}

async fn check_status(resp: reqwest::Response) -> Result<reqwest::Response, JsonitaError> {
    let status = resp.status();
    if status == StatusCode::TOO_MANY_REQUESTS {
        let retry_after_sec = resp
            .headers()
            .get("retry-after")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(60);
        return Err(JsonitaError::RateLimit { retry_after_sec });
    }
    if !status.is_success() {
        // 不透传上游原始 body（可能含 request id、回显的用户文档、鉴权字样）；
        // 与 test_connection 一致，只回状态码 + 简短归因。
        let code = status.as_u16();
        // 尝试解析 FreeUsageLimitError 以归因更准，但不透传细节
        let _ = resp.text().await;
        return Err(JsonitaError::Http { status: code, body: http_hint(code).to_string() });
    }
    Ok(resp)
}

pub async fn fix_via_store(store: &SettingsStore, req: AiFixReq) -> Result<AiFixResp, JsonitaError> {
    let s = store.get();
    fix(&s, &req).await
}

// ── list zen models ───────────────────────────────────────────────

#[derive(Deserialize)]
struct ZenModelsResponse {
    data: Vec<ZenModelEntry>,
}

#[derive(Deserialize)]
struct ZenModelEntry {
    id: String,
}

pub async fn list_zen_models() -> Result<Vec<ZenModelInfo>, JsonitaError> {
    let client = build_client(TEST_TIMEOUT_SEC)?;
    let resp = match client.get(ZEN_MODELS_URL).send().await {
        Ok(r) => r,
        Err(_) => return fallback_zen_models(),
    };
    if !resp.status().is_success() {
        let _ = resp.text().await;
        return fallback_zen_models();
    }
    let parsed: ZenModelsResponse = match resp.json().await {
        Ok(p) => p,
        Err(_) => return fallback_zen_models(),
    };
    let mut out: Vec<ZenModelInfo> = parsed
        .data
        .into_iter()
        .map(|e| {
            let free = is_zen_free_model(&e.id);
            ZenModelInfo {
                endpoint: zen_endpoint_for_model(&e.id).to_string(),
                id: e.id,
                free,
            }
        })
        .collect();
    // 免费优先、ID 字典序稳定
    out.sort_by(|a, b| match b.free.cmp(&a.free) {
        std::cmp::Ordering::Equal => a.id.cmp(&b.id),
        other => other,
    });
    if out.is_empty() {
        return fallback_zen_models();
    }
    Ok(out)
}

fn fallback_zen_models() -> Result<Vec<ZenModelInfo>, JsonitaError> {
    let mut out: Vec<ZenModelInfo> = ZEN_FREE_FALLBACK
        .iter()
        .map(|id| ZenModelInfo {
            id: id.to_string(),
            free: true,
            endpoint: zen_endpoint_for_model(id).to_string(),
        })
        .collect();
    out.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(out)
}

pub async fn list_zen_free_models() -> Result<Vec<ZenModelInfo>, JsonitaError> {
    let all = list_zen_models().await?;
    Ok(all.into_iter().filter(|m| m.free).collect())
}

// ── list openrouter models ───────────────────────────────────────

#[derive(Deserialize)]
struct OpenRouterModelsResponse {
    data: Vec<OpenRouterModelEntry>,
}

#[derive(Deserialize)]
struct OpenRouterModelEntry {
    id: String,
}

pub async fn list_openrouter_models(api_key: Option<String>) -> Result<Vec<ZenModelInfo>, JsonitaError> {
    let client = build_client(TEST_TIMEOUT_SEC)?;
    // 带 Key 拉更多模型（按账户额度过滤）；匿名拉也 OK，列表较精简
    let key = api_key.and_then(|k| if k.trim().is_empty() { None } else { Some(k) });
    let mut req = client.get(OPENROUTER_MODELS_URL);
    if let Some(k) = &key {
        req = req.bearer_auth(k);
    }
    let resp = match req.send().await {
        Ok(r) => r,
        Err(_) => return fallback_openrouter_models(),
    };
    if !resp.status().is_success() {
        let _ = resp.text().await;
        return fallback_openrouter_models();
    }
    let parsed: OpenRouterModelsResponse = match resp.json().await {
        Ok(p) => p,
        Err(_) => return fallback_openrouter_models(),
    };
    let mut out: Vec<ZenModelInfo> = parsed
        .data
        .into_iter()
        .map(|e| {
            let free = e.id.ends_with(":free");
            ZenModelInfo {
                id: e.id,
                free,
                endpoint: "https://openrouter.ai/api/v1/chat/completions".to_string(),
            }
        })
        .collect();
    // 付费优先、free 跟随，按 id 字典序稳定
    out.sort_by(|a, b| match b.free.cmp(&a.free) {
        std::cmp::Ordering::Equal => a.id.cmp(&b.id),
        other => other,
    });
    if out.is_empty() {
        return fallback_openrouter_models();
    }
    Ok(out)
}

pub async fn list_openrouter_free_models(api_key: Option<String>) -> Result<Vec<ZenModelInfo>, JsonitaError> {
    let all = list_openrouter_models(api_key).await?;
    Ok(all.into_iter().filter(|m| m.free).collect())
}

fn fallback_openrouter_models() -> Result<Vec<ZenModelInfo>, JsonitaError> {
    Ok(OPENROUTER_FALLBACK_LIT.iter().map(|id| ZenModelInfo {
        id: (*id).to_string(),
        free: id.ends_with(":free"),
        endpoint: "https://openrouter.ai/api/v1/chat/completions".to_string(),
    }).collect())
}

// ── test connection ──────────────────────────────────────────────

/// 协议感知探活：max_tokens=1 的 ping。不读 secrets（用当前编辑中的 key），
/// 成本 ≤ 1 token。调用方负责成功后保存 key。
pub async fn test_connection(
    protocol: AiProtocol,
    base_url: &str,
    model: &str,
    api_key: &str,
) -> TestConnectionResp {
    if api_key.is_empty() {
        return fail("empty api key");
    }
    if base_url.trim().is_empty() {
        return fail("empty api url");
    }
    if model.trim().is_empty() {
        return fail("empty model name");
    }

    let client = match build_client(TEST_TIMEOUT_SEC) {
        Ok(c) => c,
        Err(e) => return fail(&format!("client build failed: {e:?}")),
    };

    let started = std::time::Instant::now();
    let request = match protocol {
        AiProtocol::OpenAi => client
            .post(openai_endpoint(base_url))
            .bearer_auth(api_key)
            .json(&serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1,
                "stream": false,
            })),
        AiProtocol::Anthropic => client
            .post(anthropic_endpoint(base_url))
            .header("x-api-key", api_key)
            .header("authorization", format!("Bearer {api_key}"))
            .header("anthropic-version", ANTHROPIC_VERSION)
            .json(&serde_json::json!({
                "model": model,
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "ping"}],
            })),
    };

    let resp = request.send().await;
    let latency_ms = started.elapsed().as_millis() as u64;

    match resp {
        Ok(r) if r.status().is_success() => {
            let json: serde_json::Value = r.json().await.unwrap_or(serde_json::Value::Null);
            let echoed = json
                .get("model")
                .and_then(|v| v.as_str())
                .unwrap_or(model)
                .to_string();
            TestConnectionResp { ok: true, latency_ms, model_echoed: echoed }
        }
        Ok(r) => {
            let status = r.status().as_u16();
            // 只回状态 + 简短归因，不透传服务端原始 body（含 request id / AK-SK 字样等）。
            let _ = r.text().await;
            TestConnectionResp { ok: false, latency_ms, model_echoed: http_reason(status) }
        }
        Err(_) => {
            TestConnectionResp { ok: false, latency_ms, model_echoed: "connection failed".into() }
        }
    }
}

/// Zen 探活：支持匿名 free 模型。key 可空；model 决定 endpoint。
pub async fn test_zen_connection(model_id: &str, api_key: Option<String>) -> TestConnectionResp {
    let model = model_id.trim();
    if model.is_empty() {
        return fail("empty model name");
    }
    let client = match build_client(TEST_TIMEOUT_SEC) {
        Ok(c) => c,
        Err(e) => return fail(&format!("client build failed: {e:?}")),
    };
    let started = std::time::Instant::now();
    let is_resp = is_responses_model(model);
    let key = api_key.as_deref().filter(|k| !k.is_empty());
    let request = if is_resp {
        let body = serde_json::json!({
            "model": model,
            "input": "ping",
            "max_output_tokens": 1
        });
        let mut r = client.post(ZEN_RESPONSES_ENDPOINT).json(&body);
        if let Some(k) = key {
            r = r.bearer_auth(k);
        }
        r
    } else {
        let body = serde_json::json!({
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1,
            "stream": false,
            "thinking": {"type": "disabled"}
        });
        let mut r = client.post(ZEN_CHAT_ENDPOINT).json(&body);
        if let Some(k) = key {
            r = r.bearer_auth(k);
        }
        r
    };
    let resp = request.send().await;
    let latency_ms = started.elapsed().as_millis() as u64;
    match resp {
        Ok(r) if r.status().is_success() => {
            let json: serde_json::Value = r.json().await.unwrap_or(serde_json::Value::Null);
            let echoed = json
                .get("model")
                .and_then(|v| v.as_str())
                .or_else(|| json.get("id").and_then(|v| v.as_str()))
                .unwrap_or(model)
                .to_string();
            TestConnectionResp { ok: true, latency_ms, model_echoed: echoed }
        }
        Ok(r) => {
            let status = r.status().as_u16();
            let _ = r.text().await;
            TestConnectionResp { ok: false, latency_ms, model_echoed: http_reason(status) }
        }
        Err(_) => TestConnectionResp { ok: false, latency_ms, model_echoed: "connection failed".into() },
    }
}

/// 状态码 → 简短、不泄露细节的归因短语（不含状态码本身）。
fn http_hint(status: u16) -> &'static str {
    match status {
        401 | 403 => "authentication failed",
        404 => "endpoint or model not found",
        408 => "request timed out",
        429 => "rate limited",
        500..=599 => "server error",
        _ => "request failed",
    }
}

/// 状态码 → 简短、不泄露细节的归因。
fn http_reason(status: u16) -> String {
    format!("HTTP {status} · {}", http_hint(status))
}

fn fail(msg: &str) -> TestConnectionResp {
    TestConnectionResp { ok: false, latency_ms: 0, model_echoed: msg.to_string() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn anthropic_endpoint_appends_path_to_base_url() {
        // 火山方舟等控制台给的是 Base URL，需补 /v1/messages
        assert_eq!(
            anthropic_endpoint("https://ark.cn-beijing.volces.com/api/coding"),
            "https://ark.cn-beijing.volces.com/api/coding/v1/messages"
        );
        // 尾部斜杠不产生双斜杠
        assert_eq!(
            anthropic_endpoint("https://api.anthropic.com/"),
            "https://api.anthropic.com/v1/messages"
        );
    }

    #[test]
    fn anthropic_endpoint_keeps_full_endpoint() {
        // 已是完整端点则原样用，向后兼容老配置与 UI 占位符
        assert_eq!(
            anthropic_endpoint("https://api.anthropic.com/v1/messages"),
            "https://api.anthropic.com/v1/messages"
        );
        assert_eq!(
            anthropic_endpoint("https://api.anthropic.com/v1/messages/"),
            "https://api.anthropic.com/v1/messages"
        );
    }

    #[test]
    fn openai_endpoint_appends_path_to_base_url() {
        assert_eq!(
            openai_endpoint("https://ark.cn-beijing.volces.com/api/coding/v3"),
            "https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions"
        );
    }

    #[test]
    fn openai_endpoint_keeps_full_endpoint() {
        assert_eq!(
            openai_endpoint("https://api.openai.com/v1/chat/completions"),
            "https://api.openai.com/v1/chat/completions"
        );
    }

    #[test]
    fn zen_free_detection() {
        assert!(is_zen_free_model("hy3-free"));
        assert!(is_zen_free_model("mimo-v2.5-free"));
        assert!(is_zen_free_model("big-pickle"));
        assert!(!is_zen_free_model("gpt-5"));
        assert!(!is_zen_free_model("deepseek-v4-pro"));
    }

    #[test]
    fn zen_endpoint_routing() {
        assert_eq!(zen_endpoint_for_model("hy3-free"), ZEN_CHAT_ENDPOINT);
        assert_eq!(
            zen_endpoint_for_model("muse-spark-1.2-contributor-free"),
            ZEN_RESPONSES_ENDPOINT
        );
        assert_eq!(zen_endpoint_for_model("big-pickle"), ZEN_CHAT_ENDPOINT);
    }
}
