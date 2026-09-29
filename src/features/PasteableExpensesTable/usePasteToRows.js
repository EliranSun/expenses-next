import { useState, useEffect, useCallback } from "react";
import { parseAndPrepareRows, markDuplicates, computeDateRange } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, fetchExpensesByDateRange) {
    const [rows, setRows] = useState(expenses);

    const ingest = useCallback(async (text, { source } = {}) => {
        const parsed = parseAndPrepareRows(text, rows).filter(pasteFilterLogic);

        if (parsed.length === 0) {
            return;
        }

        let marked = parsed;
        if (typeof fetchExpensesByDateRange === 'function') {
            const range = computeDateRange(parsed);
            const accounts = [...new Set(parsed.map((r) => r.account))];
            try {
                const existing = await fetchExpensesByDateRange({ ...range, accounts });
                marked = markDuplicates(parsed, existing, { matchName: source !== 'pdf' });
            } catch (err) {
                console.error('fetchExpensesByDateRange failed:', err);
            }
        }

        setRows(prev => {
            const ids = new Set(prev.map(r => r.id));
            return [...prev, ...marked.filter(r => !ids.has(r.id))];
        });
    }, [rows, pasteFilterLogic, fetchExpensesByDateRange]);

    useEffect(() => {
        const handlePaste = (event) => {
            void ingest(event.clipboardData.getData('Text'));
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [ingest]);

    return [rows, setRows, ingest];
}
