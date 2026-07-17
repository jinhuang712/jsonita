//! history 分组 ── SQLite history 表，见 spec/30-operations.md。
//!
//! M1-N6：真实实现走 `crate::store::history`；M2 起接 settings.history_limit。

use tauri::State;

use crate::error::JsonitaError;
use crate::store::{db::require_db, history as h, Db, SettingsStore};
use crate::types::{HistoryRow, ListOpts, OpType};

#[tauri::command]
pub async fn history_list(
    opts: ListOpts,
    db: State<'_, Option<Db>>,
) -> Result<Vec<HistoryRow>, JsonitaError> {
    let db = require_db(db.inner())?;
    tauri::async_runtime::spawn_blocking(move || h::list(&db, opts))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_search(
    query: String,
    limit: u32,
    db: State<'_, Option<Db>>,
) -> Result<Vec<HistoryRow>, JsonitaError> {
    let db = require_db(db.inner())?;
    tauri::async_runtime::spawn_blocking(move || h::search(&db, &query, limit))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_star(
    id: i64,
    starred: bool,
    db: State<'_, Option<Db>>,
) -> Result<(), JsonitaError> {
    let db = require_db(db.inner())?;
    tauri::async_runtime::spawn_blocking(move || h::set_starred(&db, id, starred))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_clear(db: State<'_, Option<Db>>) -> Result<u32, JsonitaError> {
    let db = require_db(db.inner())?;
    tauri::async_runtime::spawn_blocking(move || h::clear(&db))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

/// 前端调用：AI Fix Accept 或明确历史写入后追加历史。
#[tauri::command]
pub async fn history_add(
    content: String,
    op_type: OpType,
    db: State<'_, Option<Db>>,
    settings: State<'_, SettingsStore>,
) -> Result<Option<HistoryRow>, JsonitaError> {
    let cfg = settings.get();
    if !cfg.history_enabled {
        return Ok(None);
    }
    let db = require_db(db.inner())?;
    let limit = cfg.history_limit;
    tauri::async_runtime::spawn_blocking(move || h::add(&db, &content, op_type, limit))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
        .map(Some)
}
