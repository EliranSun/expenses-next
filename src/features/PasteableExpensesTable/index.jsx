'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback } from "react";

export default function TextToExpensesTable({ expenses = [], onSave, updateCategory, updateNote }) {
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
            <Table
                rows={rows}
                updateCategory={updateCategory}
                updateNote={updateNote}
            />
        </>
    );
}