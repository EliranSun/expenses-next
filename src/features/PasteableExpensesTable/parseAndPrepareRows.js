import { parseTextToRows, formatDateFromDB } from '@/utils';

const matchesExisting = (row, existingExpenses) =>
    existingExpenses.some((expense) =>
        expense.name === row.name &&
        expense.amount === row.amount &&
        expense.date === formatDateFromDB(row.date) &&
        expense.account === row.account
    );

const matchesStaged = (row, alreadyStaged) =>
    alreadyStaged.some((staged) =>
        staged.name === row.name &&
        staged.amount === row.amount &&
        staged.account === row.account &&
        // Staged rows can be either raw paste format (DD/MM/YY) or ISO
        // (YYYY-MM-DD) if they came from the DB. Accept either.
        (staged.date === row.date || staged.date === formatDateFromDB(row.date))
    );

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
