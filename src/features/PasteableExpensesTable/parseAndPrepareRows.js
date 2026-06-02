import { parseTextToRows, formatDateFromDB } from '@/utils';

const matchesStaged = (row, alreadyStaged) =>
    alreadyStaged.some((staged) =>
        staged.name === row.name &&
        staged.amount === row.amount &&
        staged.account === row.account &&
        // Staged rows can be either raw paste format (DD/MM/YY) or ISO
        // (YYYY-MM-DD) if they came from the DB. Accept either.
        (staged.date === row.date || staged.date === formatDateFromDB(row.date))
    );

export function parseAndPrepareRows(text, alreadyStaged = []) {
    const parsed = parseTextToRows(text);

    return parsed
        .filter((row) => !matchesStaged(row, alreadyStaged))
        .map((row) => {
            const [day, month, year] = row.date.split('/');
            return {
                ...row,
                id: crypto.randomUUID(),
                date: `20${year}-${month}-${day}`,
                timestamp: new Date(`20${year}`, Number(month) - 1, Number(day)).getTime(),
                isDuplicate: false,
            };
        });
}

export function markDuplicates(rows, existingExpenses = []) {
    if (rows.length === 0 || existingExpenses.length === 0) {
        return rows;
    }
    return rows.map((row) => {
        const isDuplicate = existingExpenses.some((expense) =>
            expense.name === row.name &&
            expense.amount === row.amount &&
            expense.date === row.date &&
            expense.account === row.account
        );

        return isDuplicate ? { ...row, isDuplicate: true } : row;
    });
}

// Shared ingest used by paste (desktop + mobile) and PDF upload: parse text into
// staged rows, then flag duplicates against the DB for the relevant date range.
// Callers append the result themselves (and apply any caller-specific filtering).
export async function ingestText(text, alreadyStaged, fetchExpensesByDateRange) {
    const parsed = parseAndPrepareRows(text, alreadyStaged);
    if (parsed.length === 0) return [];
    if (typeof fetchExpensesByDateRange !== 'function') return parsed;
    try {
        const range = computeDateRange(parsed);
        const accounts = [...new Set(parsed.map((r) => r.account))];
        const existing = await fetchExpensesByDateRange({ ...range, accounts });
        return markDuplicates(parsed, existing);
    } catch (err) {
        console.error('fetchExpensesByDateRange failed:', err);
        return parsed;
    }
}

export function computeDateRange(rows) {
    if (rows.length === 0) return null;
    const dates = rows.map((r) => r.date).sort();
    const startDate = dates[0];
    const max = dates[dates.length - 1];
    const [y, m, d] = max.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    const endDate = next.toISOString().slice(0, 10);
    return { startDate, endDate };
}
