import PasteableExpensesTable from '@/features/PasteableExpensesTable';
import { updateCategory, fetchExpenses, deleteExpense, updateNote, updateDate, updateExpenses } from '@/utils/db';

export default async function AccountPage({ params }) {
    const { account } = await params;
    const existingExpenses = await fetchExpenses({ account });

    return (
        <div className="flex flex-col gap-1 w-full h-full items-center justify-center">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <PasteableExpensesTable
                    account={account}
                    onSave={updateExpenses}
                    updateCategory={updateCategory}
                    updateNote={updateNote}
                    updateDate={updateDate}
                    deleteExpense={deleteExpense}
                    expenses={existingExpenses} />
            </main>
        </div>

    );
}
