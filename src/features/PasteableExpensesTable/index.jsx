'use client';

import Table from "@/components/organisms/table";
import usePasteToRows, { useDocumentPaste } from "./usePasteToRows";
import { useCallback, useMemo, useState, Suspense } from "react";
import { toast } from "sonner";
import { run } from "@/utils/action";
import { isValidInsertRow } from "@/utils";
import { MobilePasteScreen } from "./MobilePasteScreen";
import { PdfImportButton } from "@/features/PdfImport/PdfImportButton";
import { ManualExpenseButton } from "@/features/ManualExpense/ManualExpenseButton";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ok = () => Promise.resolve({ ok: true });

const toTimestamp = (date) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
};

// What the server stores; client-only flags stay behind.
const toInsertRow = ({ id, name, amount, date, account, category, note, source }) => ({
    id,
    name,
    amount,
    date,
    account,
    category: category || null,
    note: note?.trim() ? note : null,
    ...(source ? { source } : {}),
});

function ReviewBar({ saveableCount, duplicateCount, uncategorizedCount, saving, onSave, onDiscard, onAddMore }) {
    return (
        <div dir="rtl" className="flex flex-col gap-2 bg-blue-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-sm">
                <span className="font-semibold">עדיין לא נשמר.</span>
                {` ${saveableCount} שורות לשמירה`}
                {duplicateCount > 0 && ` · ${duplicateCount} כפולות (לא יישמרו)`}
                {uncategorizedCount > 0 && ` · ${uncategorizedCount} ללא קטגוריה`}
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={saveableCount === 0 || saving}
                    onClick={onSave}
                    className="flex-1 md:flex-none bg-blue-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-semibold">
                    {saving ? 'Saving…' : `Save ${saveableCount} ${saveableCount === 1 ? 'row' : 'rows'}`}
                </button>
                <button
                    type="button"
                    onClick={onAddMore}
                    className="md:hidden bg-gray-200 text-gray-800 px-3 py-2 rounded-xl">
                    + הוסף עוד
                </button>
                <button
                    type="button"
                    disabled={saving}
                    onClick={onDiscard}
                    className="border border-red-300 text-red-600 px-3 py-2 rounded-xl">
                    Discard
                </button>
            </div>
        </div>
    );
}

