import { neon } from '@neondatabase/serverless';

const DEFAULT_LIMIT = 1000;

function getSql() {
    return neon(`${process.env.DATABASE_URL}`);
}

export async function getAccounts() {
    const sql = getSql();
    const rows = await sql('SELECT number, type, name, translation FROM accounts');

    const byType = { private: [], shared: [], wife: [] };
    const accountName = {};
    for (const row of rows) {
        if (!byType[row.type]) byType[row.type] = [];
        byType[row.type].push(row.number);
        accountName[row.number] = { name: row.name, translation: row.translation };
    }

    return {
        ...byType,
        all: [...byType.private, ...byType.shared, ...byType.wife],
        accountName,
    };
}

export async function getBudget(year, month) {
    const sql = getSql();
    const rows = await sql(
        `SELECT account_type, category, amount
         FROM budgets
         WHERE year = $1 AND month = $2`,
        [2000 + Number(year), Number(month)],
    );

    const byAccountType = {};
    for (const row of rows) {
        if (!byAccountType[row.account_type]) byAccountType[row.account_type] = {};
        byAccountType[row.account_type][row.category] = Number(row.amount);
    }
    return byAccountType;
}

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
    // Date object or 'YYYY-MM-DD' string. Normalise to ISO string.
    const iso = typeof expense.date === 'string'
        ? expense.date.slice(0, 10)
        : expense.date.toISOString().slice(0, 10);
    const [yyyy, mm, dd] = iso.split('-');
    return {
        ...expense,
        date: iso,
        month: Number(mm),
        year: Number(yyyy) % 100,
        timestamp: new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime(),
    };
}

async function resolveAccountNumbers(sql, accountType) {
    if (accountType === 'all') {
        const rows = await sql('SELECT number FROM accounts');
        return rows.map(r => r.number);
    }
    const rows = await sql(
        'SELECT number FROM accounts WHERE type = $1',
        [accountType],
    );
    return rows.map(r => r.number);
}

export async function fetchExpenses({ account, year, month, limit = DEFAULT_LIMIT } = {}) {
    const sql = getSql();

    const conditions = [];
    const params = [];

    if (account) {
        const numbers = await resolveAccountNumbers(sql, account);
        if (numbers.length === 0) {
            return [];
        }
        const placeholders = numbers.map((_, i) => `$${params.length + i + 1}`).join(', ');
        conditions.push(`account IN (${placeholders})`);
        params.push(...numbers);
    }

    if (year && month) {
        const { start, end } = monthBounds(year, month);
        conditions.push(`date >= $${params.length + 1}::date AND date < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (year) {
        const { start, end } = yearBounds(year);
        conditions.push(`date >= $${params.length + 1}::date AND date < $${params.length + 2}::date`);
        params.push(start, end);
    }

    let query = 'SELECT name, amount, date, account, category, id, note FROM expenses';
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY date ASC, name ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const rows = await sql(query, params);
    return rows.map(mapRow);
}

export async function getUnhandledExpenses({ year, month, account, limit = DEFAULT_LIMIT } = {}) {
    const sql = getSql();

    const conditions = ['(category IS NULL OR date IS NULL)'];
    const params = [];

    if (account) {
        const numbers = await resolveAccountNumbers(sql, account);
        if (numbers.length > 0) {
            const placeholders = numbers.map((_, i) => `$${params.length + i + 1}`).join(', ');
            conditions.push(`account IN (${placeholders})`);
            params.push(...numbers);
        }
    }

    if (year && month) {
        const { start, end } = monthBounds(year, month);
        conditions.push(`date >= $${params.length + 1}::date AND date < $${params.length + 2}::date`);
        params.push(start, end);
    } else if (year) {
        const { start, end } = yearBounds(year);
        conditions.push(`date >= $${params.length + 1}::date AND date < $${params.length + 2}::date`);
        params.push(start, end);
    }

    const query = `
        SELECT name, amount, date, account, category, id, note
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const rows = await sql(query, params);
    return rows.map(row => (row.date ? mapRow(row) : { ...row, month: null, year: null, timestamp: null }));
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
    try {
        const sql = getSql();
        const values = rows.map(row => [row.name, row.amount, row.date, row.account, row.category, row.id]);
        const placeholders = values
            .map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}::date, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`)
            .join(', ');
        const query = `
            INSERT INTO expenses (name, amount, date, account, category, id)
            VALUES ${placeholders}
        `;
        // Single multi-row INSERT is atomic in Postgres.
        await sql(query, values.flat());
        return { ok: true, data: { inserted: rows.length } };
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
