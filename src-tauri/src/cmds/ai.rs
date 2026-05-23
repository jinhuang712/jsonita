//! AI 分组 ── DeepSeek HTTP + 本地 secrets.json 存 key（之前的 Keychain 已替）。
//!
//! Spec ref: spec/02 § 2.5 · spec/11 AI 客户端

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

/// 测试当前输入 key（不读 Keychain；用户先测再保存避免污染已有 key）
/// M2-N2 mock：返 ok=true；M2-N3 起接真实 GET /v1/models 验证 + latency 测量。
#[tauri::command]
pub async fn ai_test_connection(
    api_key: String,
    _model_id: String,
) -> Result<TestConnectionResp, JsonitaError> {
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
    // M2-N3 起接 reqwest GET /v1/models
    Ok(TestConnectionResp {
        ok: true,
        latency_ms: 0,
        model_echoed: "(M2-N2 mock — M2-N3 starts real HTTP)".into(),
    })
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
    secrets::get(DEEPSEEK_ACCOUNT)
        .ok()
        .flatten()
        .is_some()
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
