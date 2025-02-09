import { neon } from '@neondatabase/serverless';
import { formatDateFromDB, formatDateToDB } from '.';

export async function fetchExpenses(year, month) {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const existingExpenses = await sql('SELECT name, amount, date, account, category, id, note FROM expenses');

    const mappedExpenses = existingExpenses.map(expense => {
        const splitDate = expense.date.split("/");
        const year = splitDate[2];
        const month = splitDate[1];
        const day = splitDate[0];

        return {
            ...expense,
            date: `20${year}-${month}-${day}`,
            month,
            year,
            timestamp: new Date(`20${year}`, month - 1, day).getTime()
        };
    })
        .filter(expense => {
            if (year && month) {
                return expense.month === month && expense.year === year;
            }
            return true;
        })
        .sort((a, b) => {
            if (a.timestamp === b.timestamp) {
                return a.name.localeCompare(b.name);
            }
            return a.timestamp - b.timestamp;
        });

    return mappedExpenses;
}


export async function getUnhandledExpenses() {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const existingExpenses = await sql(`
        SELECT name, amount, date, account, category, id, note 
        FROM expenses 
        WHERE category IS NULL OR date IS NULL OR date = ''
    `);

    return existingExpenses.map(expense => ({
        ...expense,
        date: formatDateFromDB(expense.date)
    }));
}

export async function deleteExpenses(ids) {

    'use server';
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql('DELETE FROM expenses WHERE id IN ($1)', [ids]);
}

export async function insertExpenses(rows) {
    'use server';
    const sql = neon(`${process.env.DATABASE_URL}`);
    const values = rows.map(row => [row.name, row.amount, formatDateToDB(row.date), row.account, row.category, row.id]);
    const query = `
        INSERT INTO expenses (name, amount, date, account, category, id) 
        VALUES ${values.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(', ')}
    `;
    await sql(query, values.flat());
}

export async function updateCategory(id, category) {
    'use server';

    if (!category || !id) {
        console.log("No category provided");
        return;
    }

    console.log("Updating expense category:", id, category);
    const sql = neon(`${process.env.DATABASE_URL}`);


    await sql('UPDATE expenses SET category = $1 WHERE id = $2', [
        category,
        id
    ]);

}


