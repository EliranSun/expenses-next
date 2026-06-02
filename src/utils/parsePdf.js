'use client';

// Turns a Bank Hapoalim "ניהול תקציב" (budget) PDF export into the same
// tab-separated text the paste flow produces: `name\tdate\taccount\taction\tamount`
// per line. The downstream pipeline (parseTextToRows / parseAndPrepareRows) then
// validates, converts dates, dedupes and saves — identical to a paste.
//
// The module is split into a pure layer (group + classify, unit-tested) and a thin
// pdfjs IO layer. It is `'use client'` and must only be imported lazily from client
// components — pdfjs touches the DOM/worker and `import.meta.url`.

const DATE_RE = /^\d{2}\/\d{2}\/\d{2}$/;
const ACCOUNT_RE = /^\d{4}$/;
const AMOUNT_RE = /^\d+\.\d{1,2}$/;
// Action verbs shown in the "מה תרצה לעשות" column — dropped, never part of the name.
const ACTION_WORDS = new Set(['נטרל']);

// Strip the ₪ sign, thousands separators and whitespace, then keep it only if what
// remains looks like a decimal amount (a dot is required, so 4-digit account codes
// like "8580" are never mistaken for an amount).
const cleanAmount = (str) => {
    const cleaned = str.replace(/₪/g, '').replace(/,/g, '').replace(/\s/g, '');
    return AMOUNT_RE.test(cleaned) ? cleaned : null;
};

// Join the leftover name tokens into a readable label. Sorting by x keeps Latin
// merchant names (e.g. "COFFEE BOY") left-to-right; Hebrew is stored as a label only.
const joinName = (nameTokens) =>
    nameTokens
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((t) => t.str.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

// Bucket pdfjs text items ({ str, transform: [a,b,c,d,x,y] }) into visual rows by
// their y position (transform[5]) within a tolerance, returning rows of { str, x }
// sorted left-to-right. Operates on a single page (y coordinates reset per page).
export const groupItemsIntoRows = (items, yTolerance = 2) => {
    const clean = items
        .map((it) => ({ str: (it.str || '').trim(), x: it.transform[4], y: it.transform[5] }))
        .filter((it) => it.str.length > 0)
        // Top-to-bottom: PDF y grows upward, so descending y is first.
        .sort((a, b) => b.y - a.y);

    const rows = [];
    let current = null;
    for (const it of clean) {
        if (current && Math.abs(it.y - current.y) <= yTolerance) {
            current.items.push(it);
        } else {
            current = { y: it.y, items: [it] };
            rows.push(current);
        }
    }
    return rows.map((r) => r.items.sort((a, b) => a.x - b.x).map(({ str, x }) => ({ str, x })));
};

// Classify a single row's tokens by regex/word-set — never by column position, since
// the table is RTL and column order is unreliable.
const classifyRow = (tokens) => {
    let date = null;
    let amount = null;
    let account = null;
    const nameTokens = [];

    for (const t of tokens) {
        const s = t.str.trim();
        if (!s || s === '₪') continue;
        if (!date && DATE_RE.test(s)) { date = s; continue; }
        const amt = cleanAmount(s);
        if (!amount && amt) { amount = amt; continue; }
        if (!account && ACCOUNT_RE.test(s)) { account = s; continue; }
        if (ACTION_WORDS.has(s)) continue;
        nameTokens.push(t);
    }

    return { date, amount, account, nameTokens };
};

// Convenience: classify a row and emit its TSV line, or null when it isn't an
// expense row (no valid date + amount). Used directly in unit tests.
export const rowItemsToTsvLine = (tokens) => {
    const { date, amount, account, nameTokens } = classifyRow(tokens);
    if (!date || !amount) return null;
    return [joinName(nameTokens), date, account || '', '', amount].join('\t');
};

// Turn one page's items into TSV lines. The date+amount gate drops section headers,
// `סה"כ …` summary rows, column-header rows and page footers automatically. A
// conservative post-pass rescues merchant names that wrapped onto the line above.
export const pageItemsToLines = (items) => {
    const parsed = groupItemsIntoRows(items).map(classifyRow);
    const lines = [];

    parsed.forEach((p, i) => {
        if (!p.date || !p.amount) return;
        let name = joinName(p.nameTokens);
        if (name.length < 2) {
            const prev = parsed[i - 1];
            if (prev && !prev.date && !prev.amount && !prev.account && prev.nameTokens.length) {
                name = joinName(prev.nameTokens);
            }
        }
        lines.push([name, p.date, p.account || '', '', p.amount].join('\t'));
    });

    return lines;
};

// Pure entry point: array of pages (each an array of pdfjs items) → TSV string.
export const textItemsToTsv = (pages) => pages.flatMap(pageItemsToLines).join('\n');

// IO entry point: a File → TSV string. pdfjs is imported lazily so its ~1MB bundle
// stays out of the /add route's initial payload.
export async function parsePdfFileToTsv(file) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;

    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map((it) => ({ str: it.str, transform: it.transform })));
    }

    return textItemsToTsv(pages);
}
