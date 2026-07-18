//! AI provider HTTP 客户端 —— OpenAI 兼容 与 Anthropic 两种协议。
//!
//! fix() 按 settings.ai_protocol 分派请求体 / 鉴权 / 响应解析；
//! test_connection() 短超时探活。prompt 纯模板；validate 抽取 + 二次验证。

use std::error::Error as StdError;
use std::time::Duration;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::ai::{prompt, validate};
use crate::error::JsonitaError;
use crate::store::{secrets, SettingsStore};
use crate::types::{AiProtocol, Settings};

const TIMEOUT_SEC: u64 = 60;
const TEST_TIMEOUT_SEC: u64 = 15;
const ANTHROPIC_VERSION: &str = "2023-06-01";

/// 当前 secret account；旧版用 `deepseek_api_key`，读时兜底、删时一并清。
pub const AI_ACCOUNT: &str = "ai_api_key";
pub const LEGACY_ACCOUNT: &str = "deepseek_api_key";

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

/// 一次补全的归一化结果，屏蔽协议差异。
struct Completion {
    content: String,
    model: String,
    tokens_in: u32,
    tokens_out: u32,
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
    if settings.ai_base_url.trim().is_empty() || settings.ai_model_id.trim().is_empty() {
        return Err(JsonitaError::Secrets("ai base url / model not configured".into()));
    }
    let key = get_api_key()?.ok_or_else(|| JsonitaError::Secrets("no api key".into()))?;

    let started = std::time::Instant::now();
    let max_tokens = if settings.ai_max_tokens > 0 {
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

    let completion = match settings.ai_protocol {
        AiProtocol::OpenAi => {
            openai_call(&settings.ai_base_url, &settings.ai_model_id, &key, system, user, max_tokens, thinking)
                .await?
        }
        AiProtocol::Anthropic => {
            anthropic_call(&settings.ai_base_url, &settings.ai_model_id, &key, system, user, max_tokens, thinking)
                .await?
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
        let _ = resp.text().await;
        return Err(JsonitaError::Http { status: code, body: http_hint(code).to_string() });
    }
    Ok(resp)
}

pub async fn fix_via_store(store: &SettingsStore, req: AiFixReq) -> Result<AiFixResp, JsonitaError> {
    let s = store.get();
    fix(&s, &req).await
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
}
