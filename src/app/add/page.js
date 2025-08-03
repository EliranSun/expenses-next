import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import {
    deleteExpenses, fetchExpenses,
    getUnhandledExpenses, insertExpenses, updateCategory, deleteExpense, updateNote
} from '@/utils/db';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
    const { year, month, account } = await searchParams;

    const [unhandledExpenses, existingExpenses] = await Promise.all([
        getUnhandledExpenses({ year, month, account }),
        fetchExpenses({ year, month, account })
    ]);

    return (
        <div className="p-8">
            <MainNavBar />

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
