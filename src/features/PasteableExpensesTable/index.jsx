'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback } from "react";
import { Suspense } from "react";

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

    const [rows] = usePasteToRows(expenses, pasteFilterLogic, existingExpenses, onSave);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='max-w-screen-lg mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden'>
                <div className="px-0 w-full space-y-8 my-4">
                    <Table
                        rows={rows}
                        updateCategory={updateCategory}
                        updateNote={updateNote}
                        updateDate={updateDate}
                        deleteExpense={deleteExpense}
                    />
                </div>
            </div>
        </Suspense>
    );
}