export default function TextToExpensesTable({
    expenses = [],
    onSave,
    fetchExpensesByDateRange,
    fetchCategoryHistory,
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense
}) {
    // Saved rows that still need a category. Edits on them go straight to the DB.
    const [pending, setPending] = useState(expenses);
    // Rows not saved yet. Edits on them stay local until "Save".
    const { drafts, ingest, addRows, updateDraft, removeDraft, clearDrafts } =
        usePasteToRows({ staged: pending, fetchExpensesByDateRange, fetchCategoryHistory });
    const [mobileStep, setMobileStep] = useState(expenses.length > 0 ? 'list' : 'input');
    const [saving, setSaving] = useState(false);

    const hasDrafts = drafts.length > 0;
    const saveable = drafts.filter((r) => !r.isDuplicate);
    const duplicateCount = drafts.length - saveable.length;
    const uncategorizedCount = saveable.filter((r) => !r.category).length;

    const afterAdd = useCallback((added) => {
        if (added > 0) setMobileStep('list');
        else toast('No new rows found');
        return added;
    }, []);

    const ingestText = useCallback(
        async (text, options) => afterAdd(await ingest(text, options)),
        [ingest, afterAdd]
    );
    const addManualRows = useCallback(
        async (rows, options) => afterAdd(await addRows(rows, options)),
        [addRows, afterAdd]
    );

    useDocumentPaste(ingestText);

    const draftHandlers = useMemo(() => ({
        updateCategory: (id, category) => {
            updateDraft(id, { category, autoCategory: false });
            return ok();
        },
        updateNote: (id, note) => {
            updateDraft(id, { note });
            return ok();
        },
        updateDate: (id, date) => {
            if (!ISO_DATE.test(date ?? '')) return Promise.resolve({ ok: false, error: 'Invalid date' });
            updateDraft(id, { date, timestamp: toTimestamp(date) });
            return ok();
        },
        deleteExpense: (id) => {
            removeDraft(id);
            return ok();
        },
        unmarkDuplicate: (id) => updateDraft(id, { isDuplicate: false }),
    }), [updateDraft, removeDraft]);

    const pendingHandlers = useMemo(() => {
        const patch = (id, values) =>
            setPending((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)));
        const persist = (call, toPatch) => async (id, value) => {
            const res = await call(id, value);
            if (res?.ok) patch(id, toPatch(value));
            return res;
        };
        return {
            updateCategory: persist(updateCategory, (category) => ({ category })),
            updateNote: persist(updateNote, (note) => ({ note })),
            updateDate: persist(updateDate, (date) => ({ date, timestamp: toTimestamp(date) })),
            deleteExpense: async (id) => {
                const res = await deleteExpense(id);
                if (res?.ok) setPending((prev) => prev.filter((r) => r.id !== id));
                return res;
            },
        };
    }, [updateCategory, updateNote, updateDate, deleteExpense]);

    const handleSave = async () => {
        if (saveable.length === 0 || saving) return;
        setSaving(true);
        try {
            const payload = saveable.map(toInsertRow);
            const res = await run(onSave(payload));
            if (!res?.ok) return;

            // The server skips invalid rows and returns ids for the rest, in order.
            const valid = payload.filter(isValidInsertRow);
            const ids = Array.isArray(res.data?.ids) ? res.data.ids : valid.map((r) => r.id);
            const draftsById = new Map(saveable.map((r) => [r.id, r]));
            const needsCategory = valid
                .map((row, i) => ({ ...draftsById.get(row.id), id: ids[i] ?? row.id }))
                .filter((row) => !row.category)
                .map(({ isDuplicate, autoCategory, ...row }) => row);

            toast.success(`Saved ${valid.length} rows`);
            if (valid.length < payload.length) {
                toast.warning(`Skipped ${payload.length - valid.length} invalid rows`);
            }

            setPending((prev) => [...prev, ...needsCategory]);
            clearDrafts();
            setMobileStep(pending.length + needsCategory.length > 0 ? 'list' : 'input');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (!window.confirm(`Discard ${drafts.length} unsaved rows?`)) return;
        clearDrafts();
        setMobileStep(pending.length > 0 ? 'list' : 'input');
    };

    const showMobileInput = mobileStep === 'input' || (!hasDrafts && pending.length === 0);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="max-w-screen-lg mx-auto w-full flex flex-col gap-4 my-4">
                <div dir="rtl" className="hidden md:flex items-center gap-2">
                    <PdfImportButton onText={ingestText} />
                    <ManualExpenseButton onRows={addManualRows} variant="modal" />
                    <span className="text-sm text-gray-500">או הדבק שורות בכל מקום בעמוד</span>
                </div>

                {showMobileInput && (
                    <div className="md:hidden">
                        <MobilePasteScreen
                            onText={ingestText}
                            onRows={addManualRows}
                            draftCount={drafts.length}
                            onReview={() => setMobileStep('list')}
                        />
                    </div>
                )}

                <div className={`${showMobileInput ? 'hidden md:flex' : 'flex'} flex-col gap-4`}>
                    {hasDrafts ? (
                        <ReviewBar
                            saveableCount={saveable.length}
                            duplicateCount={duplicateCount}
                            uncategorizedCount={uncategorizedCount}
                            saving={saving}
                            onSave={handleSave}
                            onDiscard={handleDiscard}
                            onAddMore={() => setMobileStep('input')}
                        />
                    ) : (
                        <div dir="rtl" className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-600">
                                {`${pending.length} הוצאות שמורות ממתינות לקטגוריה`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileStep('input')}
                                className="md:hidden text-sm text-blue-600 underline">
                                + הוסף הוצאות
                            </button>
                        </div>
                    )}

                    <Table
                        key={hasDrafts ? 'drafts' : 'pending'}
                        rows={hasDrafts ? drafts : pending}
                        liveEdits={hasDrafts}
                        {...(hasDrafts ? draftHandlers : pendingHandlers)}
                    />
                </div>
            </div>
        </Suspense>
    );
}
