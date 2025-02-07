import { neon } from '@neondatabase/serverless';
import PasteableExpensesTable from '@/features/PasteableExpensesTable';

export default async function YearMonthPage({ params }) {
  const { year, month } = await params;


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
        date: `${year}-${month}-${day}`,
        timestamp: new Date(year, month - 1, day)
      };

    }).sort((a, b) => a.timestamp - b.timestamp);



    return mappedExpenses;
  }


  async function handleSave(rows) {
    'use server';
    console.log("Saving expenses:", rows.length);
    const sql = neon(`${process.env.DATABASE_URL}`);

    try {
      for (const row of rows) {
        await sql('INSERT INTO expenses (name, amount, date, account, category, id) VALUES ($1, $2, $3, $4, $5, $6)', [
          row.name,
          row.amount,
          row.date,
          row.account,
          row.category,
          row.id
        ]);
      }
      console.log('Rows saved successfully:', rows.length);
    } catch (error) {
      console.error('Error saving rows:', error);
    }
  }

  async function updateCategory(id, category) {
    'use server';

    if (!category) {
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

    if (!note) {
      console.log("No note provided");
      return;
    }

    console.log("Updating expense note:", id, note);
    const sql = neon(`${process.env.DATABASE_URL}`);


    await sql('UPDATE expenses SET note = $1 WHERE id = $2', [note, id]);
  }

  const existingExpenses = await fetchExpenses();

  console.log(year, month);

  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <ul className="grid grid-cols-12 gap-4 w-10/12 border-b border-gray-200">
        {['2024', '2025', '2026'].map((y) => (
          <li key={y} className={(y === year ? "bg-gray-200" : "")}>{y}</li>
        ))}
      </ul>

      <ul className="grid grid-cols-12 gap-4 w-10/12 border-b border-gray-200">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
          <li key={m} className={(m === month ? "bg-gray-200" : "")}>{m}</li>
        ))}
      </ul>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PasteableExpensesTable

          onSave={handleSave}
          updateCategory={updateCategory}
          updateNote={updateNote}
          expenses={existingExpenses} />
      </main>
    </div>

  );
}
