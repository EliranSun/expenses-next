import {
    groupItemsIntoRows,
    rowItemsToTsvLine,
    pageItemsToLines,
    textItemsToTsv,
} from '@/utils/parsePdf';
import { parseTextToRows } from '@/utils';

// pdfjs text item shape: { str, transform: [a, b, c, d, x, y] }
const item = (str, x, y) => ({ str, transform: [1, 0, 0, 1, x, y] });
// row token shape consumed by rowItemsToTsvLine: { str, x }
const tok = (str, x) => ({ str, x });

describe('rowItemsToTsvLine', () => {
    it('classifies a valid expense row regardless of token order', () => {
        // Tokens given in RTL/scrambled order — classification is by regex, not position.
        const tokens = [
            tok('58.00', 10),
            tok('נטרל', 30),
            tok('8580', 50),
            tok('22/05/26', 70),
            tok('COFFEEBOY', 90),
        ];
        expect(rowItemsToTsvLine(tokens)).toBe('COFFEEBOY\t22/05/26\t8580\t\t58.00');
    });

    it('strips the ₪ sign and joins multi-token Latin names', () => {
        const tokens = [
            tok('COFFEE', 90),
            tok('BOY', 95),
            tok('22/05/26', 70),
            tok('8580', 50),
            tok('58.00 ₪', 10),
        ];
        expect(rowItemsToTsvLine(tokens)).toBe('COFFEE BOY\t22/05/26\t8580\t\t58.00');
    });

    it('returns null for a סה"כ summary row (amount + %, no date)', () => {
        const tokens = [tok('סה"כ נופש', 90), tok('50.00', 50), tok('0.2%', 10)];
        expect(rowItemsToTsvLine(tokens)).toBeNull();
    });

    it('returns null for a category-header-only row', () => {
        expect(rowItemsToTsvLine([tok('נופש', 90)])).toBeNull();
    });

    it('returns null for a page footer row', () => {
        const tokens = [
            tok('https://login.bankhapoalim.co.il/ng-portals/rb/he/pfm', 10),
            tok('02/06/2026, 8:39', 70),
            tok('Page 1 of 10', 90),
        ];
        // 02/06/2026 has a 4-digit year, so it is not a DD/MM/YY date.
        expect(rowItemsToTsvLine(tokens)).toBeNull();
    });

    it('parses thousands separators in the amount', () => {
        const tokens = [tok('SOME SHOP', 90), tok('17/05/26', 70), tok('9325', 50), tok('1,234.50', 10)];
        expect(rowItemsToTsvLine(tokens)).toBe('SOME SHOP\t17/05/26\t9325\t\t1234.50');
    });
});

describe('groupItemsIntoRows', () => {
    it('buckets items at near-equal y into one row and splits distinct y', () => {
        const items = [
            item('A', 10, 700),
            item('B', 50, 701), // within tolerance of A
            item('C', 10, 680), // separate line
        ];
        const rows = groupItemsIntoRows(items);
        expect(rows).toHaveLength(2);
        expect(rows[0].map((t) => t.str)).toEqual(['A', 'B']); // sorted by x
        expect(rows[1].map((t) => t.str)).toEqual(['C']);
    });
});

describe('pageItemsToLines', () => {
    it('emits only expense rows from a mixed page', () => {
        const items = [
            item('נופש', 90, 720), // section header — dropped
            item('ADOBE', 90, 700), item('05/05/26', 70, 700), item('1039', 50, 700), item('50.00', 10, 700),
            item('סה"כ נופש', 90, 680), item('50.00', 50, 680), item('0.2%', 10, 680), // summary — dropped
        ];
        expect(pageItemsToLines(items)).toEqual(['ADOBE\t05/05/26\t1039\t\t50.00']);
    });

    it('rescues a merchant name that wrapped onto the line above', () => {
        const items = [
            // name-only line directly above (clear y gap so it is its own row)
            item('רמי לוי', 90, 712),
            // expense line with no name tokens of its own
            item('17/05/26', 70, 700), item('9325', 50, 700), item('נטרל', 30, 700), item('328.80', 10, 700),
        ];
        expect(pageItemsToLines(items)).toEqual(['רמי לוי\t17/05/26\t9325\t\t328.80']);
    });
});

describe('textItemsToTsv → parseTextToRows round-trip', () => {
    it('produces rows the existing paste parser accepts', () => {
        const page = [
            item('ADOBE', 90, 700), item('05/05/26', 70, 700), item('1039', 50, 700), item('50.00', 10, 700),
            item('WOLT', 90, 680), item('12/05/26', 70, 680), item('9325', 50, 680), item('115.95', 10, 680),
        ];
        const tsv = textItemsToTsv([page]);
        const rows = parseTextToRows(tsv);
        expect(rows).toHaveLength(2);
        const adobe = rows.find((r) => r.name === 'ADOBE');
        expect(adobe).toMatchObject({ name: 'ADOBE', date: '05/05/26', account: '1039', amount: 50 });
        const wolt = rows.find((r) => r.name === 'WOLT');
        expect(wolt).toMatchObject({ name: 'WOLT', date: '12/05/26', account: '9325', amount: 115.95 });
    });
});
