'use client';

import Table from "@/components/organisms/table";
import usePasteToRows from "@/features/PasteableExpensesTable/usePasteToRows";
import { useCallback, useState } from "react";
import { Suspense } from "react";
import { Navbar } from "@/components/molecules/navbar";
import Search from "@/features/Search";

export default function TextToExpensesTable({
    expenses = [],
    existingExpenses = [],
    onSave,
    updateCategory,
    updateNote,
    updateDate,
    year,
    month,
    deleteExpenses,
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

    const [rows] = usePasteToRows(expenses, pasteFilterLogic, existingExpenses);
    const [searchResults, setSearchResults] = useState(rows);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="w-full mx-auto flex flex-row-reverse gap-8 p-8">
                <div className="w-1/4">
                    <Navbar year={year} month={month} />
                </div>
                {/* <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md fixed bottom-10 left-8"
                onClick={() => onSave(rows)}>Save {rows.length}</button>
            <button
                className="bg-red-500 text-white px-4 py-2 rounded-md fixed bottom-10 left-36"
                onClick={() => deleteExpenses(rows.map(row => row.id))}>
                Delete {rows.length}
            </button> */}
                <div className="w-3/4 flex flex-col gap-8">
                    <Search items={rows} onSearch={setSearchResults} />
                    <Table
                        rows={searchResults}
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