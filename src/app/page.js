import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchExpenses, updateExpense, deleteExpense, searchExpenses } from '@/utils/db';
import ExpensesExplorer from '@/features/ExpensesExplorer';
import { MainNavBar } from '@/components/molecules/MainNavBar';
import { Categories } from '@/constants';
import { categoryHref } from '@/utils/categoryRange';

export default async function Home({ searchParams }) {
  const today = new Date();
  const sp = await searchParams;
  const { year, month, account, category } = sp;
  const hasAnyParam = Object.values(sp).some((v) => v != null && v !== '');

  if (!hasAnyParam) {
    const defaultYear = String(today.getFullYear() % 100).padStart(2, '0');
    const defaultMonth = String(today.getMonth() + 1).padStart(2, '0');
    redirect(`/?year=${defaultYear}&month=${defaultMonth}`);
  }

  const existingExpenses = await fetchExpenses({
    year,
    month,
    account
  });

  const fullYear = year ? 2000 + Number(year) : null;
  let monthLabel;
  if (year && month) {
    monthLabel = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' })
      .format(new Date(fullYear, Number(month) - 1, 1));
  } else if (year) {
    monthLabel = String(fullYear);
  } else if (month) {
    monthLabel = new Intl.DateTimeFormat('he-IL', { month: 'long' })
      .format(new Date(2000, Number(month) - 1, 1));
  } else {
    monthLabel = 'הכל';
  }

  const selectedCategories = category ? category.split(',') : [];

  return (
    <div className="p-4">
      <MainNavBar />
      <h1 className="text-2xl font-bold text-center my-4 flex flex-wrap items-center justify-center gap-2">
        <span>{monthLabel}</span>
        {selectedCategories.length > 0 && (
          <span className="flex flex-wrap items-center gap-1 text-base font-normal">
            {selectedCategories.map((key) => {
              const cat = Categories[key];
              if (!cat) return null;
              return (
                <Link
                  key={key}
                  href={categoryHref({ category: key, year, month, account })}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-3 py-1">
                  {cat.emoji} {cat.name}
                </Link>
              );
            })}
          </span>
        )}
      </h1>
      <ExpensesExplorer
        items={existingExpenses}
        updateExpense={updateExpense}
        deleteExpense={deleteExpense}
        searchExpenses={searchExpenses}
      />
    </div>
  );
}
