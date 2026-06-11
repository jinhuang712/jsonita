# 附录：存储明细

核心语义见 [07_storage_session.md](../07_storage_session.md)。本页只列 DDL、PRAGMA、迁移和路径。

## SQLite DDL

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  op_type TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  starred INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_history_created_at ON history(created_at DESC);
CREATE INDEX idx_history_hash ON history(content_hash);
CREATE INDEX idx_history_pinned ON history(pinned, created_at DESC);
CREATE INDEX idx_history_starred ON history(starred, created_at DESC);

CREATE TABLE last_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL,
  op_type TEXT NOT NULL,
  saved_at INTEGER NOT NULL
);

CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE schema_version (
  version INTEGER NOT NULL
);
```

## PRAGMA

| PRAGMA | 值 | 目的 |
| --- | --- | --- |
| `journal_mode` | `WAL` | 降低写阻塞。 |
| `synchronous` | `NORMAL` | 工具类应用性能/可靠性平衡。 |
| `foreign_keys` | `ON` | 保持迁移默认安全。 |
| `busy_timeout` | `1000` | 避免短暂锁冲突直接失败。 |

## 文件路径

| 数据 | macOS 路径 |
| --- | --- |
| SQLite | `~/Library/Application Support/Jsonita/history.db` |
| settings | `~/Library/Application Support/Jsonita/settings.json` |
| window state | `~/Library/Application Support/Jsonita/window.json` |
| secrets | `~/Library/Application Support/Jsonita/secrets.json` |
| logs | `~/Library/Logs/Jsonita/` |

## 迁移规则

| 规则 | 说明 |
| --- | --- |
| migration 文件 | `src-tauri/migrations/*.sql`。 |
| 版本记录 | `schema_version` 单行版本。 |
| settings 缺字段 | Rust 默认值补齐并在下次写入落盘。 |
| secrets 权限 | 创建后限制当前用户读写。 |
| corruption handling | 不覆盖当前 editor；返回结构化错误并记录脱敏日志。 |
