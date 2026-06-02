'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// Reusable PDF upload control. Parses the file to TSV client-side (pdfjs is loaded
// lazily) and hands the text to `onText`, which routes it through the same ingest
// path as a paste. Presentation-agnostic so desktop and mobile both reuse it.
export function PdfUploadButton({ onText, className = '' }) {
    const [loading, setLoading] = useState(false);

    const handleChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const { parsePdfFileToTsv } = await import('@/utils/parsePdf');
            const tsv = await parsePdfFileToTsv(file);
            if (!tsv.trim()) {
                toast.error('No expenses found in PDF');
                return;
            }
            await onText(tsv);
        } catch (err) {
            console.error('PDF parsing failed:', err);
            toast.error('Failed to read PDF');
        } finally {
            setLoading(false);
            // Reset so selecting the same file again re-fires onChange.
            event.target.value = '';
        }
    };

    return (
        <label
            className={`bg-gray-200 text-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer ${loading ? 'opacity-60 pointer-events-none' : ''} ${className}`}>
            {loading ? 'Parsing PDF…' : '📄 Upload PDF'}
            <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={loading}
                onChange={handleChange}
            />
        </label>
    );
}
