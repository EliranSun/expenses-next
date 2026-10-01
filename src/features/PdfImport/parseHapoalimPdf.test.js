import { parseHapoalimPages, rowsToTsv } from './parseHapoalimPdf';
import { parseTextToRows } from '@/utils';
import { markDuplicates } from '@/features/PasteableExpensesTable/parseAndPrepareRows';

// DB rows carry their import fingerprint; these fixtures were never edited.
const withSource = (expense) => ({
    ...expense,
    source: { name: expense.name, amount: expense.amount, date: expense.date, account: expense.account },
});

// Positional fixtures mimic pdfjs text items: x grows left-to-right, y grows
// bottom-to-top. Hebrew words in a line are separate items ordered by x.
const item = (str, x, y) => ({ str, x, y });

const header = [
    item('מספר', 508, 757), item('חשבון', 480, 757), item('12-170-489748', 404, 757),
    item('45,421', 422, 625), item('₪', 409, 625),
    item('נופש', 435, 336),
    item('על', 481, 299), item('מה', 466, 299), item('הוצאתי', 434, 299), item('מתי', 385, 299), item('סכום', 170, 299),
];

const footer = [
    item('29/09/2026, 7', 493, 50),
    item('https://login.bankhapoalim.co.il/ng-portals/rb/he/pfm', 40, 50),
    item('Page 1 of 2', 513, 42),
];

const page1 = {
    items: [
        ...header,
        // Single line, נטרל on the same line.
        item('ALIEXPRESS', 416, 265), item('26/09/26', 353, 265), item('1039', 310, 265),
        item('נטרל', 206, 265), item('76.86', 159, 265), item('₪', 146, 265),
        // Name on one line, נטרל on its own line below, thousands separator.
        item('יאמאס', 461, 204), item('יו', 452, 204), item('10/07/26', 353, 204), item('9325', 310, 204),
        item('1,342.50', 142, 204), item('₪', 129, 204),
        item('נטרל', 206, 197),
        // Category total.
        item('סה', 477, 169), item('"', 472, 169), item('כ', 466, 169), item('נופש', 438, 169),
        item('1,419.36', 142, 169), item('₪', 129, 169), item('3.27%', 78, 169),
        // Name wrapped above and below the date line.
        item('GANA YEODH', 430, 131), item('05/09/26', 353, 123), item('8580', 310, 123),
        item('88.00', 159, 123), item('₪', 146, 123), item('BAR*GMF', 430, 116), item('נטרל', 206, 117),
        ...footer,
    ],
};

const page2 = {
    // Columns shifted left compared to page 1.
    items: [
        item('ואני', 475, 657), item('בבית', 448, 657), item('הצנחן', 416, 657), item('בע', 400, 657),
        item('"', 396, 657), item('מ', 388, 657), item('18/09/26', 323, 657), item('170-489748', 261, 657),
        item('109.00', 142, 657), item('₪', 129, 657),
        // Refund with a trailing minus.
        item('דמי', 476, 281), item('כרטיס', 443, 281), item('24/09/26', 323, 281), item('9325', 280, 281),
        item('19.25-', 162, 281), item('₪', 149, 281),
        // Refund with a separate minus token.
        item('החזר', 470, 240), item('24/09/26', 323, 240), item('9325', 280, 240),
        item('-', 193, 240), item('5.00', 162, 240), item('₪', 149, 240),
        // Stray fragment of a row cut by the page edge.
        item('מפעלי', 463, 89), item('בית', 442, 89),
        item('29/09/2026, 7', 493, 50),
    ],
};

describe('parseHapoalimPages', () => {
    const rows = parseHapoalimPages([page1, page2]);

    it('extracts one row per transaction and ignores headers, totals and footers', () => {
        expect(rows.map((r) => r.name)).toEqual([
            'ALIEXPRESS',
            'יאמאס יו',
            'GANA YEODH BAR*GMF',
            'ואני בבית הצנחן בע"מ',
            'דמי כרטיס',
            'החזר',
        ]);
    });

    it('reads date, account and amount', () => {
        expect(rows[0]).toEqual({ name: 'ALIEXPRESS', date: '26/09/26', account: '1039', action: '', amount: 76.86 });
        expect(rows[1]).toMatchObject({ date: '10/07/26', account: '9325', amount: 1342.5 });
        expect(rows[3]).toMatchObject({ date: '18/09/26', account: '170-489748', amount: 109 });
    });

    it('parses refunds as negative amounts', () => {
        expect(rows[4].amount).toBe(-19.25);
        expect(rows[5].amount).toBe(-5);
    });

    it('returns nothing for pages without transactions', () => {
        expect(parseHapoalimPages([{ items: [...header, ...footer] }])).toEqual([]);
        expect(parseHapoalimPages([])).toEqual([]);
    });
});

describe('name punctuation', () => {
    // Items with widths, as extractPdfPages returns them. "-" touching both
    // words is part of the name; the free-standing one keeps its spaces.
    const sized = (str, x, y, width) => ({ str, x, y, width, height: 10 });
    const row = (...nameItems) => ({
        items: [
            ...nameItems,
            item('01/09/26', 353, 265), item('9325', 310, 265), item('150.00', 159, 265), item('₪', 146, 265),
        ],
    });

    it('does not add spaces around punctuation printed as separate items', () => {
        const [parsed] = parseHapoalimPages([row(
            sized('הוראת', 470, 265, 25), sized('-', 466, 265, 4), sized('קבע', 450, 265, 16),
            sized('-', 443, 265, 4), sized('פרטי', 420, 265, 20),
        )]);
        expect(parsed.name).toBe('הוראת-קבע - פרטי');
    });

    it('falls back to spaces when widths are missing', () => {
        const [parsed] = parseHapoalimPages([row(item('הוראת', 470, 265), item('-', 466, 265), item('קבע', 450, 265))]);
        expect(parsed.name).toBe('הוראת - קבע');
    });
});

describe('rowsToTsv', () => {
    it('round-trips through the paste parser', () => {
        const rows = parseHapoalimPages([page1, page2]);
        const parsed = parseTextToRows(rowsToTsv(rows));
        expect(parsed).toHaveLength(rows.length);
        expect(parsed).toEqual(expect.arrayContaining(
            rows.map(({ name, date, account, amount }) => expect.objectContaining({ name, date, account, amount }))
        ));
    });
});

describe('markDuplicates matchName option', () => {
    const row = { id: 'a', name: 'ודניאל וטרנריה בע \'\' מ', date: '2026-09-20', account: '8580', amount: 139 };
    const existing = [withSource({ name: 'וטרינריה דניאל בע"מ', date: '2026-09-20', account: '8580', amount: 139 })];

    it('requires a name match by default', () => {
        expect(markDuplicates([row], existing)[0].isDuplicate).toBeUndefined();
    });

    it('matches names that differ only in spacing around punctuation', () => {
        const pasted = { ...row, name: 'הוראת-קבע - פרטי' };
        const saved = [withSource({ ...existing[0], name: 'הוראת - קבע - פרטי' })];
        expect(markDuplicates([pasted], saved)[0].isDuplicate).toBe(true);
    });

    it('ignores the name when matchName is false', () => {
        expect(markDuplicates([row], existing, { matchName: false })[0].isDuplicate).toBe(true);
    });
});
