-- Fingerprint: the bank values each expense was imported with. Edits change
-- name/amount/date/account but never source_*, so re-pasting the same bank
-- row is still detected as a duplicate. Existing rows are backfilled from
-- their current values.
--
-- Deploy order (the app reads source_* directly, with no fallback):
--   1. Run this whole file.
--   2. Deploy the code that reads/writes source_*.
--   3. Re-run only the backfill UPDATE below, to fill rows the old code
--      inserted between steps 1 and 2. It only touches rows whose source_*
--      are all NULL, so re-running it is safe.

BEGIN;

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS source_name TEXT,
    ADD COLUMN IF NOT EXISTS source_date DATE,
    ADD COLUMN IF NOT EXISTS source_account TEXT;

-- Same type as amount, so float comparisons stay exact.
DO $$ BEGIN
    EXECUTE format('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_amount %s',
        (SELECT format_type(atttypid, atttypmod) FROM pg_attribute
         WHERE attrelid = 'expenses'::regclass AND attname = 'amount'));
END $$;

-- Backfill (re-run after deploy, step 3).
UPDATE expenses
    SET source_name = name, source_amount = amount,
        -- ::text so this works whether date is still TEXT (mixed
        -- 'YYYY-MM-DD' / 'DD/MM/YY') or already a DATE column.
        source_date = CASE
            WHEN date::text ~ '^\d{4}-\d{2}-\d{2}' THEN LEFT(date::text, 10)::date
            WHEN date::text ~ '^\d{2}/\d{2}/\d{2}$' THEN TO_DATE(date::text, 'DD/MM/YY')
        END,
        source_account = account
    WHERE source_name IS NULL AND source_amount IS NULL
      AND source_date IS NULL AND source_account IS NULL;

CREATE INDEX IF NOT EXISTS expenses_source_account_date_idx
    ON expenses (source_account, source_date);

COMMIT;
