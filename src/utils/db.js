import { neon } from '@neondatabase/serverless';
import { Accounts } from '@/constants/account';
import { isValidInsertRow } from '@/utils';
import { Categories } from '@/constants';

const DEFAULT_LIMIT = 1000;

function getSql() {
    return neon(`${process.env.DATABASE_URL}`);
}

// expenses.date is a text column with mixed legacy formats: some rows are
// stored as 'YYYY-MM-DD' (ISO) and some as 'DD/MM/YY'. Normalise both to a
// real DATE value so comparisons and ordering behave consistently.
const DATE_EXPR = "CASE "
    + "WHEN date ~ '^\\d{4}-\\d{2}-\\d{2}' THEN date::date "
    + "WHEN date ~ '^\\d{2}/\\d{2}/\\d{2}$' THEN TO_DATE(date, 'DD/MM/YY') "
    + "END";

function monthBounds(year, month) {
    // year is 2-digit (e.g. 25 -> 2025), month is 1-12
    const y = 2000 + Number(year);
    const m = Number(month);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const nextYear = m === 12 ? y + 1 : y;
    const nextMonth = m === 12 ? 1 : m + 1;
    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    return { start, end };
}

function yearBounds(year) {
    const y = 2000 + Number(year);
    return { start: `${y}-01-01`, end: `${y + 1}-01-01` };
}

