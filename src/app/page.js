import { fetchExpenses, updateCategory } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import Link from 'next/link';

export default async function Home({ searchParams }) {
  const { year, month, account } = await searchParams;
  const existingExpenses = await fetchExpenses({ year, month, account });

  console.log({ year, month, account });

  return (
    <div className="p-8">

      <Link href="/add">Add</Link>
      <h1 className="text-2xl font-bold w-full text-center mt-4">HOME</h1>

      <PlainSearchableTable
        items={existingExpenses}
        updateCategory={updateCategory}
      />
    </div>
  );
}
