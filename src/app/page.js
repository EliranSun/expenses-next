import { fetchExpenses } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';

export default async function Home() {
  const allExpenses = await fetchExpenses();

  return (
    <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <PlainSearchableTable items={allExpenses} />
      </main>
    </div>
  );
}
