import { useState, useEffect, useCallback, useRef } from "react";
import { parseAndPrepareRows, enrichRows, matchesFingerprint } from "./parseAndPrepareRows";

const isEditableTarget = (target) =>
    !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Rows pasted, imported or typed in but not saved yet. Every edit stays in
// this state until the whole batch is inserted.
export default function usePasteToRows({ staged = [], fetchExpensesByDateRange, fetchCategoryHistory } = {}) {
    const [drafts, setDrafts] = useState([]);

    // Resolves to the number of rows added.
    const addRows = useCallback(async (prepared, { source } = {}) => {
        if (prepared.length === 0) return 0;

        const enriched = await enrichRows(prepared, { fetchExpensesByDateRange, fetchCategoryHistory, source });

        // Re-check against the latest drafts: another paste may have landed
        // while the lookups above were in flight.
        setDrafts((prev) => {
            const fresh = enriched.filter((row) =>
                !prev.some((draft) => draft.id === row.id || (row.source && matchesFingerprint(draft, row)))
            );
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
        return enriched.length;
    }, [fetchExpensesByDateRange, fetchCategoryHistory]);

    const ingest = useCallback((text, options) => {
        if (!text || !text.trim()) return Promise.resolve(0);
        return addRows(parseAndPrepareRows(text, [...staged, ...drafts]), options);
    }, [staged, drafts, addRows]);

    const updateDraft = useCallback((id, patch) => {
        setDrafts((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    }, []);

    const removeDraft = useCallback((id) => {
        setDrafts((prev) => prev.filter((row) => row.id !== id));
    }, []);

    const clearDrafts = useCallback(() => setDrafts([]), []);

    return { drafts, ingest, addRows, updateDraft, removeDraft, clearDrafts };
}

// Pasting anywhere on the page imports rows. Pastes into a field (the mobile
// textarea, a note input) are left to that field.
export function useDocumentPaste(onText) {
    const onTextRef = useRef(onText);
    useEffect(() => {
        onTextRef.current = onText;
    }, [onText]);

    useEffect(() => {
        const handlePaste = (event) => {
            if (isEditableTarget(event.target)) return;
            const text = event.clipboardData?.getData('Text') ?? '';
            if (!text.trim()) return;
            void onTextRef.current(text);
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);
}
