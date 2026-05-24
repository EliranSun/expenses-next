import { parseTextToRows, formatDateFromDB } from '@/utils';

const normStr = (value) => (value == null ? '' : String(value).trim());

const normAmount = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : null;
};

const normDate = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
};

const sameExpense = (a, b) =>
    normStr(a.name) === normStr(b.name) &&
    normStr(a.account) === normStr(b.account) &&
    normAmount(a.amount) === normAmount(b.amount) &&
    normAmount(a.amount) !== null &&
    a.date === b.date;

const matchesExisting = (row, existingExpenses) => {
    const target = { ...row, date: formatDateFromDB(row.date) };
    return existingExpenses.some((expense) =>
        sameExpense({ ...expense, date: normDate(expense.date) }, target)
    );
};

const matchesStaged = (row, alreadyStaged) => {
    const isoTarget = { ...row, date: formatDateFromDB(row.date) };
    const rawTarget = row;
    return alreadyStaged.some((staged) => {
        // Staged rows can be either raw paste format (DD/MM/YY) or ISO
        // (YYYY-MM-DD) if they came from the DB.
        const stagedNormalized = { ...staged, date: normDate(staged.date) };
        return sameExpense(stagedNormalized, isoTarget) ||
            sameExpense(stagedNormalized, rawTarget);
    });
};

export function parseAndPrepareRows(text, existingExpenses = [], alreadyStaged = []) {
    const parsed = parseTextToRows(text);

    return parsed
        .filter((row) => !matchesExisting(row, existingExpenses))
        .filter((row) => !matchesStaged(row, alreadyStaged))
        .map((row) => {
            const [day, month, year] = row.date.split('/');
            return {
                ...row,
                id: crypto.randomUUID(),
                date: `20${year}-${month}-${day}`,
                timestamp: new Date(`20${year}`, Number(month) - 1, Number(day)).getTime(),
            };
        });
}
