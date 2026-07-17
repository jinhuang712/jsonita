-- Drop the orphaned last_session table: the restore-last-session subsystem was
-- removed, so this table only holds stale JSON document content nobody reads.
DROP TABLE IF EXISTS last_session;
