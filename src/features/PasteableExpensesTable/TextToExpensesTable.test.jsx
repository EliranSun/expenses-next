import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockParams,
}));
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter' }),
}));

import TextToExpensesTable from './index';

// Each TableRow renders exactly one 🗑️ delete button (table-row.jsx).
// Counting those is a stable proxy for the number of rendered rows.
const renderedRowCount = () =>
    screen.queryAllByRole('button', { name: '🗑️' }).length;

const paste = (text) =>
    fireEvent.paste(document.body, { clipboardData: { getData: () => text } });

const duplicateBadgeCount = () =>
    screen.queryAllByText(/^duplicate$/i).length;

describe('TextToExpensesTable', () => {
    beforeEach(() => {
        // Silence noisy console.log in Table/TableRow.
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders a row after pasting one line', async () => {
        render(<TextToExpensesTable />);

        paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

        await waitFor(() => expect(renderedRowCount()).toBe(1));
    });

    it('does not paste duplicates of existing staged expenses (pasteFilterLogic)', async () => {
        const expenses = [
            { id: 1, name: 'APPLE.COM/BILL', amount: 69.90, account: '3361', date: '28/01/25' },
            { id: 2, name: 'Expense 2', amount: 200, account: 'Account 2', date: '2023-01-02' },
        ];
        render(<TextToExpensesTable expenses={expenses} />);

        expect(renderedRowCount()).toBe(2);

        paste(`
            APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪
            APPLE.COM/BILL\t28/01/25\t3361\tfoo\t31.90 ₪
            APPLE.COM/BILL\t28/01/25\t3361\tfoo\t31.90 ₪
            APPLE.COM/BILL\t28/01/25\t3361\tfoo\t31.90 ₪`);

        // parseTextToRows collapses the three identical 31.90 lines into 1.
        // The 69.90 row matches an existing expense → filtered out by pasteFilterLogic.
        // Only the 31.90 row is added → 2 + 1 = 3 rendered rows.
        await waitFor(() => expect(renderedRowCount()).toBe(3));
    });

    it('renders the pasted row alongside the existing ones', async () => {
        const expenses = [
            { id: 1, name: 'APPLE.COM/BILL', amount: 10, account: '3361', date: '28/01/25' },
            { id: 2, name: 'Expense 2', amount: 200, account: 'Account 2', date: '2023-01-02' },
        ];
        render(<TextToExpensesTable expenses={expenses} />);

        // Pasted row is not in the DOM yet.
        expect(screen.queryAllByText(/APPLE\.COM\/BILL2/)).toHaveLength(0);

        paste('APPLE.COM/BILL2\t28/01/25\t3361\tfoo\t20 ₪');

        // After paste the new row renders and the existing ones stay.
        await waitFor(() => {
            expect(screen.queryAllByText(/APPLE\.COM\/BILL2/).length).toBeGreaterThan(0);
        });
        expect(renderedRowCount()).toBe(3);
    });

    describe('duplicate detection against DB rows', () => {
        it('marks a pasted row as duplicate when all four fields match a DB row', async () => {
            const dbRow = { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' };
            const fetchExpensesByDateRange = jest.fn(async () => [dbRow]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(1);
            expect(fetchExpensesByDateRange).toHaveBeenCalled();
        });

        it('does not mark when name differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                { id: 'db-1', name: 'DIFFERENT', amount: 69.90, date: '2025-01-28', account: '3361' },
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('does not mark when amount differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 1.00, date: '2025-01-28', account: '3361' },
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('does not mark when account differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '9999' },
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('does not mark when date differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2024-01-28', account: '3361' },
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('queries the date range derived from the pasted batch', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => []);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(fetchExpensesByDateRange).toHaveBeenCalled());
            const callArg = fetchExpensesByDateRange.mock.calls[0][0];
            expect(callArg.startDate).toBe('2025-01-28');
            expect(callArg.endDate).toBe('2025-01-29');
            expect(callArg.accounts).toEqual(['3361']);
        });
    });
});
