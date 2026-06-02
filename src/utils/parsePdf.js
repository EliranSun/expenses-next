'use server';

import { textItemsToTsv } from './parsePdfRows';

// Server action: extract a Bank Hapoalim "ניהול תקציב" (budget) PDF into the same
// tab-separated text the paste flow produces. Runs pdfjs in Node, which avoids the
// browser worker-bundling and older-Safari/iOS compatibility issues of client-side
// parsing. No API key or external service — just the existing Next.js backend.
export async function parsePdfToTsv(formData) {
    const file = formData?.get?.('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
        return { ok: false, error: 'no file provided' };
    }

    try {
        const data = new Uint8Array(await file.arrayBuffer());
        // Lazy + legacy build: transpiled/polyfilled and Node-friendly.
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const doc = await pdfjs.getDocument({
            data,
            useSystemFonts: true,
            isEvalSupported: false,
        }).promise;

        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            pages.push(
                content.items
                    .filter((it) => typeof it.str === 'string' && Array.isArray(it.transform))
                    .map((it) => ({ str: it.str, transform: it.transform })),
            );
        }
        await doc.cleanup?.();

        return { ok: true, tsv: textItemsToTsv(pages) };
    } catch (error) {
        console.error('parsePdfToTsv failed:', error);
        return { ok: false, error: error?.message ?? 'pdf parse failed' };
    }
}
