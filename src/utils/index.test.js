import {
    isMeaningfulField,
    isValidParsedRow,
    isValidInsertRow,
    parseTextToRows,
} from './index';

describe('isMeaningfulField', () => {
    it.each([
        ['hello', true],
        ['  hello  ', true],
        ['', false],
        ['   ', false],
        ['null', false],
        ['NULL', false],
        [' Null ', false],
        ['undefined', false],
        ['NaN', false],
        [null, false],
        [undefined, false],
        [0, false],
        [{}, false],
    ])('isMeaningfulField(%p) === %p', (input, expected) => {
        expect(isMeaningfulField(input)).toBe(expected);
    });
});

describe('isValidParsedRow', () => {
    const baseRow = {
        name: 'APPLE.COM/BILL',
        date: '28/01/25',
        account: '3361',
        amount: 69.9,
    };

    it('accepts a well-formed row', () => {
        expect(isValidParsedRow(baseRow)).toBe(true);
    });

    it.each([
        { ...baseRow, name: 'null' },
        { ...baseRow, name: '' },
        { ...baseRow, account: 'undefined' },
        { ...baseRow, date: '2025-01-28' },
        { ...baseRow, date: '28-01-25' },
        { ...baseRow, date: undefined },
        { ...baseRow, amount: 0 },
        { ...baseRow, amount: NaN },
        { ...baseRow, amount: null },
        { ...baseRow, amount: '69.9' },
    ])('rejects malformed row %p', (row) => {
        expect(isValidParsedRow(row)).toBe(false);
    });
});

describe('isValidInsertRow', () => {
    const baseRow = {
        id: 'i1',
        name: 'a',
        amount: 1,
        date: '2025-01-01',
        account: '3361',
        category: 'food',
    };

    it('accepts a well-formed row', () => {
        expect(isValidInsertRow(baseRow)).toBe(true);
    });

    it.each([
        { ...baseRow, name: 'null' },
        { ...baseRow, name: '  ' },
        { ...baseRow, account: '' },
        { ...baseRow, account: 'undefined' },
        { ...baseRow, id: '' },
        { ...baseRow, date: '28/01/25' },
        { ...baseRow, date: '2025-1-1' },
        { ...baseRow, amount: 0 },
        { ...baseRow, amount: NaN },
        { ...baseRow, amount: '1' },
    ])('rejects malformed row %p', (row) => {
        expect(isValidInsertRow(row)).toBe(false);
    });
});

describe('parseTextToRows', () => {
    it('drops rows whose name is literally "null"', () => {
        const text = [
            'APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪',
            'null\t28/01/25\t3361\tfoo\t10.00 ₪',
        ].join('\n');

        const parsed = parseTextToRows(text);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('APPLE.COM/BILL');
    });

    it('drops rows with a missing/malformed date', () => {
        const text = [
            'APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪',
            'BAD ROW\t2025-01-28\t3361\tfoo\t10.00 ₪',
            'NO DATE\t\t3361\tfoo\t10.00 ₪',
        ].join('\n');

        const parsed = parseTextToRows(text);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('APPLE.COM/BILL');
    });

    it('drops rows with a missing account', () => {
        const text = [
            'APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪',
            'NO ACCT\t28/01/25\t\tfoo\t10.00 ₪',
            'NULL ACCT\t28/01/25\tnull\tfoo\t10.00 ₪',
        ].join('\n');

        const parsed = parseTextToRows(text);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('APPLE.COM/BILL');
    });
});
