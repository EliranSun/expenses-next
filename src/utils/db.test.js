import { neon } from '@neondatabase/serverless';
import { Accounts, PrivateAccounts } from '@/constants/account';
import { fetchExpenses, getUnhandledExpenses } from './db';

jest.mock('@neondatabase/serverless', () => ({
    neon: jest.fn(),
}));

const sqlMock = jest.fn();

beforeEach(() => {
    sqlMock.mockReset();
    neon.mockReset();
    neon.mockReturnValue(sqlMock);
});

const dbRow = (overrides = {}) => ({
    name: 'foo',
    amount: 10,
    date: '01/01/25',
    account: '3361',
    category: 'food',
    id: '1',
    note: null,
    ...overrides,
});

describe('fetchExpenses', () => {
    describe('date mapping', () => {
        it('maps DD/MM/YY to YYYY-MM-DD with year/month/timestamp', async () => {
            sqlMock.mockResolvedValueOnce([dbRow({ date: '28/01/25' })]);

            const result = await fetchExpenses();

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                date: '2025-01-28',
                month: 1,
                year: 25,
                timestamp: new Date(2025, 0, 28).getTime(),
            });
        });

        it('preserves the original DB fields alongside derived ones', async () => {
            sqlMock.mockResolvedValueOnce([
                dbRow({ name: 'foo', amount: 10, account: '3361', category: 'food', id: 'abc', note: 'hi' }),
            ]);

            const [result] = await fetchExpenses();

            expect(result.name).toBe('foo');
            expect(result.amount).toBe(10);
            expect(result.account).toBe('3361');
            expect(result.category).toBe('food');
            expect(result.id).toBe('abc');
            expect(result.note).toBe('hi');
        });
    });

    describe('year/month filter', () => {
        const rows = [
            dbRow({ id: '1', date: '01/01/25' }),
            dbRow({ id: '2', date: '15/02/25' }),
            dbRow({ id: '3', date: '01/01/24' }),
            dbRow({ id: '4', date: '15/03/24' }),
        ];

        it('returns only rows matching year and month', async () => {
            sqlMock.mockResolvedValueOnce(rows);

            const result = await fetchExpenses({ year: 25, month: 1 });

            expect(result.map(r => r.id)).toEqual(['1']);
        });

        it('returns all rows for the year when only year is given', async () => {
            sqlMock.mockResolvedValueOnce(rows);

            const result = await fetchExpenses({ year: 24 });

            expect(result.map(r => r.id).sort()).toEqual(['3', '4']);
        });

        it('returns all mapped rows when no filter args are passed', async () => {
            sqlMock.mockResolvedValueOnce(rows);

            const result = await fetchExpenses();

            expect(result).toHaveLength(4);
        });

        it('coerces string filter args to numbers (Number() comparison)', async () => {
            sqlMock.mockResolvedValueOnce(rows);

            const result = await fetchExpenses({ year: '25', month: '1' });

            expect(result.map(r => r.id)).toEqual(['1']);
        });
    });

    describe('sort', () => {
        it('orders rows by timestamp ascending', async () => {
            sqlMock.mockResolvedValueOnce([
                dbRow({ id: 'mar', date: '01/03/25' }),
                dbRow({ id: 'jan', date: '01/01/25' }),
                dbRow({ id: 'feb', date: '01/02/25' }),
            ]);

            const result = await fetchExpenses();

            expect(result.map(r => r.id)).toEqual(['jan', 'feb', 'mar']);
        });

        it('breaks timestamp ties by name via localeCompare', async () => {
            sqlMock.mockResolvedValueOnce([
                dbRow({ id: 'b', name: 'banana', date: '10/01/25' }),
                dbRow({ id: 'a', name: 'apple', date: '10/01/25' }),
            ]);

            const result = await fetchExpenses();

            expect(result.map(r => r.id)).toEqual(['a', 'b']);
        });
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

            expect(sqlMock).toHaveBeenCalledTimes(1);
            const [query, params] = sqlMock.mock.calls[0];
            const expectedPlaceholders = PrivateAccounts
                .map((_, i) => `$${i + 1}`)
                .join(', ');
            expect(query).toContain(`WHERE account IN (${expectedPlaceholders})`);
            expect(params).toEqual(Accounts.private);
        });
    });
});

describe('getUnhandledExpenses', () => {
    it('queries for rows with missing category or date', async () => {
        sqlMock.mockResolvedValueOnce([]);

        await getUnhandledExpenses();

        expect(sqlMock).toHaveBeenCalledTimes(1);
        const [query] = sqlMock.mock.calls[0];
        expect(query).toMatch(/WHERE category IS NULL OR date IS NULL OR date = ''/);
    });

    it('maps date via formatDateFromDB and exposes string year/month', async () => {
        sqlMock.mockResolvedValueOnce([
            dbRow({ date: '28/01/25', category: null }),
        ]);

        const [result] = await getUnhandledExpenses();

        expect(result.date).toBe('2025-01-28');
        // current (pre-Phase-2) shape: month/year come out as strings here
        expect(result.month).toBe('01');
        expect(result.year).toBe('25');
        expect(result.timestamp).toBe(new Date(2025, 0, 28).getTime());
    });

    it('filters by year+month using string comparison (current behaviour)', async () => {
        sqlMock.mockResolvedValueOnce([
            dbRow({ id: 'jan25', date: '01/01/25', category: null }),
            dbRow({ id: 'feb25', date: '01/02/25', category: null }),
            dbRow({ id: 'jan24', date: '01/01/24', category: null }),
        ]);

        const result = await getUnhandledExpenses({ year: '25', month: '01' });

        expect(result.map(r => r.id)).toEqual(['jan25']);
    });
});
