//! history 分组 ── SQLite history 表 + FTS5（spec/02 § 2.2）。
//!
//! M1-N6：真实实现走 `crate::store::history`；M2 起接 settings.history_limit。

use tauri::{Manager, State};

use crate::error::JsonitaError;
use crate::store::{history as h, Db, SettingsStore};
use crate::types::{HistoryRow, ListOpts, OpType};

#[allow(dead_code)]
const DEFAULT_LIMIT: u32 = 100;

#[tauri::command]
pub async fn history_list(
    opts: ListOpts,
    db: State<'_, Db>,
) -> Result<Vec<HistoryRow>, JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || h::list(&db, opts))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_search(
    query: String,
    limit: u32,
    db: State<'_, Db>,
) -> Result<Vec<HistoryRow>, JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || h::search(&db, &query, limit))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_pin(id: i64, pinned: bool, db: State<'_, Db>) -> Result<(), JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || h::set_pinned(&db, id, pinned))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_star(id: i64, starred: bool, db: State<'_, Db>) -> Result<(), JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || h::set_starred(&db, id, starred))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

#[tauri::command]
pub async fn history_clear(db: State<'_, Db>) -> Result<u32, JsonitaError> {
    let db = db.inner().clone();
    tauri::async_runtime::spawn_blocking(move || h::clear(&db))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}

/// 内部 helper ── 由 cmds/json.rs 等在写完操作后调（非 IPC 命令）。
/// M2-N4 起前端走 history.add()；本 helper 留作 Rust 端直接写入入口。
#[allow(dead_code)]
pub fn record(
    app: &tauri::AppHandle,
    content: &str,
    op: crate::types::OpType,
) -> Result<HistoryRow, JsonitaError> {
    let db = app.state::<Db>();
    h::add(&db, content, op, DEFAULT_LIMIT)
}

/// 前端调用：M2-N4 AI Fix Accept 后写入历史。
/// spec/02 § 6.1.2 IPC 列表的扩展（spec 待追认）。
#[tauri::command]
pub async fn history_add(
    content: String,
    op_type: OpType,
    db: State<'_, Db>,
    settings: State<'_, SettingsStore>,
) -> Result<HistoryRow, JsonitaError> {
    let db = db.inner().clone();
    let limit = settings.get().history_limit;
    tauri::async_runtime::spawn_blocking(move || h::add(&db, &content, op_type, limit))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}
