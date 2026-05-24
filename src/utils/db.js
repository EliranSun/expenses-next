import { neon } from '@neondatabase/serverless';
import { Accounts } from '@/constants/account';
import { isValidInsertRow } from '@/utils';

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

function mapRow(expense) {
    // After the DATE-column migration the driver returns date as a
    // Date object (at local midnight) or a 'YYYY-MM-DD' string. Read
    // local components — toISOString() would shift the day in
    // non-UTC timezones (e.g. IST: local midnight = previous day in UTC).
    let iso;
    if (typeof expense.date === 'string') {
        iso = expense.date.slice(0, 10);
    } else {
        const d = expense.date;
        iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const [yyyy, mm, dd] = iso.split('-');
    return {
        ...expense,
        date: iso,
        month: Number(mm),
        year: Number(yyyy) % 100,
        timestamp: new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime(),
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

    const conditions = [
        `${DATE_EXPR} >= $1::date`,
        `${DATE_EXPR} < $2::date`,
    ];
    const params = [startDate, endDate];

    if (Array.isArray(accounts) && accounts.length > 0) {
        const placeholders = accounts.map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`account IN (${placeholders})`);
        params.push(...accounts);
    }

    const query = `
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note
        FROM expenses
        WHERE ${conditions.join(' AND ')}
    `;

    const rows = await sql(query, params);
    return rows.map(mapRow);
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
        SELECT name, amount, ${DATE_EXPR} AS date, account, category, id, note
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const rows = await sql(query, params);
    return rows.map(row => (row.date ? mapRow(row) : { ...row, month: null, year: null, timestamp: null }));
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
        const placeholders = values
            .map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}::date, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`)
            .join(', ');
        const query = `
            INSERT INTO expenses (name, amount, date, account, category, id)
            VALUES ${placeholders}
        `;
        // Single multi-row INSERT is atomic in Postgres.
        await sql(query, values.flat());
        return { ok: true, data: { inserted: validRows.length, skipped } };
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
