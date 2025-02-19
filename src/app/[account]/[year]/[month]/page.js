import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import { updateCategory, fetchExpenses, deleteExpense, updateNote, updateDate, updateExpenses } from '@/utils/db';

export default async function YearMonthPage({ params }) {
  const { year, month } = await params;
  const existingExpenses = await fetchExpenses({ year, month });

  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PasteableExpensesTable
          year={year}
          month={month}
          onSave={updateExpenses}
          updateCategory={updateCategory}
          updateNote={updateNote}
          updateDate={updateDate}
          deleteExpense={deleteExpense}
          expenses={existingExpenses} />
      </main>
    </div>

  );
}
