import {
    addMonths,
    buildSeries,
    categoryHref,
    monthsBetween,
    monthTransactionsHref,
    OTHER_KEY,
    parseRange,
    resolveSeries,
    summarizeSeries,
    totalsByKind,
} from './categoryRange';

describe('addMonths', () => {
    it('crosses year boundaries both ways', () => {
        expect(addMonths('2025-12', 1)).toBe('2026-01');
        expect(addMonths('2025-01', -1)).toBe('2024-12');
        expect(addMonths('2025-09', -11)).toBe('2024-10');
    });
});

describe('parseRange', () => {
    const today = new Date(2026, 8, 29);

    it('defaults to the trailing 12 months', () => {
        expect(parseRange({}, today)).toEqual({
            from: '2025-10',
            to: '2026-09',
            startDate: '2025-10-01',
            endDate: '2026-10-01',
        });
    });

    it('keeps valid params and uses an exclusive end date', () => {
        expect(parseRange({ from: '2024-01', to: '2024-12' }, today)).toMatchObject({
            startDate: '2024-01-01',
            endDate: '2025-01-01',
        });
    });

    it('swaps reversed ranges and ignores invalid values', () => {
        expect(parseRange({ from: '2025-05', to: '2025-02' }, today)).toMatchObject({ from: '2025-02', to: '2025-05' });
        expect(parseRange({ from: 'x', to: '2025-13' }, today)).toMatchObject({ from: '2025-10', to: '2026-09' });
    });
});

describe('monthsBetween', () => {
    it('is inclusive', () => {
        expect(monthsBetween('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    });
});

const rows = [
    { month: '2025-01', category: 'groceries', total: 100 },
    { month: '2025-01', category: 'income', total: 5000 },
    { month: '2025-02', category: 'groceries', total: 300 },
    { month: '2025-02', category: 'restaurants', total: 50 },
];

describe('resolveSeries', () => {
    it('keeps an explicit selection in order and drops unknown keys', () => {
        expect(resolveSeries(rows, ['restaurants', 'nope', 'groceries'])).toEqual({
            keys: ['restaurants', 'groceries'],
            otherKeys: [],
        });
    });

    it('ranks expense categories when nothing is selected', () => {
        expect(resolveSeries(rows, [])).toEqual({ keys: ['groceries', 'restaurants'], otherKeys: [] });
    });

    it('folds series past the cap into other', () => {
        const many = ['house', 'self', 'hobbies', 'subscriptions', 'restaurants', 'groceries', 'workout', 'vacation', 'car'];
        const { keys, otherKeys } = resolveSeries([], many);
        expect(keys).toHaveLength(7);
        expect(otherKeys).toEqual(['vacation', 'car']);
    });
});

describe('buildSeries', () => {
    it('zero-fills months and sums folded categories', () => {
        expect(buildSeries(rows, ['2025-01', '2025-02', '2025-03'], ['groceries'], ['restaurants'])).toEqual([
            { month: '2025-01', groceries: 100, [OTHER_KEY]: 0 },
            { month: '2025-02', groceries: 300, [OTHER_KEY]: 50 },
            { month: '2025-03', groceries: 0, [OTHER_KEY]: 0 },
        ]);
    });
});

describe('summarizeSeries', () => {
    it('computes total, average, max and latest vs average', () => {
        const data = buildSeries(rows, ['2025-01', '2025-02'], ['groceries']);
        expect(summarizeSeries(data, 'groceries')).toEqual({
            total: 400,
            average: 200,
            max: { month: '2025-02', value: 300 },
            latest: { month: '2025-02', value: 300 },
            vsAverage: 50,
        });
    });
});

describe('totalsByKind', () => {
    it('splits income from expenses', () => {
        expect(totalsByKind(rows)).toEqual({ income: 5000, expenses: 450, net: 4550 });
    });
});

describe('categoryHref', () => {
    it('opens the trailing 12 months for a month filter', () => {
        expect(categoryHref({ category: 'groceries', year: '26', month: '03', account: 'private' }))
            .toBe('/categories?category=groceries&from=2025-04&to=2026-03&account=private');
    });

    it('opens the whole year for a year filter', () => {
        expect(categoryHref({ category: 'car', year: '24' })).toBe('/categories?category=car&from=2024-01&to=2024-12');
    });

    it('leaves the range to the page default otherwise', () => {
        expect(categoryHref({ category: 'car', month: '04' })).toBe('/categories?category=car');
    });
});

describe('monthTransactionsHref', () => {
    it('links to the homepage month with categories', () => {
        expect(monthTransactionsHref({ month: '2025-02', categories: ['groceries', 'car'], account: 'shared' }))
            .toBe('/?year=25&month=02&account=shared&category=groceries%2Ccar');
    });
});
