-- Phase 3: move per-month budget amounts out of git into Postgres.
-- Schema only; values are seeded separately by scripts/seed-config.mjs.

BEGIN;

CREATE TABLE IF NOT EXISTS budgets (
    id            SERIAL PRIMARY KEY,
    year          SMALLINT NOT NULL,
    month         SMALLINT NOT NULL,
    account_type  TEXT     NOT NULL,
    category      TEXT     NOT NULL,
    amount        NUMERIC(12, 2) NOT NULL,
    UNIQUE (year, month, account_type, category)
);

CREATE INDEX IF NOT EXISTS budgets_year_month_idx
    ON budgets (year, month);

COMMIT;
