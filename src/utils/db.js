import { neon } from '@neondatabase/serverless';
import { formatDateFromDB, formatDateToDB } from '.';
import { Accounts } from '@/constants/account';
import expensesMock from "../constants/expenses-mock.json";

export async function fetchExpenses({ account, year, month } = {}) {
    if (process.env.NODE_ENV !== "production") {
        return expensesMock.filter(expense => {
            const splitDate = expense.date.split("-");
            const expenseYear = splitDate[0].slice(2, splitDate[0].length)
            const expenseMonth = splitDate[1];

            console.log({ expenseYear, expenseMonth, year, month });
            if (year && month) return expenseYear === year && expenseMonth === month;
            if (year) return expenseYear === year;
            return true
        });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    // Construct the base query
    let query = 'SELECT name, amount, date, account, category, id, note FROM expenses';
    const conditions = [];
    const params = [];

    // Add conditions based on provided parameters
    if (account) {
        if (!Accounts[account] || Accounts[account].length === 0) {
            console.log("No account provided");
            return [];
        }

        query += ' WHERE account IN (';
        const accountPlaceholders = Accounts[account].map((_, index) => `$${index + 1}`).join(', ');
        query += accountPlaceholders + ')';
        params.push(...Accounts[account]);
    }

    const existingExpenses = await sql(query, params);

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

            if (year) {
                return expense.year === year;
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


export async function getUnhandledExpenses({ year, month, account } = {}) {
    if (process.env.NODE_ENV !== "production") {
        return expensesMock.filter(expense => expense.category === null || expense.date === null || expense.date === "");
    }

    const sql = neon(`${process.env.DATABASE_URL}`);

    const existingExpenses = await sql(`
        SELECT name, amount, date, account, category, id, note 
        FROM expenses 
        WHERE category IS NULL OR date IS NULL OR date = ''
    `);

    return existingExpenses.map(expense => {
        const splitDate = expense.date.split("/");
        const year = splitDate[2];
        const month = splitDate[1];
        const day = splitDate[0];

        return {
            ...expense,
            date: formatDateFromDB(expense.date),
            month,
            year,
            timestamp: new Date(`20${year}`, month - 1, day).getTime()
        }
    })
        .filter(expense => {
            if (year && month) {
                return expense.month === month && expense.year === year;
            }

            if (year) {
                return expense.year === year;
            }

            return true;
        });
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

export async function deleteExpense(id) {
    'use server';
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql('DELETE FROM expenses WHERE id = $1', [id]);
}



export async function updateExpenses(rows) {
    'use server';
    console.log("Saving expenses:", rows.length);
    const sql = neon(`${process.env.DATABASE_URL}`);

    try {
        for (const row of rows) {
            if (row.id) {
                // update existing expense
                await sql('UPDATE expenses SET name = $1, amount = $2, date = $3, account = $4, category = $5 WHERE id = $6', [
                    row.name,
                    row.amount,
                    formatDateToDB(row.date),
                    row.account,
                    row.category,
                    row.id
                ]);
            }
        }
        console.log('Rows saved successfully:', rows.length);
    } catch (error) {
        console.error('Error saving rows:', error);
    }
}

export async function updateNote(id, note) {
    'use server';

    if (!note || !id) {
        console.log("No note provided");
        return;
    }

    console.log("Updating expense note:", id, note);
    const sql = neon(`${process.env.DATABASE_URL}`);


    await sql('UPDATE expenses SET note = $1 WHERE id = $2', [note, id]);
}

export async function updateDate(id, date) {
    'use server';

    if (!date || !id) {
        console.log("No date provided");
        return;
    }

    console.log("Updating expense date:", id, date);
    const formattedDate = formatDateToDB(date);
    const sql = neon(`${process.env.DATABASE_URL}`);

    await sql('UPDATE expenses SET date = $1 WHERE id = $2', [
        formattedDate,
        id
    ]);
}