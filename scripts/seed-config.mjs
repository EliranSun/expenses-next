#!/usr/bin/env node
/**
 * One-off seed for the `budgets` and `accounts` tables introduced in Phase 3
 * of REFACTOR.md.
 *
 * Source values: a local JSON file (gitignored) at
 *   scripts/seed-data.local.json
 * with this shape:
 *   {
 *     "accounts": [
 *       { "number": "...", "type": "private", "name": "private", "translation": "..." },
 *       ...
 *     ],
 *     "budgets": {
 *       "<2-digit-year>": {
 *         "<2-digit-month>": {
 *           "<account_type>": { "<category>": <amount>, ... }
 *         }
 *       }
 *     }
 *   }
 *
 * Run once: `npm run seed:config` (requires DATABASE_URL in env).
 * Safe to re-run: uses ON CONFLICT DO NOTHING.
 */

import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, 'seed-data.local.json');

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const raw = await readFile(dataPath, 'utf8').catch(() => {
    console.error(`Missing ${dataPath}. Copy scripts/seed-data.example.json and fill in real values.`);
    process.exit(1);
});
const { accounts = [], budgets = {} } = JSON.parse(raw);

const sql = neon(process.env.DATABASE_URL);

let accountRows = 0;
for (const a of accounts) {
    await sql(
        `INSERT INTO accounts (number, type, name, translation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (number) DO NOTHING`,
        [a.number, a.type, a.name, a.translation],
    );
    accountRows++;
}

let budgetRows = 0;
for (const [year, byMonth] of Object.entries(budgets)) {
    for (const [month, byAccountType] of Object.entries(byMonth)) {
        for (const [accountType, byCategory] of Object.entries(byAccountType)) {
            for (const [category, amount] of Object.entries(byCategory)) {
                await sql(
                    `INSERT INTO budgets (year, month, account_type, category, amount)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (year, month, account_type, category) DO NOTHING`,
                    [2000 + Number(year), Number(month), accountType, category, amount],
                );
                budgetRows++;
            }
        }
    }
}

console.log(`Seeded ${accountRows} accounts, ${budgetRows} budget rows.`);
