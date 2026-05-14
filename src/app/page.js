import { fetchExpenses, getAccounts, updateCategory, updateNote, deleteExpense } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
  const today = new Date();
  const { year, month, account } = await searchParams;
  const [existingExpenses, accounts] = await Promise.all([
    fetchExpenses({ year, month, account }),
    getAccounts(),
  ]);

  return (
    <div className="p-4">
      <MainNavBar />
      <PlainSearchableTable
        year={Number(year) + 2000 || today.getFullYear()}
        month={month || today.getMonth() + 1}
        items={existingExpenses}
        accounts={accounts}
        updateCategory={updateCategory}
        updateNote={updateNote}
        deleteExpense={deleteExpense}
      />
    </div>
  );
}
