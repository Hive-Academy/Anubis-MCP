-- Initializes the _meta table used to track seed patch versions
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO _meta (key, value) VALUES ('seed_version', 0); 