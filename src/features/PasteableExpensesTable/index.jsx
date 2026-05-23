'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback, useState, Suspense } from "react";
import { run } from "@/utils/action";
import { MobilePasteScreen } from "./MobilePasteScreen";

export default function TextToExpensesTable({
    expenses = [],
    existingExpenses = [],
    onSave,
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense
}) {
    const pasteFilterLogic = useCallback((row) => !expenses.some(expense => {
        return expense.id === row.id || (
            expense.name === row.name &&
            expense.amount === row.amount &&
            expense.account === row.account &&
            expense.date === row.date
        );
    }, [expenses]));

    const [desktopRows] = usePasteToRows(expenses, pasteFilterLogic, existingExpenses);

    const [phase, setPhase] = useState(expenses.length > 0 ? 'categorize' : 'paste');
    const [savedPool, setSavedPool] = useState(expenses);

    const handleMobileSave = async (rowsToSave) => {
        const res = await run(onSave(rowsToSave), { success: `Saved ${rowsToSave.length} rows` });
        if (res?.ok) {
            setSavedPool((prev) => [...prev, ...rowsToSave]);
            setPhase('categorize');
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='max-w-screen-lg mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden'>

                {/* Desktop: existing single-view paste-anywhere flow */}
                <div className="hidden md:block px-0 w-full space-y-8 my-4">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => run(onSave(desktopRows), { success: `Saved ${desktopRows.length} rows` })}>
                        Save rows to database ({desktopRows.length})
                    </button>
                    <Table
                        rows={desktopRows}
                        updateCategory={updateCategory}
                        updateNote={updateNote}
                        updateDate={updateDate}
                        deleteExpense={deleteExpense}
                    />
                </div>

                {/* Mobile: two-screen phased flow */}
                <div className="md:hidden w-full my-4">
                    {phase === 'paste' && (
                        <MobilePasteScreen
                            existingExpenses={existingExpenses}
                            onSubmit={handleMobileSave}
                        />
                    )}
                    {phase === 'categorize' && (
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setPhase('paste')}
                                    className="text-sm text-blue-600 underline">
                                    + הדבק עוד
                                </button>
                            </div>
                            <Table
                                rows={savedPool}
                                updateCategory={updateCategory}
                                updateNote={updateNote}
                                updateDate={updateDate}
                                deleteExpense={deleteExpense}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Suspense>
    );
}
