import { neon } from '@neondatabase/serverless';
import { Accounts, PrivateAccounts } from '@/constants/account';
import {
    fetchExpenses,
    getUnhandledExpenses,
    deleteExpense,
    deleteExpenses,
    insertExpenses,
    updateCategory,
    updateNote,
    updateDate,
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

    it('inserts as a single multi-row VALUES list and returns { ok: true }', async () => {
        sqlMock.mockResolvedValueOnce(undefined);

        const res = await insertExpenses([
            { name: 'a', amount: 1, date: '2025-01-01', account: '3361', category: 'food', id: 'i1' },
            { name: 'b', amount: 2, date: '2025-01-02', account: '3361', category: 'food', id: 'i2' },
        ]);

        expect(res).toEqual({ ok: true, data: { inserted: 2 } });
        const [query, params] = sqlMock.mock.calls[0];
        expect(query).toMatch(/INSERT INTO expenses/);
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
