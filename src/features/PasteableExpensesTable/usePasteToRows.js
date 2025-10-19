import { useState, useEffect } from "react";
import { parseTextToRows } from "@/utils";
import { formatDateFromDB } from '@/utils';

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => { }, existingExpenses = []) {
    const [rows, setRows] = useState(expenses);

    useEffect(() => {
        const handlePaste = (event) => {
            const pastedData = event.clipboardData.getData('Text');
            const parsedRows = parseTextToRows(pastedData);

            const filteredRows = parsedRows
                .filter(pasteFilterLogic)
                .filter(row => {
                    const existingExpense = existingExpenses.find(expense =>
                        expense.name === row.name &&
                        expense.amount === row.amount &&
                        expense.date === formatDateFromDB(row.date) &&
                        expense.account === row.account
                    );

                    return !existingExpense;
                });

            const newRows = [
                ...expenses,
                ...filteredRows.map(row => {
                    const splitDate = row.date.split("/");
                    const year = splitDate[2];
                    const month = splitDate[1];
                    const day = splitDate[0];

                    return {
                        ...row,
                        id: crypto.randomUUID(),
                        date: `20${year}-${month}-${day}`,
                        timestamp: new Date(`20${year}`, month - 1, day).getTime()
                    };
                })

            ];

            if (newRows.length === 0) {
                alert("No new expenses found");
                return;
            }

            setRows(newRows);
        };


        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [expenses, pasteFilterLogic, existingExpenses]);

    return [rows];
}