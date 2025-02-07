'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback } from "react";

export default function TextToExpensesTable({ expenses = [], onSave, updateCategory, updateNote, updateDate }) {
    const pasteFilterLogic = useCallback((row) => !expenses.some(expense => {
        return expense.id === row.id || (
            expense.name === row.name &&
            expense.amount === row.amount &&
            expense.account === row.account &&
            expense.date === row.date
        );
    }, [expenses]));

    const [rows] = usePasteToRows(expenses, pasteFilterLogic);

    return (
        <>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                onClick={() => onSave(rows)}>Save</button>
            <Table
                rows={rows}
                updateCategory={updateCategory}
                updateNote={updateNote}
                updateDate={updateDate}
            />
        </>
    );
}