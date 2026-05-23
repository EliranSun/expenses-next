import { useState, useEffect } from "react";
import { parseAndPrepareRows } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, existingExpenses = []) {
    const [rows, setRows] = useState(expenses);

    useEffect(() => {
        const handlePaste = (event) => {
            const pastedData = event.clipboardData.getData('Text');
            const prepared = parseAndPrepareRows(pastedData, existingExpenses, expenses)
                .filter(pasteFilterLogic);

            if (prepared.length === 0) {
                alert("No new expenses found");
                return;
            }

            setRows([...expenses, ...prepared]);
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [expenses, pasteFilterLogic, existingExpenses]);

    return [rows];
}
