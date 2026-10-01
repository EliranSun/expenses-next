-- Fingerprint: the bank values each expense was imported with. Edits change
-- name/amount/date/account but never source_*, so re-pasting the same bank
-- row is still detected as a duplicate. Existing rows are backfilled from
-- their current values. The app applies this itself on first use (see
-- SOURCE_COLUMNS_DDL in src/utils/db.js); running it ahead of the deploy
-- just avoids doing it inside a request.

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

UPDATE expenses
    SET source_name = name, source_amount = amount,
        source_date = CASE
            WHEN date ~ '^\d{4}-\d{2}-\d{2}' THEN date::date
            WHEN date ~ '^\d{2}/\d{2}/\d{2}$' THEN TO_DATE(date, 'DD/MM/YY')
        END,
        source_account = account
    WHERE source_name IS NULL AND source_amount IS NULL
      AND source_date IS NULL AND source_account IS NULL;

CREATE INDEX IF NOT EXISTS expenses_source_account_date_idx
    ON expenses (source_account, source_date);

COMMIT;
