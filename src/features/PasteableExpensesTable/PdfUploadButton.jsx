'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// Reusable PDF upload control. Sends the file to the `parsePdf` server action, which
// extracts it to TSV in Node, then hands the text to `onText` — routing it through the
// same ingest path as a paste. Presentation-agnostic so desktop and mobile both reuse it.
export function PdfUploadButton({ parsePdf, onText, className = '' }) {
    const [loading, setLoading] = useState(false);

    const handleChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await parsePdf(formData);
            if (!res?.ok) {
                toast.error(`Failed to read PDF: ${res?.error || 'unknown error'}`);
                return;
            }
            const tsv = res.tsv ?? '';
            if (!tsv.trim()) {
                toast.error('No expenses found in PDF');
                return;
            }
            await onText(tsv);
        } catch (err) {
            const message = err?.message || String(err);
            console.error('PDF parsing failed:', message, err);
            toast.error(`Failed to read PDF: ${message}`);
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
