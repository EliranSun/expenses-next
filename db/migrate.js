#!/usr/bin/env node
// Applies all pending migrations against your Neon database.
// Usage: DATABASE_URL="postgres://..." node db/migrate.js
//   or:  node --env-file=.env.local db/migrate.js

import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

const sql = neon(url);

async function run() {
    console.log('Migration 0001: convert expenses.date to DATE column…');

    // Idempotent: ADD COLUMN fails if date_new already exists — that means
    // the migration was already applied or is mid-flight; skip safely.
    try {
        await sql`ALTER TABLE expenses ADD COLUMN date_new DATE`;
    } catch (e) {
        if (e.message?.includes('already exists')) {
            console.log('  date_new column already exists — skipping 0001.');
        } else {
            throw e;
        }
    }

    await sql`
        UPDATE expenses
        SET date_new = TO_DATE(date, 'DD/MM/YY')
        WHERE date IS NOT NULL AND date <> '' AND date_new IS NULL
    `;
    console.log('  ✓ Populated date_new');

    await sql`ALTER TABLE expenses DROP COLUMN IF EXISTS date`;
    await sql`ALTER TABLE expenses RENAME COLUMN date_new TO date`;
    console.log('  ✓ Column renamed');

    console.log('Migration 0002: create (account, date) index…');
    await sql`
        CREATE INDEX IF NOT EXISTS expenses_account_date_idx
        ON expenses (account, date)
    `;
    console.log('  ✓ Index created');

    console.log('All migrations applied successfully.');
}

run().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
