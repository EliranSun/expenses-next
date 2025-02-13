import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import { fetchExpenses } from '@/utils/db';
import { getDuplicates } from './utils';
export default async function YearMonthPage({ params }) {
    const { year, month } = await params;

    const existingExpenses = await fetchExpenses(year, month);
    const duplicates = getDuplicates(existingExpenses);

    return (
        <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <PasteableExpensesTable
                    year={year}
                    month={month}
                    expenses={duplicates} />
            </main>
        </div>

    );
}
