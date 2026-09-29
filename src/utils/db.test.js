import { neon } from '@neondatabase/serverless';
import { Accounts, PrivateAccounts } from '@/constants/account';
import {
    fetchCategoryHistory,
    fetchCategoryMonthlyTotals,
    fetchExpenses,
    findSuspiciousExpenses,
    findDuplicateGroups,
    dismissDuplicateGroup,
    getUnhandledExpenses,
    deleteExpense,
    deleteExpenses,
    insertExpenses,
    updateCategory,
    updateNote,
    updateDate,
    updateExpense,
    updateExpenses,
} from './db';

jest.mock('@neondatabase/serverless', () => ({
    neon: jest.fn(),
}));

const sqlMock = jest.fn();
sqlMock.transaction = jest.fn();

beforeEach(() => {
    sqlMock.mockReset();
    sqlMock.transaction.mockReset();
    sqlMock.transaction.mockResolvedValue(undefined);
    neon.mockReset();
    neon.mockReturnValue(sqlMock);
});

const dbRow = (overrides = {}) => ({
    name: 'foo',
    amount: 10,
    date: '2025-01-01',
    account: '3361',
    category: 'food',
    id: '1',
    note: null,
    ...overrides,
});

describe('fetchExpenses', () => {
    it('maps ISO DATE column to date/month/year/timestamp', async () => {
        sqlMock.mockResolvedValueOnce([dbRow({ date: '2025-01-28' })]);

        const [result] = await fetchExpenses();

        expect(result).toMatchObject({
            date: '2025-01-28',
            month: 1,
            year: 25,
            timestamp: new Date(2025, 0, 28).getTime(),
        });
    });

    it('accepts Date objects from the driver too', async () => {
        sqlMock.mockResolvedValueOnce([dbRow({ date: new Date(Date.UTC(2025, 0, 28)) })]);

        const [result] = await fetchExpenses();

        expect(result.date).toBe('2025-01-28');
    });

    it('filters year+month in SQL with date >= start AND date < end', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchExpenses({ year: 25, month: 1 });

        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/CASE .* END >= \$\d+::date AND CASE .* END < \$\d+::date/);
        expect(params).toContain('2025-01-01');
        expect(params).toContain('2025-02-01');
    });

    it('rolls month=12 over to next year in SQL bounds', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchExpenses({ year: 25, month: 12 });

        const [, params] = sqlMock.mock.calls[0];
        expect(params).toContain('2025-12-01');
        expect(params).toContain('2026-01-01');
    });

    it('filters by year only with full-year bounds', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchExpenses({ year: 24 });

        const [, params] = sqlMock.mock.calls[0];
        expect(params).toContain('2024-01-01');
        expect(params).toContain('2025-01-01');
    });

    it('applies a LIMIT to the query', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchExpenses();

        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/LIMIT \$\d+/);
        expect(params[params.length - 1]).toBe(1000);
    });

    it('honours a custom LIMIT', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchExpenses({ limit: 10 });

        const [, params] = sqlMock.mock.calls[0];
        expect(params[params.length - 1]).toBe(10);
    });

    describe('account guard', () => {
        it('returns [] and does not query when account maps to an empty list', async () => {
            const result = await fetchExpenses({ account: 'wife' });

            expect(result).toEqual([]);
            expect(sqlMock).not.toHaveBeenCalled();
        });

        it('returns [] for an unknown account key', async () => {
            const result = await fetchExpenses({ account: 'nope' });

            expect(result).toEqual([]);
            expect(sqlMock).not.toHaveBeenCalled();
        });

        it('builds parameterised IN clause for a known account', async () => {
            sqlMock.mockResolvedValueOnce([]);

            await fetchExpenses({ account: 'private' });

            const [query, params] = sqlMock.mock.calls[0];
            const expectedPlaceholders = PrivateAccounts
                .map((_, i) => `$${i + 1}`)
                .join(', ');
            expect(query).toContain(`account IN (${expectedPlaceholders})`);
            expect(params.slice(0, PrivateAccounts.length)).toEqual(Accounts.private);
        });
    });
});

