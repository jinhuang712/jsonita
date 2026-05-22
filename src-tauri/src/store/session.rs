//! last_session 表 CRUD ── M1-N7 起完整接入（RestoreTimer 等）。
//!
//! Spec ref: spec/10 § 5 last_session 状态机 · spec/13 § 4.2

use rusqlite::params;

use crate::error::JsonitaError;
use crate::types::{LastSession, OpType};

use super::Db;

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

pub fn save(db: &Db, s: &LastSession) -> Result<(), JsonitaError> {
    let conn = db.pool().get()?;
    let op_str = op_type_str(s.op_type);
    conn.execute(
        "INSERT INTO last_session (id, content, op_type, saved_at)
         VALUES (1, ?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
           content = excluded.content,
           op_type = excluded.op_type,
           saved_at = excluded.saved_at",
        params![s.content, op_str, s.saved_at],
    )?;
    Ok(())
}

pub fn load(db: &Db) -> Result<Option<LastSession>, JsonitaError> {
    let conn = db.pool().get()?;
    let row = conn.query_row(
        "SELECT content, op_type, saved_at FROM last_session WHERE id = 1",
        [],
        |r| {
            let op_str: String = r.get(1)?;
            Ok(LastSession {
                content: r.get(0)?,
                op_type: op_type_from(&op_str).unwrap_or(OpType::Format),
                saved_at: r.get(2)?,
            })
        },
    );
    match row {
        Ok(s) => Ok(Some(s)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(JsonitaError::Sqlite(e.to_string())),
    }
}

pub fn clear(db: &Db) -> Result<(), JsonitaError> {
    let conn = db.pool().get()?;
    conn.execute("DELETE FROM last_session WHERE id = 1", [])?;
    Ok(())
}
