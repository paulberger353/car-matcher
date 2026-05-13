-- Adds status tracking columns to matches table.
-- These columns were previously added manually via the D1 console.
-- Running this migration on an existing DB will fail silently (ALTER TABLE IF NOT EXISTS
-- is not supported in SQLite). On a fresh DB, these columns are required.

ALTER TABLE matches ADD COLUMN gesehen INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN status TEXT DEFAULT 'offen';
ALTER TABLE matches ADD COLUMN status_at DATETIME;
