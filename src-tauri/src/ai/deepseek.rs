//! DeepSeek HTTP 客户端 ── spec/M02-ai-repair.md 请求流程与默认参数。
//!
//! M2-N3 minimal：fix() 主流程 + 状态码分支 + extract+二次验证；
//! 心跳进度推送 / 重试 / 复杂错误透传留 polish。

use std::error::Error as StdError;
use std::time::Duration;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

/// reqwest 错误链展开 ── 否则 `e.to_string()` 只拿顶层 "error sending request for url (...)"，
/// 丢了真正根因（connect refused / dns / tls / proxy unreachable 等）。
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

use crate::ai::{prompt, validate};
use crate::error::JsonitaError;
use crate::store::{secrets, SettingsStore};
use crate::types::Settings;

const ENDPOINT: &str = "https://api.deepseek.com/chat/completions";
const TIMEOUT_SEC: u64 = 60;
const DEEPSEEK_ACCOUNT: &str = "deepseek_api_key";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFixReq {
    pub text: String,
    pub error_line: Option<u32>,
    pub error_col: Option<u32>,
    pub error_msg: Option<String>,
    pub request_id: String,
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

#[derive(Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: Vec<ChatMessage<'a>>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
}

#[derive(Serialize)]
struct ChatMessage<'a> {
    role: &'a str,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
    #[serde(default)]
    model: Option<String>,
    #[serde(default)]
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct Choice {
    message: ChoiceMessage,
}

#[derive(Deserialize)]
struct ChoiceMessage {
    content: String,
}

#[derive(Deserialize)]
struct Usage {
    #[serde(default)]
    prompt_tokens: u32,
    #[serde(default)]
    completion_tokens: u32,
}

pub async fn fix(settings: &Settings, req: &AiFixReq) -> Result<AiFixResp, JsonitaError> {
    if !settings.ai_enabled {
        return Err(JsonitaError::AiDisabled);
    }
    let key = secrets::get(DEEPSEEK_ACCOUNT)?
        .ok_or_else(|| JsonitaError::Secrets("no api key".into()))?;

    let started = std::time::Instant::now();

    // max_tokens 估算：输出约等于输入，字符÷3≈tokens，×2 留余量。
    let max_tokens = ((req.text.chars().count() as f32 / 3.0) * 2.0).clamp(512.0, 8192.0) as u32;

    let body = ChatRequest {
        model: &settings.ai_model_id,
        messages: vec![
            ChatMessage {
                role: "system",
                content: prompt::system_prompt().to_string(),
            },
            ChatMessage {
                role: "user",
                content: prompt::user_prompt(
                    &req.text,
                    req.error_line,
                    req.error_col,
                    req.error_msg.as_deref(),
                ),
            },
        ],
        temperature: 0.0,
        max_tokens,
        stream: false,
    };

    // 绕过系统代理：macOS open 命令启动 app 会继承 shell 环境中的
    // http_proxy/https_proxy/HTTP_PROXY/HTTPS_PROXY，导致 reqwest 走本地代理，
    // 但 app 进程内代理端口不可达 → Connection refused。
    // no_proxy() + env var 双重保险。
    for var in &["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"] {
        std::env::remove_var(var);
    }
    let client = reqwest::Client::builder()
        .no_proxy()
        .timeout(Duration::from_secs(TIMEOUT_SEC))
        .build()
        .map_err(|e| JsonitaError::Http {
            status: 0,
            body: err_chain(&e),
        })?;

    let resp = client
        .post(ENDPOINT)
        .bearer_auth(&key)
        .json(&body)
        .send()
        .await
        .map_err(|e| JsonitaError::Http {
            status: 0,
            body: err_chain(&e),
        })?;

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
        let body = resp.text().await.unwrap_or_default();
        return Err(JsonitaError::Http {
            status: status.as_u16(),
            body,
        });
    }

    let parsed: ChatResponse = resp.json().await.map_err(|e| JsonitaError::Http {
        status: 0,
        body: e.to_string(),
    })?;

    let content = parsed
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    let extracted =
        validate::extract_json(&content).ok_or_else(|| JsonitaError::AiInvalidJson {
            raw: content.clone(),
        })?;

    // 二次验证：必须是合法 JSON，且不能是 repair-failed sentinel。
    let value = serde_json::from_str::<serde_json::Value>(&extracted)
        .map_err(|_| JsonitaError::AiInvalidJson { raw: content.clone() })?;
    if validate::is_repair_failed_sentinel(&value) {
        return Err(JsonitaError::AiInvalidJson { raw: content });
    }

    let elapsed_ms = started.elapsed().as_millis() as u64;
    let usage = parsed.usage.unwrap_or(Usage {
        prompt_tokens: 0,
        completion_tokens: 0,
    });

    Ok(AiFixResp {
        fixed: extracted,
        model: parsed.model.unwrap_or_default(),
        tokens_in: usage.prompt_tokens,
        tokens_out: usage.completion_tokens,
        elapsed_ms,
    })
}

/// settings.ai_enabled 提前检查 + secrets 提前检查（避免无 key 时白白发包）。
pub async fn fix_via_store(
    store: &SettingsStore,
    req: AiFixReq,
) -> Result<AiFixResp, JsonitaError> {
    let s = store.get();
    fix(&s, &req).await
}
