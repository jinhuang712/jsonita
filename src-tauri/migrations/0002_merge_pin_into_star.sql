-- M-merge: fold pin into star — 收藏 = 留存（防清除/防 trim）+ 置顶排序
-- 历史上被置顶的条目迁移为收藏，避免用户失去留存保护；随后删除 pinned 列。

UPDATE history SET starred = 1 WHERE pinned = 1;

DROP INDEX IF EXISTS idx_history_pinned_created;
CREATE INDEX IF NOT EXISTS idx_history_starred_created ON history(starred DESC, created_at DESC);

ALTER TABLE history DROP COLUMN pinned;
