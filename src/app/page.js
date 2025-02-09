import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import { deleteExpenses, getUnhandledExpenses, insertExpenses, updateCategory } from '@/utils/db';

export default async function Home() {
  const unhandledExpenses = await getUnhandledExpenses();
  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PasteableExpensesTable
          expenses={unhandledExpenses}
          onSave={insertExpenses}
          deleteExpenses={deleteExpenses}
          updateCategory={updateCategory}
        />
      </main>
    </div>
  );
}