describe('fetchCategoryMonthlyTotals', () => {
    it('returns [] without querying when the range is missing', async () => {
        expect(await fetchCategoryMonthlyTotals({ startDate: '2025-01-01' })).toEqual([]);
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('groups by month and category within the date range', async () => {
        sqlMock.mockResolvedValueOnce([{ month: '2025-01', category: 'groceries', total: '120.5', count: 3 }]);

        const result = await fetchCategoryMonthlyTotals({ startDate: '2025-01-01', endDate: '2025-02-01' });

        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/GROUP BY 1, 2/);
        expect(query).toMatch(/WHEN category = 'income' THEN ABS\(amount\)/);
        expect(params).toEqual(['2025-01-01', '2025-02-01']);
        expect(result).toEqual([{ month: '2025-01', category: 'groceries', total: 120.5, count: 3 }]);
    });

    it('filters by accounts when given', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await fetchCategoryMonthlyTotals({ startDate: '2025-01-01', endDate: '2025-02-01', accounts: PrivateAccounts });

        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/account IN \(\$3/);
        expect(params).toEqual(['2025-01-01', '2025-02-01', ...PrivateAccounts]);
    });
});

describe('getUnhandledExpenses', () => {
    it('queries for rows with missing category or date', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await getUnhandledExpenses();

        const [query] = sqlMock.mock.calls[0];
        expect(query).toMatch(/category IS NULL OR date IS NULL/);
    });

    it('maps rows with dates and preserves shape for null-date rows', async () => {
        sqlMock.mockResolvedValueOnce([
            dbRow({ date: '2025-01-28', category: null }),
            dbRow({ id: '2', date: null, category: null }),
        ]);

        const result = await getUnhandledExpenses();

        expect(result[0].date).toBe('2025-01-28');
        expect(result[0].month).toBe(1);
        expect(result[1].date).toBeNull();
        expect(result[1].month).toBeNull();
    });
});

