import { useState, useEffect } from "react";
import { parseAndPrepareRows, markDuplicates, computeDateRange } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, fetchExpensesByDateRange) {
    const [rows, setRows] = useState(expenses);

    useEffect(() => {
        const handlePaste = async (event) => {
            const pastedData = event.clipboardData.getData('Text');
            const parsed = parseAndPrepareRows(pastedData, rows).filter(pasteFilterLogic);

            if (parsed.length === 0) {
                return;
            }

            let marked = parsed;
            if (typeof fetchExpensesByDateRange === 'function') {
                const range = computeDateRange(parsed);
                const accounts = [...new Set(parsed.map((r) => r.account))];
                try {
                    const existing = await fetchExpensesByDateRange({ ...range, accounts });
                    marked = markDuplicates(parsed, existing);
                    console.log({ existing, marked });
                } catch (err) {
                    console.error('fetchExpensesByDateRange failed:', err);
                }
            }

            setRows(prev => {
                const ids = new Set(prev.map(r => r.id));
                return [...prev, ...marked.filter(r => !ids.has(r.id))];
            });
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [rows, pasteFilterLogic, fetchExpensesByDateRange]);

    return [rows, setRows];
}
