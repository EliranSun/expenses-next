import { fetchExpenses, updateCategory, updateNote } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
  const { year, month, account } = await searchParams;
  const existingExpenses = await fetchExpenses({ year, month, account });

  return (
    <div className="p-8">
      <MainNavBar />
      <PlainSearchableTable
        items={existingExpenses}
        updateCategory={updateCategory}
        updateNote={updateNote}
      />
    </div>
  );
}
