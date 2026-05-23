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

    const [rows, setRows] = usePasteToRows(expenses, pasteFilterLogic, existingExpenses);

    const [phase, setPhase] = useState(expenses.length > 0 ? 'categorize' : 'paste');

    const handleMobileSave = async (newRows) => {
        const res = await run(onSave(newRows), { success: `Saved ${newRows.length} rows` });
        if (res?.ok) {
            setRows(prev => {
                const ids = new Set(prev.map(r => r.id));
                return [...prev, ...newRows.filter(r => !ids.has(r.id))];
            });
            setPhase('categorize');
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='max-w-screen-lg mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden'>
                <div className="px-0 w-full space-y-4 my-4">

                    <button
                        className="hidden md:flex bg-blue-500 text-white px-4 py-2 rounded-xl items-center gap-2"
                        onClick={() => run(onSave(rows), { success: `Saved ${rows.length} rows` })}>
                        Save rows to database ({rows.length})
                    </button>

                    {phase === 'paste' && (
                        <div className="md:hidden">
                            <MobilePasteScreen
                                existingExpenses={existingExpenses}
                                onSubmit={handleMobileSave}
                            />
                        </div>
                    )}

                    {phase === 'categorize' && (
                        <div className="md:hidden flex justify-end">
                            <button
                                type="button"
                                onClick={() => setPhase('paste')}
                                className="text-sm text-blue-600 underline">
                                + הדבק עוד
                            </button>
                        </div>
                    )}

                    <div className={phase === 'paste' ? 'hidden md:block' : ''}>
                        <Table
                            rows={rows}
                            updateCategory={updateCategory}
                            updateNote={updateNote}
                            updateDate={updateDate}
                            deleteExpense={deleteExpense}
                        />
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
