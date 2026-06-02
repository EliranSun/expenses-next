import { useCallback, useState, useEffect } from "react";
import { ingestText } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, fetchExpensesByDateRange) {
    const [rows, setRows] = useState(expenses);

    // Ingest a chunk of TSV text (from a paste or a parsed PDF), flag duplicates,
    // then append the new rows — deduping against what's already staged.
    const ingestRows = useCallback(async (text) => {
        const marked = await ingestText(text, rows, fetchExpensesByDateRange);
        const filtered = marked.filter(pasteFilterLogic);
        if (filtered.length === 0) return 0;
        setRows(prev => {
            const ids = new Set(prev.map(r => r.id));
            return [...prev, ...filtered.filter(r => !ids.has(r.id))];
        });
        return filtered.length;
    }, [rows, pasteFilterLogic, fetchExpensesByDateRange]);

    useEffect(() => {
        const handlePaste = (event) => {
            const pastedData = event.clipboardData.getData('Text');
            void ingestRows(pastedData);
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [ingestRows]);

    return [rows, setRows, ingestRows];
}
