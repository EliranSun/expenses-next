import { redirect } from 'next/navigation';
import { fetchExpenses, updateCategory, updateNote, deleteExpense } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
  const today = new Date();
  const { year, month, account } = await searchParams;

  if (!year && !month) {
    const defaultYear = String(today.getFullYear() % 100).padStart(2, '0');
    const defaultMonth = String(today.getMonth() + 1).padStart(2, '0');
    const params = new URLSearchParams({ year: defaultYear, month: defaultMonth });
    if (account) params.set('account', account);
    redirect(`/?${params.toString()}`);
  }

  const existingExpenses = await fetchExpenses({
    year,
    month,
    account
  });

  return (
    <div className="p-4">
      <MainNavBar />
      <PlainSearchableTable
        year={Number(year) + 2000 || today.getFullYear()}
        month={month || today.getMonth() + 1}
        items={existingExpenses}
        updateCategory={updateCategory}
        updateNote={updateNote}
        deleteExpense={deleteExpense}
      />
    </div>
  );
}
