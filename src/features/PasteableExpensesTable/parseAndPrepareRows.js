import { parseTextToRows } from '@/utils';
import { applyCategorySuggestions, isSameName } from './categorySuggestions';

// An expense matches a pasted row by its fingerprint: the bank values it was
// imported with (`source`), so later edits to its name, amount, date or
// account don't hide it. DB rows load it from the source_* columns; drafts
// get it from parseAndPrepareRows.
// PDF-extracted names can differ slightly from the pasted names already in the
// DB beyond spacing/punctuation (glyph extraction), so PDF imports skip the name check.
export function matchesFingerprint(expense, row, { matchName = true } = {}) {
    const fingerprint = expense.source;
    return !!fingerprint &&
        (!matchName || isSameName(fingerprint.name, row.name)) &&
        fingerprint.amount === row.amount &&
        fingerprint.date === row.date &&
        fingerprint.account === row.account;
}

// Already on the page (a saved row awaiting a category, or a draft), matched
// by its fingerprint or its current values. Legacy staged rows may still
// carry the raw DD/MM/YY date.
const matchesStaged = (row, rawDate, alreadyStaged) =>
    alreadyStaged.some((staged) =>
        matchesFingerprint(staged, row) || (
            isSameName(staged.name, row.name) &&
            staged.amount === row.amount &&
            staged.account === row.account &&
            (staged.date === row.date || staged.date === rawDate)
        )
    );

export function parseAndPrepareRows(text, alreadyStaged = []) {
    return parseTextToRows(text)
        .map((row) => {
            const [day, month, year] = row.date.split('/');
            const date = `20${year}-${month}-${day}`;
            return {
                rawDate: row.date,
                row: {
                    ...row,
                    id: crypto.randomUUID(),
                    date,
                    timestamp: new Date(`20${year}`, Number(month) - 1, Number(day)).getTime(),
                    isDuplicate: false,
                    // The bank line as pasted. Saved as the fingerprint even
                    // if the date is edited before saving.
                    source: { name: row.name, amount: row.amount, date, account: row.account },
                },
            };
        })
        .filter(({ row, rawDate }) => !matchesStaged(row, rawDate, alreadyStaged))
        .map(({ row }) => row);
}

export function markDuplicates(rows, existingExpenses = [], { matchName = true } = {}) {
    if (rows.length === 0 || existingExpenses.length === 0) {
        return rows;
    }
    return rows.map((row) => {
        const isDuplicate = existingExpenses.some((expense) => matchesFingerprint(expense, row, { matchName }));
        return isDuplicate ? { ...row, isDuplicate: true } : row;
    });
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

const safeCall = (label, fn, ...args) =>
    typeof fn === 'function'
        ? Promise.resolve()
            .then(() => fn(...args))
            .catch((err) => {
                console.error(`${label} failed:`, err);
                return null;
            })
        : Promise.resolve(null);

// Marks rows that already exist in the DB and pre-fills categories from how
// the same names were categorized before.
export async function enrichRows(rows, { fetchExpensesByDateRange, fetchCategoryHistory, source } = {}) {
    const range = computeDateRange(rows);
    const accounts = [...new Set(rows.map((r) => r.account))];
    const [existing, history] = await Promise.all([
        safeCall('fetchExpensesByDateRange', fetchExpensesByDateRange, { ...range, accounts }),
        safeCall('fetchCategoryHistory', fetchCategoryHistory),
    ]);

    const marked = existing ? markDuplicates(rows, existing, { matchName: source !== 'pdf' }) : rows;
    return history ? applyCategorySuggestions(marked, history) : marked;
}
