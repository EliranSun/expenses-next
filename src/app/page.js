import { redirect } from 'next/navigation';
import { fetchExpenses, updateCategory, updateNote, deleteExpense } from '@/utils/db';
import PlainSearchableTable from '@/features/PlainSearchableTable';
import { MainNavBar } from '@/components/molecules/MainNavBar';
import { Categories } from '@/constants';

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
      <h1 dir="rtl" className="text-2xl font-bold text-center my-4 flex flex-wrap items-center justify-center gap-2">
        <span>{monthLabel}</span>
        {selectedCategories.length > 0 && (
          <span className="flex flex-wrap items-center gap-1 text-base font-normal">
            {selectedCategories.map((key) => {
              const cat = Categories[key];
              if (!cat) return null;
              return (
                <span key={key} className="bg-amber-500 text-white rounded-full px-3 py-1">
                  {cat.emoji} {cat.name}
                </span>
              );
            })}
          </span>
        )}
      </h1>
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
