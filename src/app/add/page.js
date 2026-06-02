import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import {
    deleteExpenses,
    fetchExpensesByDateRange,
    getUnhandledExpenses,
    insertExpenses,
    updateCategory,
    deleteExpense,
    updateNote,
    updateDate
} from '@/utils/db';
import { parsePdfToTsv } from '@/utils/parsePdf';
import { MainNavBar } from '@/components/molecules/MainNavBar';

export default async function Home({ searchParams }) {
    const { year, month, account } = await searchParams;

    const unhandledExpenses = await getUnhandledExpenses({ year, month, account });

    return (
        <div className="p-4">
            <MainNavBar />
            <PasteableExpensesTable
                expenses={unhandledExpenses}
                onSave={insertExpenses}
                parsePdf={parsePdfToTsv}
                fetchExpensesByDateRange={fetchExpensesByDateRange}
                deleteExpenses={deleteExpenses}
                updateCategory={updateCategory}
                deleteExpense={deleteExpense}
                updateNote={updateNote}
                updateDate={updateDate}
            />
        </div>
    );
}
