import { nameKey, buildCategoryIndex, suggestCategory, applyCategorySuggestions } from './categorySuggestions';
import { enrichRows } from './parseAndPrepareRows';

describe('nameKey', () => {
    it('ignores case, punctuation, spacing and word order', () => {
        expect(nameKey('HAEGEL MAADANEY')).toBe(nameKey('maadaney  haegel'));
        expect(nameKey('ואני בבית הצנחן בע"מ')).toBe(nameKey('ואני בבית הצנחן בע " מ'));
        expect(nameKey('APPLE.COM/BILL')).toBe('apple bill com');
    });
});

describe('suggestCategory', () => {
    const index = buildCategoryIndex([
        { name: 'APPLE.COM/BILL', category: 'subscriptions', count: 12, lastDate: '2026-08-01' },
        { name: 'APPLE.COM/BILL', category: 'tech', count: 1, lastDate: '2025-02-01' },
        { name: 'BIT', category: 'gifts', count: 2, lastDate: '2026-01-01' },
        { name: 'BIT', category: 'restaurants', count: 2, lastDate: '2026-02-01' },
        { name: 'OLD', category: 'not-a-category', count: 5, lastDate: '2026-02-01' },
    ]);

    it('returns the majority category', () => {
        expect(suggestCategory('APPLE.COM/BILL', index)).toBe('subscriptions');
    });

    it('returns null without a clear majority', () => {
        expect(suggestCategory('BIT', index)).toBeNull();
    });

    it('returns null for unknown names and unknown category keys', () => {
        expect(suggestCategory('NEW SHOP', index)).toBeNull();
        expect(suggestCategory('OLD', index)).toBeNull();
    });
});

describe('applyCategorySuggestions', () => {
    const history = [{ name: 'APPLE.COM/BILL', category: 'subscriptions', count: 3, lastDate: '2026-08-01' }];

    it('fills uncategorized rows and flags them', () => {
        const [row] = applyCategorySuggestions([{ id: 'a', name: 'APPLE.COM/BILL' }], history);
        expect(row).toMatchObject({ category: 'subscriptions', autoCategory: true });
    });

    it('keeps an existing category', () => {
        const [row] = applyCategorySuggestions([{ id: 'a', name: 'APPLE.COM/BILL', category: 'tech' }], history);
        expect(row.category).toBe('tech');
        expect(row.autoCategory).toBeUndefined();
    });
});

describe('enrichRows', () => {
    const rows = [{ id: 'a', name: 'APPLE.COM/BILL', amount: 39.9, date: '2026-09-20', account: '1039' }];

    beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => { }));
    afterEach(() => jest.restoreAllMocks());

    it('marks duplicates and suggests categories', async () => {
        const [row] = await enrichRows(rows, {
            fetchExpensesByDateRange: async () => [{ ...rows[0], id: 'db' }],
            fetchCategoryHistory: async () => [{ name: 'APPLE.COM/BILL', category: 'subscriptions', count: 1 }],
        });
        expect(row).toMatchObject({ isDuplicate: true, category: 'subscriptions' });
    });

    it('still returns rows when lookups fail', async () => {
        const result = await enrichRows(rows, {
            fetchExpensesByDateRange: async () => { throw new Error('db down'); },
            fetchCategoryHistory: async () => { throw new Error('db down'); },
        });
        expect(result).toEqual(rows);
    });
});