// After the DATE-column migration the driver returns dates as a Date object
// (at local midnight) or a 'YYYY-MM-DD' string. Read local components -
// toISOString() would shift the day in non-UTC timezones (e.g. IST: local
// midnight = previous day in UTC).
function toIsoDate(value) {
    if (typeof value === 'string') return value.slice(0, 10);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function mapRow(expense) {
    const iso = toIsoDate(expense.date);
    const [yyyy, mm, dd] = iso.split('-');
    return {
        ...expense,
        date: iso,
        month: Number(mm),
        year: Number(yyyy) % 100,
        timestamp: new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime(),
    };
}

// The bank values a row was imported with (its fingerprint). Editing an
// expense changes name/amount/date/account but never these, so pasting the
// same bank row again is still recognized as a duplicate. Rows that predate
// the columns are backfilled from their values at migration time.
// Same statements as db/migrations/0004_expense_source_fingerprint.sql.
const SOURCE_COLUMNS_DDL = [
    `ALTER TABLE expenses
        ADD COLUMN IF NOT EXISTS source_name TEXT,
        ADD COLUMN IF NOT EXISTS source_date DATE,
        ADD COLUMN IF NOT EXISTS source_account TEXT`,
    // Same type as amount, so float comparisons stay exact.
    `DO $$ BEGIN
        EXECUTE format('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_amount %s',
            (SELECT format_type(atttypid, atttypmod) FROM pg_attribute
             WHERE attrelid = 'expenses'::regclass AND attname = 'amount'));
    END $$`,
    `UPDATE expenses
        SET source_name = name, source_amount = amount,
            source_date = ${DATE_EXPR}, source_account = account
        WHERE source_name IS NULL AND source_amount IS NULL
          AND source_date IS NULL AND source_account IS NULL`,
    `CREATE INDEX IF NOT EXISTS expenses_source_account_date_idx
        ON expenses (source_account, source_date)`,
];

const SOURCE_DATE = `COALESCE(source_date, ${DATE_EXPR})`;
const SOURCE_ACCOUNT = 'COALESCE(source_account, account)';
const SOURCE_SELECT = 'COALESCE(source_name, name) AS source_name, '
    + 'COALESCE(source_amount, amount) AS source_amount, '
    + `${SOURCE_DATE} AS source_date, `
    + `${SOURCE_ACCOUNT} AS source_account`;

// 42703 = undefined_column: migration 0004 not applied yet. Apply it and
// retry once, like duplicate_dismissals does for its table.
async function withSourceColumns(sql, query) {
    try {
        return await query();
    } catch (error) {
        if (error?.code !== '42703') throw error;
        await sql.transaction(SOURCE_COLUMNS_DDL.map((statement) => sql(statement)));
        return query();
    }
}

const mapNullableRow = (row) =>
    (row.date ? mapRow(row) : { ...row, month: null, year: null, timestamp: null });

function splitSource({ source_name, source_amount, source_date, source_account, ...row }) {
    return {
        ...row,
        source: {
            name: source_name,
            amount: source_amount,
            date: source_date == null ? null : toIsoDate(source_date),
            account: source_account,
        },
    };
}

export async function fetchExpenses({ account, year, month, limit = DEFAULT_LIMIT } = {}) {
    const sql = getSql();

    const conditions = [];
    const params = [];

    if (account) {
        if (!Accounts[account] || Accounts[account].length === 0) {
            console.log('No account provided');
            return [];
        }
        const placeholders = Accounts[account].map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`account IN (${placeholders})`);
        params.push(...Accounts[account]);
    }

    if (year && month) {
        const { start, end } = monthBounds(year, month);
        conditions.push(`${DATE_EXPR} >= $${params.length + 1}::date AND ${DATE_EXPR} < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (year) {
        const { start, end } = yearBounds(year);
        conditions.push(`${DATE_EXPR} >= $${params.length + 1}::date AND ${DATE_EXPR} < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (month) {
        conditions.push(`EXTRACT(MONTH FROM ${DATE_EXPR}) = $${params.length + 1}`);
        params.push(Number(month));
    }

    let query = `SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note FROM expenses`;
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY ${DATE_EXPR} ASC, name ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const rows = await sql(query, params);
    return rows.map(mapRow);
}

export async function fetchExpensesByDateRange({ startDate, endDate, accounts } = {}) {
    'use server';
    if (!startDate || !endDate) {
        return [];
    }
    const sql = getSql();

    // Filtered by fingerprint, not current values: this feeds duplicate
    // detection, and an edited row must still match its original bank line.
    const conditions = [
        `${SOURCE_DATE} >= $1::date`,
        `${SOURCE_DATE} < $2::date`,
    ];
    const params = [startDate, endDate];

    if (Array.isArray(accounts) && accounts.length > 0) {
        const placeholders = accounts.map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`${SOURCE_ACCOUNT} IN (${placeholders})`);
        params.push(...accounts);
    }

    const query = `
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note, ${SOURCE_SELECT}
        FROM expenses
        WHERE ${conditions.join(' AND ')}
    `;

    const rows = await withSourceColumns(sql, () => sql(query, params));
    return rows.map((row) => mapNullableRow(splitSource(row)));
}

// Free-text search across every expense, newest first. Served by the
// /api/search route (a GET, so the client can abort it) rather than a server
// action, which Next runs one at a time and can't cancel. A numeric query matches
// amounts within ±5%; text matches name, note, account, date or a category
// (by key or Hebrew name).
export const SEARCH_MAX_LIMIT = 100;
export const SEARCH_MAX_QUERY_LENGTH = 100;

export async function searchExpenses(query, { limit = SEARCH_MAX_LIMIT } = {}) {
    const term = String(query ?? '').trim().slice(0, SEARCH_MAX_QUERY_LENGTH);
    if (!term) return [];
    const safeLimit = Math.min(Math.max(Math.trunc(Number(limit)) || SEARCH_MAX_LIMIT, 1), SEARCH_MAX_LIMIT);
    const sql = getSql();

    const conditions = [];
    const params = [];
    const amount = Number(term.replace(/,/g, ''));

    if (!Number.isNaN(amount) && amount !== 0) {
        const abs = Math.abs(amount);
        conditions.push(`ABS(amount) BETWEEN $${params.length + 1} AND $${params.length + 2}`);
        params.push(abs * 0.95, abs * 1.05);
    }

    const like = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const p = params.length + 1;
    params.push(like);
    const textConditions = [
        `name ILIKE $${p}`,
        `note ILIKE $${p}`,
        `account ILIKE $${p}`,
        `TO_CHAR(${DATE_EXPR}, 'DD/MM/YYYY') ILIKE $${p}`,
    ];
    const lower = term.toLowerCase();
    const categoryKeys = Object.entries(Categories)
        .filter(([key, { name }]) => key.includes(lower) || name.includes(term))
        .map(([key]) => key);
    if (categoryKeys.length) {
        const placeholders = categoryKeys.map((_, i) => `$${params.length + i + 1}`).join(', ');
        textConditions.push(`category IN (${placeholders})`);
        params.push(...categoryKeys);
    }
    conditions.push(...textConditions);

    const rows = await sql(`
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note
        FROM expenses
        WHERE date IS NOT NULL AND (${conditions.join(' OR ')})
        ORDER BY ${DATE_EXPR} DESC NULLS LAST, name ASC
        LIMIT $${params.length + 1}
    `, [...params, safeLimit]);
    return rows.filter((row) => row.date != null).map(mapRow);
}

// Per-month, per-category sums for the category analytics page. Income is
// summed as absolute values (some income rows are negative), matching
// groupExpensesByMonth; expense refunds stay negative so they net out.
export async function fetchCategoryMonthlyTotals({ startDate, endDate, accounts } = {}) {
    if (!startDate || !endDate) {
        return [];
    }
    const sql = getSql();

    const conditions = [
        `${DATE_EXPR} >= $1::date`,
        `${DATE_EXPR} < $2::date`,
        "category IS NOT NULL AND category <> ''",
    ];
    const params = [startDate, endDate];

    if (Array.isArray(accounts) && accounts.length > 0) {
        const placeholders = accounts.map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`account IN (${placeholders})`);
        params.push(...accounts);
    }

    const query = `
        SELECT TO_CHAR(${DATE_EXPR}, 'YYYY-MM') AS month, category,
               SUM(CASE WHEN category = 'income' THEN ABS(amount) ELSE amount END)::float AS total,
               COUNT(*)::int AS count
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        GROUP BY 1, 2
        ORDER BY 1, 2
    `;

    const rows = await sql(query, params);
    return rows.map(({ month, category, total, count }) => ({ month, category, total: Number(total), count }));
}

