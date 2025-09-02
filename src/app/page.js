import { fetchExpenses, updateCategory, updateNote } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
  const today = new Date();
  const { year, month, account } = await searchParams;
  const existingExpenses = await fetchExpenses({
    year: year || today.getFullYear(),
    month: month || today.getMonth() + 1,
    account
  });

  return (
    <div className="md:p-8 p-4">
      <MainNavBar />
      <PlainSearchableTable
        year={Number(year) + 2000 || today.getFullYear()}
        month={month || today.getMonth() + 1}
        items={existingExpenses}
        updateCategory={updateCategory}
        updateNote={updateNote}
      />
    </div>
  );
}
