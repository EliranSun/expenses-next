-- Phase 2: index for the (account, date) filter used by fetchExpenses.
CREATE INDEX IF NOT EXISTS expenses_account_date_idx
    ON expenses (account, date);
