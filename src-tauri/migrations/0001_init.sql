-- M1-N6 initial schema — 见 CLAUDE.md 契约段（历史存储 / 迁移）
-- Tables: history / history_fts / last_session / app_meta / schema_version

CREATE TABLE IF NOT EXISTS schema_version (
  v INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   INTEGER NOT NULL,
  content      TEXT NOT NULL,
  summary      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  op_type      TEXT NOT NULL CHECK (
    op_type IN ('format','minify','tree','str-to-json','json-to-str','ai-fix')
  ),
  pinned       INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),
  starred      INTEGER NOT NULL DEFAULT 0 CHECK (starred IN (0,1)),
  tags         TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_history_hash ON history(content_hash);
CREATE INDEX IF NOT EXISTS idx_history_pinned_created ON history(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_starred ON history(starred) WHERE starred = 1;

CREATE VIRTUAL TABLE IF NOT EXISTS history_fts USING fts5(
  content,
  summary,
  content='history',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS history_ai AFTER INSERT ON history BEGIN
  INSERT INTO history_fts(rowid, content, summary)
    VALUES (new.id, new.content, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS history_ad AFTER DELETE ON history BEGIN
  INSERT INTO history_fts(history_fts, rowid, content, summary)
    VALUES ('delete', old.id, old.content, old.summary);
END;

CREATE TRIGGER IF NOT EXISTS history_au AFTER UPDATE ON history BEGIN
  INSERT INTO history_fts(history_fts, rowid, content, summary)
    VALUES ('delete', old.id, old.content, old.summary);
  INSERT INTO history_fts(rowid, content, summary)
    VALUES (new.id, new.content, new.summary);
END;

CREATE TABLE IF NOT EXISTS last_session (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  content  TEXT NOT NULL,
  op_type  TEXT NOT NULL,
  saved_at INTEGER NOT NULL
);
