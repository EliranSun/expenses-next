import { neon } from '@neondatabase/serverless';
import PasteableExpensesTable from '@/features/PasteableExpensesTable';
export default async function YearMonthPage({ params }) {
  const { year, month } = await params;

  const formatDateToDB = async (date) => {
    'use server';
    const splitDate = date.split("-");
    const year = splitDate[0].slice(2);
    const month = splitDate[1];
    const day = splitDate[2];
    return `${day}/${month}/${year}`;
  }

  async function fetchExpenses() {
    const sql = neon(`${process.env.DATABASE_URL}`);


    // await sql('INSERT INTO expenses (name, amount, date, category, id) VALUES ($1, $2, $3, $4, $5)', [
    //   "test",
    //   100,
    //   "2024-01-01",
    //   "test",
    //   crypto.randomUUID()
    // ]);

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
      .filter(expense => expense.month === month && expense.year === year)
      .sort((a, b) => {
        if (a.timestamp === b.timestamp) {
          return a.name.localeCompare(b.name);
        }
        return a.timestamp - b.timestamp;
      });

    return mappedExpenses;
  }


  async function handleSave(rows) {
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
        } else {
          await sql('INSERT INTO expenses (name, amount, date, account, category, id) VALUES ($1, $2, $3, $4, $5, $6)', [
            row.name,
            row.amount,
            row.date,
            row.account,
            row.category,
            crypto.randomUUID(),
          ]);
        }
      }
      console.log('Rows saved successfully:', rows.length);
    } catch (error) {
      console.error('Error saving rows:', error);
    }
  }

  async function updateCategory(id, category) {
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

  async function updateNote(id, note) {
    'use server';

    if (!note || !id) {
      console.log("No note provided");
      return;
    }

    console.log("Updating expense note:", id, note);
    const sql = neon(`${process.env.DATABASE_URL}`);


    await sql('UPDATE expenses SET note = $1 WHERE id = $2', [note, id]);
  }

  async function updateDate(id, date) {
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

  const existingExpenses = await fetchExpenses();

  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PasteableExpensesTable
          year={year}
          month={month}
          onSave={handleSave}
          updateCategory={updateCategory}
          updateNote={updateNote}
          updateDate={updateDate}
          expenses={existingExpenses} />
      </main>
    </div>

  );
}
