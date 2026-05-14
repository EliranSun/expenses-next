-- Phase 3: move account-number → logical-account mapping out of git.
-- Schema only; values are seeded separately by scripts/seed-config.mjs.

BEGIN;

CREATE TABLE IF NOT EXISTS accounts (
    number      TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    name        TEXT NOT NULL,
    translation TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS accounts_type_idx
    ON accounts (type);

COMMIT;
