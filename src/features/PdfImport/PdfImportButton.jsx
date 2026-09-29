'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseHapoalimPages, rowsToTsv } from './parseHapoalimPdf';

export function PdfImportButton({ onText, className = '' }) {
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleChange = async (event) => {
        const files = [...(event.target.files ?? [])];
        event.target.value = '';
        if (files.length === 0) return;

        setLoading(true);
        try {
            const { extractPdfPages } = await import('./extractPdfPages');
            const rows = [];
            for (const file of files) {
                rows.push(...parseHapoalimPages(await extractPdfPages(file)));
            }

            if (rows.length === 0) {
                toast.error('No transactions found. Expand all categories (לפתוח הכל) before printing.');
                return;
            }

            await onText(rowsToTsv(rows), { source: 'pdf' });
            toast.success(`Parsed ${rows.length} rows from PDF`);
        } catch (err) {
            console.error('PDF import failed:', err);
            toast.error('Could not read PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                data-testid="pdf-import-input"
                onChange={handleChange}
            />
            <button
                type="button"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
                className={`bg-gray-200 disabled:opacity-60 text-gray-800 px-4 py-2 rounded-xl ${className}`}>
                {loading ? 'Reading PDF…' : 'Import PDF'}
            </button>
        </>
    );
}
