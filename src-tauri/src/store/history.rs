//! history 表 CRUD + FTS5 搜索 + 自动 trim。
//!
//! Spec ref: spec/30-operations.md。

use rusqlite::params;
use sha2::{Digest, Sha256};

use crate::error::JsonitaError;
use crate::types::{HistoryRow, ListOpts, OpType};

use super::Db;

pub fn content_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn summary(content: &str) -> String {
    let trimmed = content.trim();
    if trimmed.chars().count() <= 80 {
        trimmed.to_string()
    } else {
        trimmed.chars().take(77).collect::<String>() + "..."
    }
}

fn op_type_str(op: OpType) -> &'static str {
    match op {
        OpType::Format => "format",
        OpType::Minify => "minify",
        OpType::Tree => "tree",
        OpType::StrToJson => "str-to-json",
        OpType::JsonToStr => "json-to-str",
        OpType::AiFix => "ai-fix",
    }
}

fn op_type_from(s: &str) -> Option<OpType> {
    match s {
        "format" => Some(OpType::Format),
        "minify" => Some(OpType::Minify),
        "tree" => Some(OpType::Tree),
        "str-to-json" => Some(OpType::StrToJson),
        "json-to-str" => Some(OpType::JsonToStr),
        "ai-fix" => Some(OpType::AiFix),
        _ => None,
    }
}

fn row_to_history(r: &rusqlite::Row) -> rusqlite::Result<HistoryRow> {
    let op_str: String = r.get("op_type")?;
    let op_type = op_type_from(&op_str).unwrap_or(OpType::Format);
    Ok(HistoryRow {
        id: r.get("id")?,
        created_at: r.get("created_at")?,
        content: r.get("content")?,
        summary: r.get("summary")?,
        content_hash: r.get("content_hash")?,
        op_type,
        starred: r.get::<_, i64>("starred")? == 1,
    })
}

/// 插入 + 去重（UPSERT 走 ON CONFLICT(content_hash)）+ 自动 trim 非收藏至 limit 条。
pub fn add(
    db: &Db,
    content: &str,
    op: OpType,
    history_limit: u32,
) -> Result<HistoryRow, JsonitaError> {
    let conn = db.pool().get()?;
    let hash = content_hash(content);
    let s = summary(content);
    let op_str = op_type_str(op);
    let now: i64 = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO history (created_at, content, summary, content_hash, op_type)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(content_hash) DO UPDATE SET
           created_at = excluded.created_at,
           op_type = excluded.op_type",
        params![now, content, s, hash, op_str],
    )?;

    let row: HistoryRow = conn.query_row(
        "SELECT * FROM history WHERE content_hash = ?1",
        params![hash],
        row_to_history,
    )?;

    // 自动 trim 至 limit 条（收藏不动）
    if history_limit > 0 {
        conn.execute(
            "DELETE FROM history
             WHERE id IN (
               SELECT id FROM history
               WHERE starred = 0
               ORDER BY created_at DESC
               LIMIT -1 OFFSET ?1
             )",
            params![history_limit as i64],
        )?;
    }

    Ok(row)
}

pub fn list(db: &Db, opts: ListOpts) -> Result<Vec<HistoryRow>, JsonitaError> {
    let conn = db.pool().get()?;
    let limit = opts.limit.max(1) as i64;
    let offset = opts.offset as i64;

    // onlyStarred 时只列收藏；否则全列，收藏置顶。
    let (sql, args): (&str, Vec<i64>) = match opts.only_starred {
        Some(true) => (
            "SELECT * FROM history WHERE starred = 1 ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
            vec![limit, offset],
        ),
        _ => (
            "SELECT * FROM history ORDER BY starred DESC, created_at DESC LIMIT ?1 OFFSET ?2",
            vec![limit, offset],
        ),
    };

    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(args.iter()), row_to_history)?;
    let mut out = Vec::with_capacity(limit as usize);
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

pub fn search(db: &Db, query: &str, limit: u32) -> Result<Vec<HistoryRow>, JsonitaError> {
    let conn = db.pool().get()?;
    let pattern = format!("%{}%", escape_like(query.trim()));

    let mut stmt = conn.prepare(
        "SELECT * FROM history
         WHERE content LIKE ?1 ESCAPE '\\'
            OR summary LIKE ?1 ESCAPE '\\'
         ORDER BY starred DESC, created_at DESC
         LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![pattern, limit as i64], row_to_history)?;
    let mut out = Vec::with_capacity(limit as usize);
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

fn escape_like(query: &str) -> String {
    query
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}

pub fn set_starred(db: &Db, id: i64, starred: bool) -> Result<(), JsonitaError> {
    let conn = db.pool().get()?;
    conn.execute(
        "UPDATE history SET starred = ?1 WHERE id = ?2",
        params![starred as i64, id],
    )?;
    Ok(())
}

/// 清空 history（保留收藏）── 见 spec/30-operations.md。
pub fn clear(db: &Db) -> Result<u32, JsonitaError> {
    let conn = db.pool().get()?;
    let n = conn.execute("DELETE FROM history WHERE starred = 0", [])?;
    Ok(n as u32)
}
