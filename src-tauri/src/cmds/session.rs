//! session 分组 stubs ── last_session SQLite 单行表 + 内存 restore timer（spec/02 § 2.3）。
//!
//! M1-N1：返回 None / Ok(()) 让前端 RestoreBar 可独立 mount；
//! M1-N7 起接 SQLite last_session + tokio::time::sleep RestoreTimer。

use crate::error::JsonitaError;
use crate::types::LastSession;

#[tauri::command]
pub async fn session_save_last(_s: LastSession) -> Result<(), JsonitaError> {
    Ok(())
}

#[tauri::command]
pub async fn session_load_last() -> Result<Option<LastSession>, JsonitaError> {
    Ok(None)
}

#[tauri::command]
pub async fn session_clear_last() -> Result<(), JsonitaError> {
    Ok(())
}