describe('deleteExpenses', () => {
    it('returns { ok: false } on empty input without querying', async () => {
        const res = await deleteExpenses([]);
        expect(res).toEqual({ ok: false, error: 'missing ids' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('issues WHERE id IN ($1,$2,$3) for three ids', async () => {
        sqlMock.mockResolvedValueOnce(undefined);

        const res = await deleteExpenses(['a', 'b', 'c']);

        expect(res).toEqual({ ok: true });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toContain('WHERE id IN ($1, $2, $3)');
        expect(params).toEqual(['a', 'b', 'c']);
    });

    it('returns { ok: false, error } when the driver throws', async () => {
        sqlMock.mockRejectedValueOnce(new Error('boom'));

        const res = await deleteExpenses(['a']);
        expect(res).toEqual({ ok: false, error: 'boom' });
    });
});

describe('deleteExpense', () => {
    it('returns { ok: false } on missing id', async () => {
        const res = await deleteExpense(null);
        expect(res).toEqual({ ok: false, error: 'missing id' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('returns { ok: true } on success', async () => {
        sqlMock.mockResolvedValueOnce(undefined);
        const res = await deleteExpense('x');
        expect(res).toEqual({ ok: true });
    });

    it('returns { ok: false } on driver error', async () => {
        sqlMock.mockRejectedValueOnce(new Error('nope'));
        const res = await deleteExpense('x');
        expect(res.ok).toBe(false);
        expect(res.error).toBe('nope');
    });
});

describe('updateCategory', () => {
    it('rejects missing id', async () => {
        expect(await updateCategory(null, 'food')).toEqual({ ok: false, error: 'missing id' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('rejects missing category', async () => {
        expect(await updateCategory('x', '')).toEqual({ ok: false, error: 'missing category' });
    });

    it('returns { ok: true } and runs the UPDATE', async () => {
        sqlMock.mockResolvedValueOnce(undefined);
        const res = await updateCategory('x', 'food');
        expect(res).toEqual({ ok: true });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/UPDATE expenses SET category = \$1 WHERE id = \$2/);
        expect(params).toEqual(['food', 'x']);
    });
});

describe('updateNote', () => {
    it('rejects missing id', async () => {
        expect(await updateNote(null, 'n')).toEqual({ ok: false, error: 'missing id' });
    });

    it('rejects null note', async () => {
        expect(await updateNote('x', null)).toEqual({ ok: false, error: 'missing note' });
    });

    it('allows empty string note (clearing)', async () => {
        sqlMock.mockResolvedValueOnce(undefined);
        expect(await updateNote('x', '')).toEqual({ ok: true });
    });
});

describe('updateDate', () => {
    it('rejects missing id', async () => {
        expect(await updateDate(null, '2025-01-01')).toEqual({ ok: false, error: 'missing id' });
    });

    it('rejects missing date', async () => {
        expect(await updateDate('x', '')).toEqual({ ok: false, error: 'missing date' });
    });

    it('casts date as $1::date', async () => {
        sqlMock.mockResolvedValueOnce(undefined);
        await updateDate('x', '2025-01-01');
        const [query] = sqlMock.mock.calls[0];
        expect(query).toMatch(/date = \$1::date/);
    });
});

describe('insertExpenses', () => {
    it('rejects empty rows', async () => {
        expect(await insertExpenses([])).toEqual({ ok: false, error: 'no rows to insert' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('inserts as a single multi-row VALUES list and returns { ok: true } with ids', async () => {
        sqlMock.mockResolvedValueOnce([{ id: 'i1' }, { id: 'i2' }]);

        const res = await insertExpenses([
            { name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food', id: 'i1' },
            { name: 'b', amount: 2, date: '2025-01-02', account: '3361', category: 'food', id: 'i2' },
        ]);

        expect(res).toEqual({ ok: true, data: { inserted: 2, skipped: 0, ids: ['i1', 'i2'] } });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/INSERT INTO expenses/);
        expect(query).toMatch(/RETURNING id/);
        expect(query).toMatch(/\$3::date/);
        expect(query).toMatch(/\$9::date/);
        expect(params).toHaveLength(12);
    });

    it('returns { ok: false } on driver error', async () => {
        sqlMock.mockRejectedValueOnce(new Error('dup'));
        const res = await insertExpenses([
            { name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food', id: 'i1' },
        ]);
        expect(res.ok).toBe(false);
        expect(res.error).toBe('dup');
    });

    it('drops invalid rows and only inserts the valid ones', async () => {
        sqlMock.mockResolvedValueOnce([{ id: 'i1' }]);

        const res = await insertExpenses([
            { name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food', id: 'i1' },
            { name: 'null', amount: 2, date: '2025-01-02', account: '3361', category: 'food', id: 'i2' },
            { name: 'b', amount: 0, date: '2025-01-03', account: '3361', category: 'food', id: 'i3' },
            { name: 'c', amount: 3, date: '28/01/25', account: '3361', category: 'food', id: 'i4' },
            { name: 'd', amount: 4, date: '2025-01-04', account: '', category: 'food', id: 'i5' },
        ]);

        expect(res).toEqual({ ok: true, data: { inserted: 1, skipped: 4, ids: ['i1'] } });
        const [, params] = sqlMock.mock.calls[0];
        expect(params).toHaveLength(6);
        expect(params[0]).toBe('a');
    });

    it('returns { ok: false } when every row is invalid', async () => {
        const res = await insertExpenses([
            { name: 'null', amount: 1, date: '2025-01-01', account: '3361', category: 'food', id: 'i1' },
            { name: 'a', amount: 0, date: '2025-01-01', account: '3361', category: 'food', id: 'i2' },
        ]);
        expect(res).toEqual({ ok: false, error: 'no valid rows to insert', data: { skipped: 2 } });
        expect(sqlMock).not.toHaveBeenCalled();
    });
});

describe('findSuspiciousExpenses', () => {
    it('queries for rows with null/blank/sentinel fields and tags issues', async () => {
        sqlMock.mockResolvedValueOnce([
            { ...dbRow({ id: 'a', category: null }) },
            { ...dbRow({ id: 'b', name: 'null' }) },
            { ...dbRow({ id: 'c', account: '   ' }) },
            { ...dbRow({ id: 'd', amount: 0 }) },
            { id: 'e', name: 'x', amount: 5, date: null, account: '3361', category: 'food', note: null },
        ]);

        const rows = await findSuspiciousExpenses();
        const [query, params] = sqlMock.mock.calls[0];

        expect(query).toMatch(/category IS NULL/);
        expect(query).toMatch(/name IS NULL OR TRIM\(name\) = ''/);
        expect(query).toMatch(/account IS NULL OR TRIM\(account\) = ''/);
        expect(query).toMatch(/date IS NULL/);
        expect(query).toMatch(/amount IS NULL OR amount = 0/);
        expect(params).toEqual([500]);

        expect(rows[0].issues).toContain('category');
        expect(rows[1].issues).toContain('name');
        expect(rows[2].issues).toContain('account');
        expect(rows[3].issues).toContain('amount');
        expect(rows[4].issues).toContain('date');
        expect(rows[4].timestamp).toBeNull();
    });
});

describe('updateExpenses', () => {
    it('rejects empty rows', async () => {
        expect(await updateExpenses([])).toEqual({ ok: false, error: 'no rows to update' });
    });

    it('rejects rows without ids', async () => {
        expect(await updateExpenses([{ name: 'a' }])).toEqual({ ok: false, error: 'no rows with ids' });
    });

    it('wraps multiple UPDATEs in a single transaction', async () => {
        sqlMock.mockReturnValue('Q');
        sqlMock.transaction.mockResolvedValueOnce(undefined);

        const res = await updateExpenses([
            { id: 'i1', name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food' },
            { id: 'i2', name: 'b', amount: 2, date: '2025-01-02', account: '3361', category: 'food' },
        ]);

        expect(res).toEqual({ ok: true, data: { updated: 2 } });
        expect(sqlMock.transaction).toHaveBeenCalledTimes(1);
        expect(sqlMock.transaction.mock.calls[0][0]).toHaveLength(2);
    });

    it('returns { ok: false } when the transaction rejects', async () => {
        sqlMock.mockReturnValue('Q');
        sqlMock.transaction.mockRejectedValueOnce(new Error('rolled back'));

        const res = await updateExpenses([
            { id: 'i1', name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food' },
        ]);

        expect(res.ok).toBe(false);
        expect(res.error).toBe('rolled back');
    });
});

describe('fetchCategoryHistory', () => {
    it('groups categorized expenses by name and category', async () => {
        sqlMock.mockResolvedValueOnce([
            { name: 'APPLE.COM/BILL', category: 'subscriptions', count: 3, last_date: '2026-09-01' },
        ]);

        const res = await fetchCategoryHistory();

        expect(res).toEqual([{ name: 'APPLE.COM/BILL', category: 'subscriptions', count: 3, lastDate: '2026-09-01' }]);
        const [query] = sqlMock.mock.calls[0];
        expect(query).toMatch(/category IS NOT NULL/);
        expect(query).toMatch(/GROUP BY name, category/);
    });
});

describe('updateExpense', () => {
    const valid = { id: 'e1', name: ' APPLE ', amount: 39.9, date: '2026-09-20', account: '1039', category: 'subscriptions', note: 'n' };

    it('updates every editable field in one query', async () => {
        sqlMock.mockResolvedValueOnce([]);

        expect(await updateExpense(valid)).toEqual({ ok: true });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/UPDATE expenses SET name = \$1, amount = \$2, date = \$3::date, account = \$4, category = \$5, note = \$6 WHERE id = \$7/);
        expect(params).toEqual(['APPLE', 39.9, '2026-09-20', '1039', 'subscriptions', 'n', 'e1']);
    });

    it('stringifies numeric ids and stores an empty category as null', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await updateExpense({ ...valid, id: 7, category: '' });
        const [, params] = sqlMock.mock.calls[0];
        expect(params[4]).toBeNull();
        expect(params[6]).toBe('7');
    });

    it.each([
        ['missing id', { id: undefined }],
        ['zero amount', { amount: 0 }],
        ['NaN amount', { amount: NaN }],
        ['non-ISO date', { date: '20/09/26' }],
        ['blank name', { name: ' ' }],
    ])('rejects %s', async (_label, overrides) => {
        expect(await updateExpense({ ...valid, ...overrides })).toEqual({ ok: false, error: 'invalid expense' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('rejects an unknown category', async () => {
        expect(await updateExpense({ ...valid, category: 'nope' })).toEqual({ ok: false, error: 'unknown category' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('returns { ok: false } on driver error', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        sqlMock.mockRejectedValueOnce(new Error('boom'));

        expect(await updateExpense(valid)).toEqual({ ok: false, error: 'boom' });
    });
});

describe('findDuplicateGroups', () => {
    const group = (overrides = {}) => ({
        name: 'WOLT',
        amount: 42,
        date: '2025-03-04',
        rows: [
            { id: 'a', name: 'WOLT', amount: 42, account: '3361', category: 'restaurants', note: null },
            { id: 'b', name: 'WOLT ', amount: 42, account: '9325', category: null, note: null },
        ],
        ...overrides,
    });

    it('groups by trimmed name, amount and date and maps rows', async () => {
        sqlMock.mockResolvedValueOnce([group()]);
        sqlMock.mockResolvedValueOnce([]);

        const [result] = await findDuplicateGroups();

        const [query] = sqlMock.mock.calls[0];
        expect(query).toContain('GROUP BY TRIM(name), amount');
        expect(query).toContain('HAVING COUNT(*) > 1');
        expect(result).toMatchObject({ key: 'a|b', name: 'WOLT', amount: 42, date: '2025-03-04' });
        expect(result.rows.map((r) => r.id)).toEqual(['a', 'b']);
        expect(result.rows[1]).toMatchObject({ account: '9325', date: '2025-03-04', month: 3, year: 25 });
    });

    it('hides groups fully covered by a dismissal', async () => {
        sqlMock.mockResolvedValueOnce([group(), group({ rows: [{ id: 'c' }, { id: 'd' }] })]);
        sqlMock.mockResolvedValueOnce([{ expense_ids: ['a', 'b'] }]);

        const result = await findDuplicateGroups();

        expect(result.map((g) => g.key)).toEqual(['c|d']);
    });

    it('shows a dismissed group again when a new identical row joins it', async () => {
        sqlMock.mockResolvedValueOnce([group({ rows: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] })]);
        sqlMock.mockResolvedValueOnce([{ expense_ids: ['a', 'b'] }]);

        const result = await findDuplicateGroups();

        expect(result).toHaveLength(1);
    });

    it('treats a missing dismissals table as no dismissals', async () => {
        sqlMock.mockResolvedValueOnce([group()]);
        sqlMock.mockRejectedValueOnce(Object.assign(new Error('relation does not exist'), { code: '42P01' }));

        const result = await findDuplicateGroups();

        expect(result).toHaveLength(1);
    });
});

describe('dismissDuplicateGroup', () => {
    it('rejects fewer than two ids without querying', async () => {
        expect(await dismissDuplicateGroup(['a'])).toEqual({ ok: false, error: 'missing ids' });
        expect(sqlMock).not.toHaveBeenCalled();
    });

    it('inserts the id set as a text array', async () => {
        sqlMock.mockResolvedValueOnce(undefined);

        const res = await dismissDuplicateGroup(['a', 2]);

        expect(res).toEqual({ ok: true });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toContain('INSERT INTO duplicate_dismissals');
        expect(params).toEqual([['a', '2']]);
    });

    it('creates the table and retries when it does not exist yet', async () => {
        sqlMock.mockRejectedValueOnce(Object.assign(new Error('relation does not exist'), { code: '42P01' }));
        sqlMock.mockResolvedValueOnce(undefined);
        sqlMock.mockResolvedValueOnce(undefined);

        const res = await dismissDuplicateGroup(['a', 'b']);

        expect(res).toEqual({ ok: true });
        expect(sqlMock).toHaveBeenCalledTimes(3);
        expect(sqlMock.mock.calls[1][0]).toContain('CREATE TABLE IF NOT EXISTS duplicate_dismissals');
        expect(sqlMock.mock.calls[2][0]).toContain('INSERT INTO duplicate_dismissals');
    });

    it('returns { ok: false, error } when the driver throws', async () => {
        sqlMock.mockRejectedValueOnce(new Error('boom'));
        expect(await dismissDuplicateGroup(['a', 'b'])).toEqual({ ok: false, error: 'boom' });
    });
});
