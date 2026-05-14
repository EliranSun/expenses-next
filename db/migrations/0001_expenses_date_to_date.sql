-- Phase 2: convert expenses.date from text DD/MM/YY to a real DATE column.
-- Run once against the production database; idempotent guard via column rename.

BEGIN;

ALTER TABLE expenses ADD COLUMN date_new DATE;

UPDATE expenses
SET date_new = TO_DATE(date, 'DD/MM/YY')
WHERE date IS NOT NULL AND date <> '';

ALTER TABLE expenses DROP COLUMN date;
ALTER TABLE expenses RENAME COLUMN date_new TO date;

COMMIT;
