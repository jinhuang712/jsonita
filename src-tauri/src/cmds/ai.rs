//! AI 分组 ── DeepSeek HTTP + 本地 secrets.json 存 key。
//!
//! Spec ref: spec/08_ai_repair.md 与 spec/03_ipc_boundary.md。

use tauri::State;

use crate::ai::deepseek;
use crate::error::JsonitaError;
use crate::store::{secrets, SettingsStore};

const DEEPSEEK_ACCOUNT: &str = "deepseek_api_key";

#[tauri::command]
pub async fn ai_set_api_key(api_key: String) -> Result<(), JsonitaError> {
    secrets::set(DEEPSEEK_ACCOUNT, &api_key)
}

#[tauri::command]
pub async fn ai_delete_api_key() -> Result<(), JsonitaError> {
    secrets::delete(DEEPSEEK_ACCOUNT)
}

/// 测试当前输入 key（不读 secrets；用户先测再保存避免污染已有 key）。
/// 实打 DeepSeek `/chat/completions`，max_tokens=1（成本 ≤ 1 token ≈ $0.000002），
/// 返回 ok + 实际延迟 + 服务端 echo 的 model 名。
#[tauri::command]
pub async fn ai_test_connection(
    api_key: String,
    model_id: String,
) -> Result<TestConnectionResp, JsonitaError> {
    use std::error::Error as StdError;
    use std::time::{Duration, Instant};

    if api_key.is_empty() {
        return Ok(TestConnectionResp {
            ok: false,
            latency_ms: 0,
            model_echoed: "empty api key".into(),
        });
    }
    if !api_key.starts_with("sk-") {
        return Ok(TestConnectionResp {
            ok: false,
            latency_ms: 0,
            model_echoed: "api key format invalid (expected sk-*)".into(),
        });
    }

    let model = if model_id.is_empty() {
        "deepseek-chat"
    } else {
        &model_id
    };

    let body = serde_json::json!({
        "model": model,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 1,
        "stream": false,
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| JsonitaError::Http {
            status: 0,
            body: e.to_string(),
        })?;

    let started = Instant::now();
    let resp = client
        .post("https://api.deepseek.com/chat/completions")
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await;

    let latency_ms = started.elapsed().as_millis() as u64;

    match resp {
        Ok(r) if r.status().is_success() => {
            let json: serde_json::Value = r.json().await.unwrap_or(serde_json::Value::Null);
            let echoed = json
                .get("model")
                .and_then(|v| v.as_str())
                .unwrap_or(model)
                .to_string();
            Ok(TestConnectionResp {
                ok: true,
                latency_ms,
                model_echoed: echoed,
            })
        }
        Ok(r) => {
            let status = r.status().as_u16();
            let body = r.text().await.unwrap_or_default();
            let short = body.chars().take(120).collect::<String>();
            Ok(TestConnectionResp {
                ok: false,
                latency_ms,
                model_echoed: format!("HTTP {status}: {short}"),
            })
        }
        Err(e) => {
            let mut chain = e.to_string();
            let mut src: Option<&dyn StdError> = e.source();
            while let Some(inner) = src {
                chain.push_str(" → ");
                chain.push_str(&inner.to_string());
                src = inner.source();
            }
            Ok(TestConnectionResp {
                ok: false,
                latency_ms,
                model_echoed: chain,
            })
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResp {
    pub ok: bool,
    pub latency_ms: u64,
    pub model_echoed: String,
}

/// 前端查 key 是否已存（不返回 value）── settings AI 分组初次渲染调。
#[tauri::command]
pub fn ai_has_api_key() -> bool {
    secrets::get(DEEPSEEK_ACCOUNT).ok().flatten().is_some()
}

/// AI Fix 主命令 ── M2-N3 真实化。
#[tauri::command]
pub async fn ai_fix(
    req: deepseek::AiFixReq,
    settings: State<'_, SettingsStore>,
) -> Result<deepseek::AiFixResp, JsonitaError> {
    let store = settings.inner().clone();
    deepseek::fix_via_store(&store, req).await
}
