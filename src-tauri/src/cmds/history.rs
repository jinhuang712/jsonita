//! history 分组 stubs ── SQLite history 表 + FTS5 索引（spec/02 § 2.2）。
//!
//! M1-N1：返回空 Vec / Ok(()) 让前端 HistoryModal 可独立 mount；
//! M1-N6 起接 rusqlite + history_fts trigger 真实查询。

use crate::error::JsonitaError;
use crate::types::{HistoryRow, ListOpts};

#[tauri::command]
pub async fn history_list(_opts: ListOpts) -> Result<Vec<HistoryRow>, JsonitaError> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn history_search(
    _query: String,
    _limit: u32,
) -> Result<Vec<HistoryRow>, JsonitaError> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn history_pin(_id: i64, _pinned: bool) -> Result<(), JsonitaError> {
    Ok(())
}

#[tauri::command]
pub async fn history_star(_id: i64, _starred: bool) -> Result<(), JsonitaError> {
    Ok(())
}

#[tauri::command]
pub async fn history_clear() -> Result<u32, JsonitaError> {
    Ok(0)
}
