import { useState, useEffect, useCallback } from "react";
import { parseAndPrepareRows, enrichRows } from "./parseAndPrepareRows";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => true, fetchExpensesByDateRange, fetchCategoryHistory) {
    const [rows, setRows] = useState(expenses);

    const addRows = useCallback(async (prepared, { source } = {}) => {
        if (prepared.length === 0) {
            return;
        }

        const enriched = await enrichRows(prepared, { fetchExpensesByDateRange, fetchCategoryHistory, source });
        // Not in the DB yet - category edits must stay local until save.
        const marked = enriched.map((r) => ({ ...r, isUnsaved: true }));

        setRows(prev => {
            const ids = new Set(prev.map(r => r.id));
            return [...prev, ...marked.filter(r => !ids.has(r.id))];
        });
    }, [fetchExpensesByDateRange, fetchCategoryHistory]);

    const ingest = useCallback(
        (text, options) => addRows(parseAndPrepareRows(text, rows).filter(pasteFilterLogic), options),
        [rows, pasteFilterLogic, addRows]
    );

    useEffect(() => {
        const handlePaste = (event) => {
            void ingest(event.clipboardData.getData('Text'));
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [ingest]);

    return [rows, setRows, ingest, addRows];
}