export async function getUnhandledExpenses({ year, month, account, limit = DEFAULT_LIMIT } = {}) {
    const sql = getSql();

    const conditions = ['(category IS NULL OR date IS NULL)'];
    const params = [];

    if (account && Accounts[account]?.length) {
        const placeholders = Accounts[account].map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`account IN (${placeholders})`);
        params.push(...Accounts[account]);
    }

    if (year && month) {
        const { start, end } = monthBounds(year, month);
        conditions.push(`${DATE_EXPR} >= $${params.length + 1}::date AND ${DATE_EXPR} < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (year) {
        const { start, end } = yearBounds(year);
        conditions.push(`${DATE_EXPR} >= $${params.length + 1}::date AND ${DATE_EXPR} < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (month) {
        conditions.push(`EXTRACT(MONTH FROM ${DATE_EXPR}) = $${params.length + 1}`);
        params.push(Number(month));
    }

    const query = `
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note, ${SOURCE_SELECT}
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const rows = await withSourceColumns(sql, () => sql(query, params));
    return rows.map((row) => mapNullableRow(splitSource(row)));
}

// How each expense name has been categorized so far, for auto-categorizing new
// rows on import.
export async function fetchCategoryHistory() {
    'use server';
    const sql = getSql();
    const rows = await sql(`
        SELECT name, category, COUNT(*)::int AS count, TO_CHAR(MAX(${DATE_EXPR}), 'YYYY-MM-DD') AS last_date
        FROM expenses
        WHERE category IS NOT NULL AND category <> ''
        GROUP BY name, category
    `);
    return rows.map(({ name, category, count, last_date }) => ({ name, category, count, lastDate: last_date }));
}

export async function findSuspiciousExpenses({ limit = 500 } = {}) {
    const sql = getSql();
    const query = `
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note
        FROM expenses
        WHERE category IS NULL
           OR date IS NULL
           OR name IS NULL OR TRIM(name) = '' OR LOWER(TRIM(name)) IN ('null','undefined','nan')
           OR account IS NULL OR TRIM(account) = '' OR LOWER(TRIM(account)) IN ('null','undefined','nan')
           OR amount IS NULL OR amount = 0
        ORDER BY ${DATE_EXPR} DESC NULLS FIRST
        LIMIT $1
    `;
    const rows = await sql(query, [limit]);
    return rows.map((row) => {
        const issues = [];
        if (row.name == null || String(row.name).trim() === '' ||
            ['null', 'undefined', 'nan'].includes(String(row.name).trim().toLowerCase())) {
            issues.push('name');
        }
        if (row.account == null || String(row.account).trim() === '' ||
            ['null', 'undefined', 'nan'].includes(String(row.account).trim().toLowerCase())) {
            issues.push('account');
        }
        if (row.date == null) issues.push('date');
        if (row.amount == null || row.amount === 0) issues.push('amount');
        if (row.category == null) issues.push('category');

        const base = row.date ? mapRow(row) : { ...row, month: null, year: null, timestamp: null };
        return { ...base, issues };
    });
}

const CREATE_DISMISSALS_TABLE = `
    CREATE TABLE IF NOT EXISTS duplicate_dismissals (
        id SERIAL PRIMARY KEY,
        expense_ids TEXT[] NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
`;

// Groups of rows sharing a fingerprint name + amount + date (account
// ignored), minus groups the user already marked as "not a duplicate".
// Grouping by fingerprint keeps an edited copy in its group.
export async function findDuplicateGroups({ limit = 500 } = {}) {
    const sql = getSql();
    const name = 'TRIM(COALESCE(source_name, name))';
    const amount = 'COALESCE(source_amount, amount)';
    const [groups, dismissed] = await Promise.all([
        withSourceColumns(sql, () => sql(`
            SELECT ${name} AS name, ${amount} AS amount, ${SOURCE_DATE} AS date,
                   json_agg(json_build_object(
                       'id', id, 'name', name, 'amount', amount,
                       'account', account, 'category', category, 'note', note
                   ) ORDER BY id) AS rows
            FROM expenses
            WHERE ${name} <> ''
              AND ${amount} IS NOT NULL
              AND ${SOURCE_DATE} IS NOT NULL
            GROUP BY ${name}, ${amount}, ${SOURCE_DATE}
            HAVING COUNT(*) > 1
            ORDER BY ${SOURCE_DATE} DESC, ${name} ASC
            LIMIT $1
        `, [limit])),
        fetchDismissedIdSets(sql),
    ]);

    return groups
        .filter(({ date }) => date != null)
        .map(({ name, amount, date, rows }) => {
            const mapped = rows.map((row) => mapRow({ ...row, id: String(row.id), date }));
            return { key: mapped.map((r) => r.id).join('|'), name, amount, date: mapped[0].date, rows: mapped };
        })
        .filter((group) => !dismissed.some((ids) => group.rows.every((r) => ids.has(r.id))));
}

async function fetchDismissedIdSets(sql) {
    try {
        const rows = await sql('SELECT expense_ids FROM duplicate_dismissals');
        return rows.map((r) => new Set((r.expense_ids ?? []).map(String)));
    } catch (error) {
        // 42P01 = undefined_table: migration 0003 not applied yet.
        if (error?.code === '42P01') return [];
        throw error;
    }
}

export async function dismissDuplicateGroup(ids) {
    'use server';
    if (!Array.isArray(ids) || ids.length < 2) {
        return { ok: false, error: 'missing ids' };
    }
    const sql = getSql();
    const insert = () => sql('INSERT INTO duplicate_dismissals (expense_ids) VALUES ($1::text[])', [ids.map(String)]);
    try {
        try {
            await insert();
        } catch (error) {
            if (error?.code !== '42P01') throw error;
            // Table missing: create it (same as migration 0003) and retry once.
            await sql(CREATE_DISMISSALS_TABLE);
            await insert();
        }
        return { ok: true };
    } catch (error) {
        console.error('dismissDuplicateGroup failed:', error);
        return { ok: false, error: error.message ?? 'dismiss failed' };
    }
}

export async function deleteExpenses(ids) {
    'use server';
    if (!Array.isArray(ids) || ids.length === 0) {
        return { ok: false, error: 'missing ids' };
    }
    try {
        const sql = getSql();
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        await sql(`DELETE FROM expenses WHERE id IN (${placeholders})`, ids);
        return { ok: true };
    } catch (error) {
        console.error('deleteExpenses failed:', error);
        return { ok: false, error: error.message ?? 'delete failed' };
    }
}

export async function insertExpenses(rows) {
    'use server';
    if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, error: 'no rows to insert' };
    }
    const validRows = rows.filter(isValidInsertRow);
    const skipped = rows.length - validRows.length;
    if (validRows.length === 0) {
        return { ok: false, error: 'no valid rows to insert', data: { skipped } };
    }
    try {
        const sql = getSql();
        const values = validRows.map(row => [row.name.trim(), row.amount, row.date, row.account.trim(), row.category, row.id]);
        // The source_* fingerprint reuses the name/amount/date/account params.
        const placeholders = values
            .map((_, i) => {
                const [name, amount, date, account, category, id] = [1, 2, 3, 4, 5, 6].map((n) => `$${i * 6 + n}`);
                return `(${name}, ${amount}, ${date}::date, ${account}, ${category}, ${id}, `
                    + `${name}, ${amount}, ${date}::date, ${account})`;
            })
            .join(', ');
        const query = `
            INSERT INTO expenses (name, amount, date, account, category, id,
                                  source_name, source_amount, source_date, source_account)
            VALUES ${placeholders}
            RETURNING id
        `;
        // Single multi-row INSERT is atomic in Postgres. RETURNING preserves
        // VALUES order, so ids[i] corresponds to validRows[i].
        const inserted = await withSourceColumns(sql, () => sql(query, values.flat()));
        const ids = inserted.map((r) => r.id);
        return { ok: true, data: { inserted: ids.length, skipped, ids } };
    } catch (error) {
        console.error('insertExpenses failed:', error);
        return { ok: false, error: error.message ?? 'insert failed' };
    }
}

export async function updateCategory(id, category) {
    'use server';
    if (!id) return { ok: false, error: 'missing id' };
    if (!category) return { ok: false, error: 'missing category' };
    try {
        const sql = getSql();
        await sql('UPDATE expenses SET category = $1 WHERE id = $2', [category, id]);
        return { ok: true };
    } catch (error) {
        console.error('updateCategory failed:', error);
        return { ok: false, error: error.message ?? 'update failed' };
    }
}

export async function deleteExpense(id) {
    'use server';
    if (!id) return { ok: false, error: 'missing id' };
    try {
        const sql = getSql();
        await sql('DELETE FROM expenses WHERE id = $1', [id]);
        return { ok: true };
    } catch (error) {
        console.error('deleteExpense failed:', error);
        return { ok: false, error: error.message ?? 'delete failed' };
    }
}

export async function updateExpenses(rows) {
    'use server';
    if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, error: 'no rows to update' };
    }
    const targets = rows.filter(r => r.id);
    if (targets.length === 0) {
        return { ok: false, error: 'no rows with ids' };
    }
    try {
        const sql = getSql();
        const queries = targets.map(row => sql(
            'UPDATE expenses SET name = $1, amount = $2, date = $3::date, account = $4, category = $5 WHERE id = $6',
            [row.name, row.amount, row.date, row.account, row.category, row.id],
        ));
        await sql.transaction(queries);
        return { ok: true, data: { updated: targets.length } };
    } catch (error) {
        console.error('updateExpenses failed:', error);
        return { ok: false, error: error.message ?? 'update failed' };
    }
}

export async function updateExpense(row) {
    'use server';
    const target = row?.id != null ? { ...row, id: String(row.id) } : row;
    if (!isValidInsertRow(target)) return { ok: false, error: 'invalid expense' };
    const category = target.category || null;
    if (category && !Categories[category]) return { ok: false, error: 'unknown category' };
    try {
        const sql = getSql();
        await sql(
            'UPDATE expenses SET name = $1, amount = $2, date = $3::date, account = $4, category = $5, note = $6 WHERE id = $7',
            [target.name.trim(), target.amount, target.date, target.account.trim(), category, target.note ?? null, target.id],
        );
        return { ok: true };
    } catch (error) {
        console.error('updateExpense failed:', error);
        return { ok: false, error: error.message ?? 'update failed' };
    }
}

export async function updateNote(id, note) {
    'use server';
    if (!id) return { ok: false, error: 'missing id' };
    if (note == null) return { ok: false, error: 'missing note' };
    try {
        const sql = getSql();
        await sql('UPDATE expenses SET note = $1 WHERE id = $2', [note, id]);
        return { ok: true };
    } catch (error) {
        console.error('updateNote failed:', error);
        return { ok: false, error: error.message ?? 'update failed' };
    }
}

export async function updateDate(id, date) {
    'use server';
    if (!id) return { ok: false, error: 'missing id' };
    if (!date) return { ok: false, error: 'missing date' };
    try {
        const sql = getSql();
        await sql('UPDATE expenses SET date = $1::date WHERE id = $2', [date, id]);
        return { ok: true };
    } catch (error) {
        console.error('updateDate failed:', error);
        return { ok: false, error: error.message ?? 'update failed' };
    }
}
