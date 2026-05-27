//! session 分组 ── last_session SQLite 单行表（spec/02 § 2.3）。
//!
//! M1-N7：真实实现走 `crate::store::session`；last_session 由前端 transform 成功时保存。

use tauri::State;

use crate::error::JsonitaError;
use crate::store::{session as s, Db};
use crate::types::LastSession;

#[tauri::command]
pub async fn session_save_last(
    s_payload: LastSession,
    db: State<'_, Db>,
) -> Result<(), JsonitaError> {
    let db = db.inner().clone();
    let payload = s_payload;
    tauri::async_runtime::spawn_blocking(move || s::save(&db, &payload))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn session_load_last(
    db: State<'_, Db>,
) -> Result<Option<LastSession>, JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || s::load(&db))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn session_clear_last(db: State<'_, Db>) -> Result<(), JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || s::clear(&db))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}
