-- Groups of identical expenses (name + amount + date) the user marked as
-- "not a duplicate" on /duplicates. Keyed by the exact id set, so a dismissed
-- group shows up again if another identical row joins it.
CREATE TABLE IF NOT EXISTS duplicate_dismissals (
    id SERIAL PRIMARY KEY,
    expense_ids TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
