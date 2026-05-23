'use client';

import { useRef, useState } from 'react';
import { parseAndPrepareRows } from './parseAndPrepareRows';
import { CurrencyAmount } from '@/components/atoms/currency-amount';
import { formatDate } from '@/utils/formatDate';
import { AccountName } from '@/constants/account';

export function MobilePasteScreen({ existingExpenses = [], onSubmit }) {
    const [unsavedRows, setUnsavedRows] = useState([]);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const ingest = (raw) => {
        if (!raw || !raw.trim()) return;
        const prepared = parseAndPrepareRows(raw, existingExpenses, unsavedRows);
        if (prepared.length === 0) {
            return;
        }
        setUnsavedRows((prev) => [...prev, ...prepared]);
        setText('');
    };

    const handlePaste = (event) => {
        const raw = event.clipboardData?.getData('Text') ?? '';
        if (!raw.trim()) return;
        event.preventDefault();
        ingest(raw);
    };

    const handleParseClick = () => {
        ingest(text);
        textareaRef.current?.focus();
    };

    const removeRow = (id) => {
        setUnsavedRows((prev) => prev.filter((r) => r.id !== id));
    };

    const handleSave = async () => {
        if (unsavedRows.length === 0 || submitting) return;
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
                    Tab-separated: name &nbsp;|&nbsp; date &nbsp;|&nbsp; account &nbsp;|&nbsp; action &nbsp;|&nbsp; amount
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
                className="border border-gray-300 rounded-xl p-3 w-full font-mono text-sm bg-white"
            />

            {text.trim() && (
                <button
                    type="button"
                    onClick={handleParseClick}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl self-start">
                    Parse text
                </button>
            )}

            <div className="text-sm text-gray-600">
                {unsavedRows.length === 0
                    ? 'אין שורות מוכנות להוספה'
                    : `${unsavedRows.length} שורות מוכנות להוספה`}
            </div>

            {unsavedRows.length > 0 && (
                <ul className="flex flex-col gap-2 max-h-[40dvh] overflow-y-auto">
                    {unsavedRows.map((row) => (
                        <li
                            key={row.id}
                            className="flex items-center justify-between gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{row.name}</span>
                                <span className="text-xs text-gray-500">
                                    {formatDate(row.date)}
                                    {' · '}
                                    {AccountName[row.account]?.translation || row.account}
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
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                disabled={unsavedRows.length === 0 || submitting}
                onClick={handleSave}
                className="bg-blue-500 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl text-base font-semibold">
                {submitting
                    ? 'Saving…'
                    : `Save rows to database (${unsavedRows.length})`}
            </button>
        </div>
    );
}
