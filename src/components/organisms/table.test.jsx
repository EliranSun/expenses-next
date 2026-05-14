import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
    useSearchParams: () => mockParams,
}));

jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter' }),
}));

import Table from './table';

const setQuery = (queryString = '') => {
    for (const key of [...mockParams.keys()]) mockParams.delete(key);
    for (const [k, v] of new URLSearchParams(queryString)) mockParams.set(k, v);
};

const row = (overrides = {}) => {
    const date = overrides.date || '2025-01-10';
    const [y, m, d] = date.split('-').map(Number);
    return {
        id: 'x',
        name: 'X',
        amount: 100,
        account: '3361',
        category: 'groceries',
        date,
        timestamp: new Date(y, m - 1, d).getTime(),
        ...overrides,
    };
};

const renderTable = (props = {}) => {
    return render(
        <Table
            rows={[]}
            updateCategory={() => { }}
            updateNote={() => { }}
            updateDate={() => { }}
            deleteExpense={() => { }}
            year={2025}
            month={1}
            searchItems={[]}
            onSearch={() => { }}
            {...props}
        />
    );
};

const visibleRowNames = () => {
    // The Table renders one top h1 (date heading) plus one h1 per TableRow.
    // Each TableRow h1 has text like "Alpha - פרטי" — we read the name prefix.
    const headings = screen.getAllByRole('heading', { level: 1 });
    return headings.slice(1).map(h => h.textContent.split(' - ')[0].trim());
};

const fixtures = [
    row({ id: 'a', name: 'Alpha', amount: 10, account: '3361', date: '2025-01-10', category: 'groceries' }),
    row({ id: 'b', name: 'Bravo', amount: 200, account: '9325', date: '2025-01-15', category: 'groceries' }),
    row({ id: 'c', name: 'Cain', amount: 50, account: '170-489748', date: '2025-01-05', category: 'transportation' }),
    row({ id: 'd', name: 'Delta', amount: 500, account: '754-320766', date: '2025-01-20', category: 'income' }),
];

beforeEach(() => {
    setQuery('');
    // Silence noisy console.log in table.jsx (expensesByMonth + delete logs).
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('Table — filter', () => {
    describe('account filter (URL ?account)', () => {
        it('returns all rows when no account is set', () => {
            renderTable({ rows: fixtures });

            expect(visibleRowNames().sort()).toEqual(['Alpha', 'Bravo', 'Cain', 'Delta']);
        });

        it('keeps only rows in PrivateAccounts when account=private', () => {
            setQuery('account=private');
            renderTable({ rows: fixtures });

            expect(visibleRowNames().sort()).toEqual(['Alpha', 'Cain']);
        });

        it('keeps only rows in SharedAccounts when account=shared', () => {
            setQuery('account=shared');
            renderTable({ rows: fixtures });

            expect(visibleRowNames().sort()).toEqual(['Bravo', 'Delta']);
        });

        it('keeps zero rows when account=wife (WifeAccount is empty)', () => {
            setQuery('account=wife');
            renderTable({ rows: fixtures });

            expect(visibleRowNames()).toEqual([]);
        });
    });

    describe('category filter via UI chip', () => {
        it('filters down to selected category when a chip is clicked', () => {
            renderTable({ rows: fixtures });

            // groceries emoji is 🛒 (unique in Categories)
            fireEvent.click(screen.getByRole('button', { name: '🛒' }));

            expect(visibleRowNames().sort()).toEqual(['Alpha', 'Bravo']);
        });

        it('toggling the same chip off restores all rows', () => {
            renderTable({ rows: fixtures });

            const chip = screen.getByRole('button', { name: '🛒' });
            fireEvent.click(chip);
            fireEvent.click(chip);

            expect(visibleRowNames().sort()).toEqual(['Alpha', 'Bravo', 'Cain', 'Delta']);
        });

        it('supports selecting multiple chips (union of categories)', () => {
            renderTable({ rows: fixtures });

            fireEvent.click(screen.getByRole('button', { name: '🛒' }));   // groceries
            fireEvent.click(screen.getByRole('button', { name: '🚌' }));   // transportation

            expect(visibleRowNames().sort()).toEqual(['Alpha', 'Bravo', 'Cain']);
        });
    });

    describe('row hiding on delete', () => {
        it('hides a deleted row from the rendered list', () => {
            const deleteExpense = jest.fn();
            renderTable({ rows: fixtures, deleteExpense });

            // Each TableRow has one "🗑️" button. Find the delete button inside the Alpha row.
            const alphaHeading = screen
                .getAllByRole('heading', { level: 1 })
                .find(h => h.textContent.startsWith('Alpha'));
            const alphaRow = alphaHeading.closest('div[dir="rtl"]');
            fireEvent.click(within(alphaRow).getByRole('button', { name: '🗑️' }));

            expect(deleteExpense).toHaveBeenCalledWith('a');
            expect(visibleRowNames().sort()).toEqual(['Bravo', 'Cain', 'Delta']);
        });
    });
});

describe('Table — sort', () => {
    it('defaults to sorting by date ascending', () => {
        renderTable({ rows: fixtures });

        // dates: c=Jan 5, a=Jan 10, b=Jan 15, d=Jan 20
        expect(visibleRowNames()).toEqual(['Cain', 'Alpha', 'Bravo', 'Delta']);
    });

    it('flips date order when the date sort button is clicked', () => {
        renderTable({ rows: fixtures });

        // The date button shows a calendar icon; we find it by its color class.
        // Two sort buttons exist (amount yellow, date green); pick by index.
        // Buttons in order: amount-sort, date-sort, account-toggle, then 21 category chips.
        const buttons = screen.getAllByRole('button');
        // amount-sort = buttons[0], date-sort = buttons[1]
        fireEvent.click(buttons[1]);

        expect(visibleRowNames()).toEqual(['Delta', 'Bravo', 'Alpha', 'Cain']);
    });

    it('sorts by amount descending when amount sort is clicked once (toggles asc→desc)', () => {
        renderTable({ rows: fixtures });

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // amount-sort (initial sortCriteria[1] is "asc" → flips to "desc")

        // amounts desc: d=500, b=200, c=50, a=10
        expect(visibleRowNames()).toEqual(['Delta', 'Bravo', 'Cain', 'Alpha']);
    });

    it('sorts by amount ascending when amount sort is clicked twice (toggles back)', () => {
        renderTable({ rows: fixtures });

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[0]);

        // amounts asc: a=10, c=50, b=200, d=500
        expect(visibleRowNames()).toEqual(['Alpha', 'Cain', 'Bravo', 'Delta']);
    });
});
