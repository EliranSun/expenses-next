import { useState, useEffect, useCallback } from "react";
import { parseAndPrepareRows, enrichRows } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, fetchExpensesByDateRange, fetchCategoryHistory) {
    const [rows, setRows] = useState(expenses);

    const ingest = useCallback(async (text, { source } = {}) => {
        const parsed = parseAndPrepareRows(text, rows).filter(pasteFilterLogic);

        if (parsed.length === 0) {
            return;
        }

        const marked = await enrichRows(parsed, { fetchExpensesByDateRange, fetchCategoryHistory, source });

        setRows(prev => {
            const ids = new Set(prev.map(r => r.id));
            return [...prev, ...marked.filter(r => !ids.has(r.id))];
        });
    }, [rows, pasteFilterLogic, fetchExpensesByDateRange, fetchCategoryHistory]);

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
