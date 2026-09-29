'use client';

import { useRef, useState } from 'react';
import { parseAndPrepareRows, enrichRows } from './parseAndPrepareRows';
import { CurrencyAmount } from '@/components/atoms/currency-amount';
import { formatDate } from '@/utils/formatDate';
import { AccountName } from '@/constants/account';
import { Categories } from '@/constants';
import { PdfImportButton } from '@/features/PdfImport/PdfImportButton';

export function MobilePasteScreen({ fetchExpensesByDateRange, fetchCategoryHistory, onSubmit }) {
    const [unsavedRows, setUnsavedRows] = useState([]);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const textareaRef = useRef(null);

    const ingest = async (raw, { source } = {}) => {
        if (!raw || !raw.trim()) return;
        const parsed = parseAndPrepareRows(raw, unsavedRows);
        if (parsed.length === 0) {
            return;
        }

        const marked = await enrichRows(parsed, { fetchExpensesByDateRange, fetchCategoryHistory, source });

        setUnsavedRows((prev) => [...prev, ...marked]);
        setText('');
    };

    const handlePaste = (event) => {
        const raw = event.clipboardData?.getData('Text') ?? '';
        if (!raw.trim()) return;
        event.preventDefault();
        void ingest(raw);
    };

    const handleParseClick = () => {
        void ingest(text);
        textareaRef.current?.focus();
    };

    const removeRow = (id) => {
        setUnsavedRows((prev) => prev.filter((r) => r.id !== id));
    };

    const setRowCategory = (id, category) => {
        setUnsavedRows((prev) => prev.map((r) => r.id === id ? { ...r, category } : r));
        setEditingCategoryId(null);
    };

    const unmarkDuplicate = (id) => {
        setUnsavedRows((prev) => prev.map((r) => r.id === id ? { ...r, isDuplicate: false } : r));
    };

    const saveableRows = unsavedRows.filter((r) => !r.isDuplicate);
    const duplicateCount = unsavedRows.length - saveableRows.length;

    const handleSave = async () => {
        if (saveableRows.length === 0 || submitting) return;
        setSubmitting(true);
        try {
            await onSubmit(unsavedRows);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div dir="rtl" className="flex flex-col gap-4 w-full">
            <div>
                <h2 className="text-xl font-bold">הדבק הוצאות</h2>
                <p className="text-sm text-gray-500" dir="ltr">
                    Tab-separated: name &nbsp;|&nbsp; date &nbsp;|&nbsp; account &nbsp;|&nbsp; action &nbsp;|&nbsp; amount, or a bank PDF
                </p>
            </div>

            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handlePaste}
                rows={6}
                dir="ltr"
                placeholder="Paste rows here…"
                className="border border-gray-300 rounded-xl p-3 w-full font-mono text-sm bg-white dark:bg-gray-800"
            />

            <div className="flex gap-2">
                {text.trim() && (
                    <button
                        type="button"
                        onClick={handleParseClick}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl">
                        Parse text
                    </button>
                )}
                <PdfImportButton onText={ingest} />
            </div>

            <div className="text-sm text-gray-600">
                {unsavedRows.length === 0
                    ? 'אין שורות מוכנות להוספה'
                    : `${saveableRows.length} שורות מוכנות להוספה${duplicateCount > 0 ? ` (+${duplicateCount} כפולות)` : ''}`}
            </div>

            {unsavedRows.length > 0 && (
                <ul className="flex flex-col gap-2 max-h-[40dvh] overflow-y-auto">
                    {unsavedRows.map((row) => (
                        <li
                            key={row.id}
                            className={`flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg border px-3 py-2 ${row.isDuplicate ? 'border-amber-300 opacity-60' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate flex items-center gap-2">
                                        {row.name}
                                        {row.isDuplicate && (
                                            <button
                                                type="button"
                                                onClick={() => unmarkDuplicate(row.id)}
                                                className="text-[10px] uppercase tracking-wide bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-full px-2 py-0.5 cursor-pointer">
                                                duplicate · save anyway
                                            </button>
                                        )}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(row.date)}
                                        {' · '}
                                        {AccountName[row.account]?.translation || row.account}
                                        {' · '}
                                        <button
                                            type="button"
                                            aria-label="Change category"
                                            aria-expanded={editingCategoryId === row.id}
                                            onClick={() => setEditingCategoryId((prev) => prev === row.id ? null : row.id)}
                                            className="underline decoration-dotted text-blue-600">
                                            {Categories[row.category]
                                                ? `${Categories[row.category].emoji} ${Categories[row.category].name}`
                                                : 'בחר קטגוריה'}
                                        </button>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" dir="ltr">
                                    <CurrencyAmount amount={row.amount} isNegative />
                                    <button
                                        type="button"
                                        aria-label="Remove row"
                                        onClick={() => removeRow(row.id)}
                                        className="border border-gray-300 rounded-md px-2 py-1 text-base">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {editingCategoryId === row.id && (
                                <div className="grid grid-cols-4 gap-1">
                                    {Object.entries(Categories).map(([key, value]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setRowCategory(row.id, key)}
                                            className={`rounded-lg border flex flex-col items-center gap-0.5 py-1 ${row.category === key
                                                ? 'bg-blue-100 border-blue-400'
                                                : 'border-gray-200'}`}>
                                            <span className="text-lg leading-none">{value.emoji}</span>
                                            <span className="text-[10px] leading-tight text-center line-clamp-1">{value.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                disabled={saveableRows.length === 0 || submitting}
                onClick={handleSave}
                className="bg-blue-500 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl text-base font-semibold">
                {submitting
                    ? 'Saving…'
                    : `Save rows to database (${saveableRows.length})`}
            </button>
        </div>
    );
}
