// Browser-only: reads a PDF File into positioned text items per page.
// Legacy build: the modern one relies on very new JS (e.g. Math.sumPrecise).
export async function extractPdfPages(file) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({
        data,
        // Hebrew fonts in bank prints need CMaps, otherwise glyphs get dropped.
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
    }).promise;

    try {
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            pages.push({
                items: content.items
                    .filter((item) => typeof item.str === 'string' && item.str.trim())
                    .map((item) => ({
                        str: item.str.trim(),
                        x: item.transform[4],
                        y: item.transform[5],
                    })),
            });
        }
        return pages;
    } finally {
        void doc.destroy();
    }
}
