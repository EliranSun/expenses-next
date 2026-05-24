'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback, useState, Suspense } from "react";
import { run } from "@/utils/action";
import { MobilePasteScreen } from "./MobilePasteScreen";

export default function TextToExpensesTable({
    expenses = [],
    onSave,
    fetchExpensesByDateRange,
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

    const [rows, setRows] = usePasteToRows(expenses, pasteFilterLogic, fetchExpensesByDateRange);

    const [phase, setPhase] = useState(expenses.length > 0 ? 'categorize' : 'paste');

    const saveableRows = rows.filter((r) => !r.isDuplicate);
    const duplicateCount = rows.length - saveableRows.length;

    const handleMobileSave = async (newRows) => {
        const toInsert = newRows.filter((r) => !r.isDuplicate);
        if (toInsert.length === 0) return;
        const res = await run(onSave(toInsert), { success: `Saved ${toInsert.length} rows` });
        if (res?.ok) {
            setRows(prev => {
                const ids = new Set(prev.map(r => r.id));
                const merged = [...prev, ...newRows.filter(r => !ids.has(r.id))];
                return merged.filter(r => !r.isDuplicate);
            });
            setPhase('categorize');
        }
    };

    const unmarkDuplicate = (id) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isDuplicate: false } : r));
    };

    const handleDesktopSave = async () => {
        if (saveableRows.length === 0) return;
        const res = await run(onSave(saveableRows), { success: `Saved ${saveableRows.length} rows` });
        if (res?.ok) {
            setRows(prev => prev.filter(r => !r.isDuplicate));
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='max-w-screen-lg mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden'>
                <div className="px-0 w-full space-y-4 my-4">

                    <button
                        disabled={saveableRows.length === 0}
                        className="hidden md:flex bg-blue-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl items-center gap-2"
                        onClick={handleDesktopSave}>
                        Save rows to database ({saveableRows.length})
                        {duplicateCount > 0 && (
                            <span className="text-xs opacity-80">+{duplicateCount} duplicates skipped</span>
                        )}
                    </button>

                    {phase === 'paste' && (
                        <div className="md:hidden">
                            <MobilePasteScreen
                                fetchExpensesByDateRange={fetchExpensesByDateRange}
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
                            unmarkDuplicate={unmarkDuplicate}
                        />
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
