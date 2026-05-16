import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockParams,
}));
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter' }),
}));

import TextToExpensesTable from './index';

// Each TableRow renders exactly one 🗑️ delete button (table-row.jsx:24–28).
// Counting those is a stable proxy for the number of rendered rows.
const renderedRowCount = () =>
    screen.queryAllByRole('button', { name: '🗑️' }).length;

const paste = (text) => {
    const container = screen.queryByTestId('paste-container') ?? document.body;
    fireEvent.paste(container, { clipboardData: { getData: () => text } });
};

describe('TextToExpensesTable', () => {
    beforeEach(() => {
        // Silence noisy console.log in Table/TableRow.
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders a row after pasting one line', () => {
        render(<TextToExpensesTable />);

        paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

        expect(renderedRowCount()).toBe(1);
    });

    it('does not paste duplicates of existing staged expenses (pasteFilterLogic)', () => {
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
        // The 69.90 row matches an existing expense → filtered out.
        // Only the 31.90 row is added → 2 + 1 = 3 rendered rows.
        expect(renderedRowCount()).toBe(3);
    });

    it('shows the running total of expenses across all rendered rows', () => {
        const expenses = [
            { id: 1, name: 'APPLE.COM/BILL', amount: 10, account: '3361', date: '28/01/25' },
            { id: 2, name: 'Expense 2', amount: 200, account: 'Account 2', date: '2023-01-02' },
        ];
        render(<TextToExpensesTable expenses={expenses} />);

        // Both rows have no category, so they count as expenses.
        // totalExpenses = 210; bottom-line InfoDisplay renders |0 - 210| = 210.
        const initialAmounts = screen
            .getAllByTestId('currency-amount')
            .map((el) => el.textContent);
        expect(initialAmounts.some((t) => /\b210\b/.test(t))).toBe(true);

        paste('APPLE.COM/BILL2\t28/01/25\t3361\tfoo\t20 ₪');

        const afterAmounts = screen
            .getAllByTestId('currency-amount')
            .map((el) => el.textContent);
        expect(afterAmounts.some((t) => /\b230\b/.test(t))).toBe(true);
    });

    describe('dedup against existingExpenses (DB rows)', () => {
        let alertSpy;
        beforeEach(() => {
            alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        });

        it('drops a pasted row that matches all four fields in an existingExpenses entry', () => {
            // existingExpenses uses YYYY-MM-DD; usePasteToRows applies formatDateFromDB
            // to the pasted DD/MM/YY before comparing.
            const existingExpenses = [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(0);
            expect(alertSpy).toHaveBeenCalledWith('No new expenses found');
        });

        it('keeps the row when name differs', () => {
            const existingExpenses = [
                { id: 'db-1', name: 'DIFFERENT', amount: 69.90, date: '2025-01-28', account: '3361' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(1);
        });

        it('keeps the row when amount differs', () => {
            const existingExpenses = [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 1.00, date: '2025-01-28', account: '3361' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(1);
        });

        it('keeps the row when account differs', () => {
            const existingExpenses = [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '9999' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(1);
        });

        it('keeps the row when date differs (after format conversion)', () => {
            const existingExpenses = [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2024-01-28', account: '3361' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(1);
        });

        it('applies formatDateFromDB before comparing dates (DD/MM/YY → YYYY-MM-DD)', () => {
            // Sanity-check the format conversion: pasted '28/01/25' must match
            // an existingExpenses entry with date '2025-01-28' to dedup.
            const existingExpenses = [
                { id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' },
            ];
            render(<TextToExpensesTable existingExpenses={existingExpenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            expect(renderedRowCount()).toBe(0);
        });
    });
});
