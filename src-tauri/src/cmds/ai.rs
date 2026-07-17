//! AI 分组 ── 多协议 HTTP + 本地 secrets.json 存 key。
//!
//! Spec ref: spec/20-architecture.md。

use tauri::State;

use crate::ai::provider::{self, TestConnectionResp};
use crate::error::JsonitaError;
use crate::store::SettingsStore;
use crate::types::AiProtocol;

#[tauri::command]
pub async fn ai_set_api_key(api_key: String) -> Result<(), JsonitaError> {
    provider::set_api_key(&api_key)
}

#[tauri::command]
pub async fn ai_delete_api_key() -> Result<(), JsonitaError> {
    provider::delete_api_key()
}

/// 测试当前编辑中的配置（不读 secrets，用传入的 key）。协议 / url / model 显式传入，
/// 两种编辑模式行为一致。测通后由前端调 ai_set_api_key 落盘，避免污染已有 key。
#[tauri::command]
pub async fn ai_test_connection(
    api_key: String,
    protocol: AiProtocol,
    base_url: String,
    model_id: String,
) -> Result<TestConnectionResp, JsonitaError> {
    Ok(provider::test_connection(protocol, &base_url, &model_id, &api_key).await)
}

/// 前端查 key 是否已存（不返回 value）── settings AI 分组初次渲染调。
#[tauri::command]
pub fn ai_has_api_key() -> bool {
    provider::has_api_key()
}

/// AI Fix 主命令 ── M2-N3 真实化。
#[tauri::command]
pub async fn ai_fix(
    req: provider::AiFixReq,
    settings: State<'_, SettingsStore>,
) -> Result<provider::AiFixResp, JsonitaError> {
    let store = settings.inner().clone();
    provider::fix_via_store(&store, req).await
}
