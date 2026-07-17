//! SQLite Connection Pool + migrations。
//!
//! Spec ref: spec/30-operations.md。

use std::path::{Path, PathBuf};

use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;

use crate::error::JsonitaError;

const MIGRATIONS: &[(u32, &str)] = &[
    (1, include_str!("../../migrations/0001_init.sql")),
    (2, include_str!("../../migrations/0002_merge_pin_into_star.sql")),
];

#[derive(Clone)]
pub struct Db {
    pool: Pool<SqliteConnectionManager>,
}

impl Db {
    pub fn open(path: &Path) -> Result<Self, JsonitaError> {
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        let manager = SqliteConnectionManager::file(path).with_init(|c| {
            c.execute_batch(
                "
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA foreign_keys = ON;
                PRAGMA busy_timeout = 5000;
                ",
            )
        });
        let pool = Pool::builder()
            .max_size(4)
            .build(manager)
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;
        Self::migrate(&pool)?;
        Ok(Db { pool })
    }

    pub fn pool(&self) -> &Pool<SqliteConnectionManager> {
        &self.pool
    }

    fn migrate(pool: &Pool<SqliteConnectionManager>) -> Result<(), JsonitaError> {
        let mut conn = pool
            .get()
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;
        conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)")
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;

        let current: u32 = conn
            .query_row("SELECT COALESCE(MAX(v), 0) FROM schema_version", [], |r| {
                r.get(0)
            })
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;

        let tx = conn
            .transaction()
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;

        for (v, sql) in MIGRATIONS {
            if *v > current {
                tx.execute_batch(sql)
                    .map_err(|e| JsonitaError::Sqlite(format!("migration {}: {}", v, e)))?;
                tx.execute(
                    "INSERT INTO schema_version (v) VALUES (?1)",
                    rusqlite::params![v],
                )
                .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;
            }
        }

        tx.commit()
            .map_err(|e| JsonitaError::Sqlite(e.to_string()))?;
        Ok(())
    }
}

/// `~/Library/Application Support/Jsonita/history.db`（macOS）
pub fn default_db_path() -> Option<PathBuf> {
    let base = dirs::data_dir()?; // macOS = ~/Library/Application Support
    Some(base.join("Jsonita").join("history.db"))
}

/// history/session 命令共用：DB 未成功注入（打开失败 / data dir 不可用）时
/// 返回可读的 Sqlite 错误，而非让 `State<Db>` 提取 panic 使相关命令整体假死。
pub fn require_db(db: &Option<Db>) -> Result<Db, JsonitaError> {
    db.as_ref()
        .cloned()
        .ok_or_else(|| JsonitaError::Sqlite("local storage unavailable".into()))
}

impl From<rusqlite::Error> for JsonitaError {
    fn from(e: rusqlite::Error) -> Self {
        JsonitaError::Sqlite(e.to_string())
    }
}

impl From<r2d2::Error> for JsonitaError {
    fn from(e: r2d2::Error) -> Self {
        JsonitaError::Sqlite(e.to_string())
    }
}
