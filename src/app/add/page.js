import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import {
    deleteExpenses,
    fetchExpenses,
    getAccounts,
    getBudget,
    getUnhandledExpenses,
    insertExpenses,
    updateCategory,
    deleteExpense,
    updateNote
} from '@/utils/db';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
    const { year, month, account } = await searchParams;
    const resolvedYear = year ?? new Date().getFullYear().toString().slice(2);
    const resolvedMonth = month ?? new Date().getMonth() + 1;

    const [unhandledExpenses, existingExpenses, accounts, budget] = await Promise.all([
        getUnhandledExpenses({ year, month, account }),
        fetchExpenses({ year, month, account }),
        getAccounts(),
        getBudget(resolvedYear, resolvedMonth),
    ]);

    return (
        <div className="p-4">
            <MainNavBar />
            <PasteableExpensesTable
                existingExpenses={existingExpenses}
                expenses={unhandledExpenses}
                onSave={insertExpenses}
                deleteExpenses={deleteExpenses}
                updateCategory={updateCategory}
                deleteExpense={deleteExpense}
                updateNote={updateNote}
                accounts={accounts}
                budget={budget}
                year={resolvedYear}
                month={resolvedMonth}
            />
        </div>
    );
}
