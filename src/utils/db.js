import { neon } from '@neondatabase/serverless';

export const formatDateToDB = (date) => {
    const splitDate = date.split("-");
    const year = splitDate[0].slice(2);
    const month = splitDate[1];
    const day = splitDate[2];
    return `${day}/${month}/${year}`;
};

export const formatDateFromDB = (date) => {
    const splitDate = date.split("/");
    const year = `20${splitDate[2]}`;
    const month = splitDate[1];
    const day = splitDate[0];
    return `${year}-${month}-${day}`;
};

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


