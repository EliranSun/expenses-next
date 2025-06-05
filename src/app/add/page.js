import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import {
    deleteExpenses, fetchExpenses,
    getUnhandledExpenses, insertExpenses, updateCategory, deleteExpense, updateNote
} from '@/utils/db';
import Link from 'next/link';
export default async function Home({ searchParams }) {
    const { year, month, account } = await searchParams;

    const [unhandledExpenses, existingExpenses] = await Promise.all([
        getUnhandledExpenses({ year, month, account }),
        fetchExpenses({ year, month, account })
    ]);

    return (
        <div>
            <h1 className="text-2xl font-bold w-full text-center mt-4">ADD</h1>
            <Link href="/">HOME</Link>

            <PasteableExpensesTable
                existingExpenses={existingExpenses}
                expenses={unhandledExpenses}
                onSave={insertExpenses}
                deleteExpenses={deleteExpenses}
                updateCategory={updateCategory}
                deleteExpense={deleteExpense}
                updateNote={updateNote}
            />
        </div>
    );
}
