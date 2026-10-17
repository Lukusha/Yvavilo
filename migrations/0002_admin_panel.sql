ALTER TABLE staff ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_user_id,created_at DESC);
