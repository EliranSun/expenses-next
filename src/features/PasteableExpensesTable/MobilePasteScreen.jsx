'use client';

import { useState } from 'react';
import { PdfImportButton } from '@/features/PdfImport/PdfImportButton';
import { ManualExpenseButton } from '@/features/ManualExpense/ManualExpenseButton';

// Step 1 on mobile: get rows in. Reviewing, editing and saving happen on the
// card stack afterwards.
export function MobilePasteScreen({ onText, onRows, draftCount = 0, onReview }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);

    const ingest = async (raw, options) => {
        if (!raw || !raw.trim() || busy) return;
        setBusy(true);
        try {
            const added = await onText(raw, options);
            if (added > 0) setText('');
        } finally {
            setBusy(false);
        }
    };

    const handlePaste = (event) => {
        const raw = event.clipboardData?.getData('Text') ?? '';
        if (!raw.trim()) return;
        event.preventDefault();
        setText(raw);
        void ingest(raw);
    };

    return (
        <div dir="rtl" className="flex flex-col gap-4 w-full">
            <div>
                <h2 className="text-xl font-bold">הוספת הוצאות</h2>
                <p className="text-sm text-gray-500">
                    הדבק שורות מהבנק, ייבא PDF או הוסף ידנית. אפשר לערוך הכל לפני השמירה.
                </p>
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handlePaste}
                rows={6}
                dir="ltr"
                placeholder="Paste rows here…"
                className="border border-gray-300 rounded-xl p-3 w-full font-mono text-base bg-white dark:bg-gray-800"
            />

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={!text.trim() || busy}
                    onClick={() => void ingest(text)}
                    className="bg-blue-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl">
                    {busy ? 'Reading…' : 'Parse text'}
                </button>
                <PdfImportButton onText={onText} />
                <ManualExpenseButton onRows={onRows} />
            </div>

            {draftCount > 0 && (
                <button
                    type="button"
                    onClick={onReview}
                    className="border border-blue-500 text-blue-600 px-4 py-3 rounded-xl font-semibold">
                    {`Review ${draftCount} unsaved rows`}
                </button>
            )}
        </div>
    );
}
