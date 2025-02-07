'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback } from "react";
import { Suspense } from "react";
import { Navbar } from "@/components/molecules/date-navbar";

export default function TextToExpensesTable({
    expenses = [],
    onSave,
    updateCategory,
    updateNote,
    updateDate,
    year,
    month,
    deleteExpenses
}) {
    const pasteFilterLogic = useCallback((row) => !expenses.some(expense => {
        return expense.id === row.id || (
            expense.name === row.name &&
            expense.amount === row.amount &&
            expense.account === row.account &&
            expense.date === row.date
        );
    }, [expenses]));

    const [rows] = usePasteToRows(expenses, pasteFilterLogic);

    console.log({ expenses, rows });

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Navbar year={year} month={month} />
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md fixed bottom-10 left-8"
                onClick={() => onSave(rows)}>Save {rows.length}</button>
            <button
                className="bg-red-500 text-white px-4 py-2 rounded-md fixed bottom-10 left-36"

                onClick={() => deleteExpenses(rows.map(row => row.id))}>Delete {rows.length}</button>
            <Table
                rows={rows}
                updateCategory={updateCategory}
                updateNote={updateNote}
                updateDate={updateDate}

            />
        </Suspense>
    );
}