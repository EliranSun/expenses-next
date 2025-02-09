import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import { deleteExpenses, fetchExpenses, getUnhandledExpenses, insertExpenses, updateCategory } from '@/utils/db';

export default async function Home() {
  const [unhandledExpenses, existingExpenses] = await Promise.all([
    getUnhandledExpenses(),
    fetchExpenses()
  ]);

  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PasteableExpensesTable
          existingExpenses={existingExpenses}
          expenses={unhandledExpenses}
          onSave={insertExpenses}
          deleteExpenses={deleteExpenses}
          updateCategory={updateCategory}
        />
        <textarea className='border-2 border-gray-300 rounded-md p-2' />
      </main>
    </div>
  );
}
