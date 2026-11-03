import React from 'react';
import { render, screen, fireEvent, waitFor, within, configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// Ingest awaits the DB lookups before rendering, which is slow in jsdom
// under a cold, parallel run.
configure({ asyncUtilTimeout: 5000 });

const mockParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockParams,
}));
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter' }),
}));

import TextToExpensesTable from './index';

// DB rows carry their import fingerprint; these fixtures were never edited.
const withSource = (expense) => ({
    ...expense,
    source: { name: expense.name, amount: expense.amount, date: expense.date, account: expense.account },
});

// Each desktop TableRow renders exactly one 🗑️ delete button (table-row.jsx).
// Counting those is a stable proxy for the number of rendered rows.
const renderedRowCount = () =>
    screen.queryAllByRole('button', { name: '🗑️' }).length;

const paste = (text) =>
    fireEvent.paste(document.body, { clipboardData: { getData: () => text } });

const pasteIntoTextarea = (text) =>
    fireEvent.paste(screen.getByPlaceholderText('Paste rows here…'), {
        clipboardData: { getData: () => text },
    });

const duplicateBadgeCount = () =>
    screen.queryAllByText(/^duplicate\b/i).length;

const desktop = () => within(screen.getByTestId('desktop-table-view'));
const mobile = () => within(screen.getByTestId('mobile-card-view'));
const desktopRow = (name) => within(desktop().getByText(name).closest('[dir="rtl"]'));

const APPLE = 'APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪';
const SPOTIFY = 'SPOTIFY\t29/01/25\t3361\tfoo\t19.90 ₪';

describe('TextToExpensesTable', () => {
    beforeEach(() => {
        // Silence noisy console.log in Table/TableRow.
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(window, 'confirm').mockReturnValue(true);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders a row after pasting one line', async () => {
        render(<TextToExpensesTable />);

        paste(APPLE);

        await waitFor(() => expect(renderedRowCount()).toBe(1));
        expect(screen.getByRole('button', { name: 'Save 1 row' })).toBeEnabled();
    });

    it('skips pasted lines already on the page and reviews only the new ones', async () => {
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

        // parseTextToRows collapses the three identical 31.90 lines into 1, and
        // the 69.90 line is already on the page. The unsaved batch is shown on
        // its own until it is saved or discarded.
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save 1 row' })).toBeInTheDocument());
        expect(renderedRowCount()).toBe(1);

        fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
        await waitFor(() => expect(renderedRowCount()).toBe(2));
    });

    it('does not add the same bank line twice when pasted again before saving', async () => {
        render(<TextToExpensesTable />);

        paste(APPLE);
        await waitFor(() => expect(renderedRowCount()).toBe(1));

        paste(`${APPLE}\n${SPOTIFY}`);
        await waitFor(() => expect(renderedRowCount()).toBe(2));
    });

    it('pre-fills the category from past expenses with the same name', async () => {
        const fetchCategoryHistory = jest.fn(async () => [
            { name: 'APPLE.COM/BILL', category: 'subscriptions', count: 5, lastDate: '2025-01-01' },
        ]);
        render(<TextToExpensesTable fetchCategoryHistory={fetchCategoryHistory} />);

        paste(APPLE);

        await waitFor(() => expect(renderedRowCount()).toBe(1));
        expect(fetchCategoryHistory).toHaveBeenCalled();
        expect(screen.getAllByRole('button', { name: /📺/ }).length).toBeGreaterThan(0);
    });

    describe('editing before saving', () => {
        const history = async () => [
            { name: 'APPLE.COM/BILL', category: 'subscriptions', count: 5, lastDate: '2025-01-01' },
        ];

        it('desktop: category, note and date edits stay local and go out with the insert', async () => {
            const onSave = jest.fn(async () => ({ ok: true }));
            const updateCategory = jest.fn();
            const updateNote = jest.fn();
            const updateDate = jest.fn();
            render(
                <TextToExpensesTable
                    fetchCategoryHistory={history}
                    onSave={onSave}
                    updateCategory={updateCategory}
                    updateNote={updateNote}
                    updateDate={updateDate}
                />
            );

            paste(APPLE);
            await waitFor(() => expect(renderedRowCount()).toBe(1));

            // Scope to the row: the desktop toolbar has emoji filter chips too.
            const row = desktopRow(/APPLE\.COM\/BILL/);
            fireEvent.click(row.getAllByRole('button', { name: /📺/ })[0]);
            fireEvent.click(row.getAllByRole('button', { name: /🛒/ })[0]);

            const [note] = row.getAllByRole('textbox');
            fireEvent.change(note, { target: { value: 'weekly shop' } });
            fireEvent.blur(note);

            const date = row.getByDisplayValue('2025-01-28');
            fireEvent.change(date, { target: { value: '2025-02-03' } });
            fireEvent.blur(date);

            fireEvent.click(screen.getByRole('button', { name: 'Save 1 row' }));

            await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
            expect(onSave.mock.calls[0][0]).toEqual([expect.objectContaining({
                name: 'APPLE.COM/BILL',
                category: 'groceries',
                note: 'weekly shop',
                date: '2025-02-03',
                // The fingerprint keeps the pasted date.
                source: { name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' },
            })]);
            expect(updateCategory).not.toHaveBeenCalled();
            expect(updateNote).not.toHaveBeenCalled();
            expect(updateDate).not.toHaveBeenCalled();
        });

        it('mobile: pasting into the textarea adds the row once and card edits are saved', async () => {
            const onSave = jest.fn(async (rows) => ({ ok: true, data: { ids: rows.map((r) => r.id) } }));
            render(<TextToExpensesTable fetchCategoryHistory={history} onSave={onSave} />);

            pasteIntoTextarea(APPLE);

            await waitFor(() => expect(mobile().getByText('1 / 1')).toBeInTheDocument());
            expect(renderedRowCount()).toBe(1);

            const card = mobile();
            fireEvent.change(card.getByRole('textbox', { name: 'Note' }), { target: { value: 'family plan' } });
            fireEvent.change(card.getByLabelText('Date'), { target: { value: '2025-01-30' } });
            fireEvent.blur(card.getByLabelText('Date'));
            fireEvent.click(card.getByRole('button', { name: /🛒/ }));

            fireEvent.click(screen.getByRole('button', { name: 'Save 1 row' }));

            await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
            const sent = onSave.mock.calls[0][0];
            expect(sent).toHaveLength(1);
            expect(sent[0]).toMatchObject({ category: 'groceries', note: 'family plan', date: '2025-01-30' });

            // Categorized and saved: nothing left on the page.
            await waitFor(() => expect(renderedRowCount()).toBe(0));
        });

        it('mobile: keeps the edited card on screen when a date change re-sorts the batch', async () => {
            render(<TextToExpensesTable />);

            pasteIntoTextarea(`${APPLE}\n${SPOTIFY}`);
            await waitFor(() => expect(mobile().getByText('1 / 2')).toBeInTheDocument());
            expect(mobile().getByRole('heading', { level: 2 })).toHaveTextContent('APPLE.COM/BILL');

            const date = mobile().getByLabelText('Date');
            fireEvent.change(date, { target: { value: '2025-02-10' } });
            fireEvent.blur(date);

            await waitFor(() => expect(mobile().getByText('2 / 2')).toBeInTheDocument());
            expect(mobile().getByRole('heading', { level: 2 })).toHaveTextContent('APPLE.COM/BILL');
        });

        it('saved rows without a category stay on the page and later edits hit the DB', async () => {
            const onSave = jest.fn(async (rows) => ({ ok: true, data: { ids: rows.map((r) => r.id) } }));
            const updateCategory = jest.fn(async () => ({ ok: true }));
            render(<TextToExpensesTable onSave={onSave} updateCategory={updateCategory} />);

            paste(APPLE);
            await waitFor(() => expect(renderedRowCount()).toBe(1));

            fireEvent.click(screen.getByRole('button', { name: 'Save 1 row' }));
            await waitFor(() => expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument());
            expect(screen.getByText(/^1 הוצאות שמורות/)).toBeInTheDocument();
            expect(renderedRowCount()).toBe(1);

            const savedId = onSave.mock.calls[0][0][0].id;
            fireEvent.click(desktopRow(/APPLE\.COM\/BILL/).getAllByRole('button', { name: /🛒/ })[0]);

            await waitFor(() => expect(updateCategory).toHaveBeenCalledWith(savedId, 'groceries'));
        });

        it('keeps the batch when saving fails', async () => {
            const onSave = jest.fn(async () => ({ ok: false, error: 'boom' }));
            render(<TextToExpensesTable onSave={onSave} />);

            paste(APPLE);
            await waitFor(() => expect(renderedRowCount()).toBe(1));

            fireEvent.click(screen.getByRole('button', { name: 'Save 1 row' }));
            await waitFor(() => expect(onSave).toHaveBeenCalled());

            expect(await screen.findByRole('button', { name: 'Save 1 row' })).toBeEnabled();
            expect(renderedRowCount()).toBe(1);
        });
    });

    describe('duplicate detection against DB rows', () => {
        it('marks a pasted row as duplicate when all four fields match a DB row', async () => {
            const dbRow = withSource({ id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' });
            const fetchExpensesByDateRange = jest.fn(async () => [dbRow]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(1);
            expect(fetchExpensesByDateRange).toHaveBeenCalled();
        });

        it('does not mark when name differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                withSource({ id: 'db-1', name: 'DIFFERENT', amount: 69.90, date: '2025-01-28', account: '3361' }),
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('does not mark when amount differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                withSource({ id: 'db-1', name: 'APPLE.COM/BILL', amount: 1.00, date: '2025-01-28', account: '3361' }),
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('does not mark when account differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                withSource({ id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '9999' }),
            ]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            expect(duplicateBadgeCount()).toBe(0);
        });

        it('marks a row whose DB copy was edited but keeps the same source fingerprint', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [{
                id: 'db-1', name: 'Apple subscription', amount: 70, date: '2025-02-03', account: '9325',
                source: { name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' },
            }]);

            render(<TextToExpensesTable fetchExpensesByDateRange={fetchExpensesByDateRange} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await waitFor(() => expect(renderedRowCount()).toBe(1));
            await waitFor(() => expect(duplicateBadgeCount()).toBe(1));
        });

        it('skips a pasted row matching an on-page expense by its source fingerprint', async () => {
            const expenses = [{
                id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-02-03', account: '3361', category: null,
                source: { name: 'APPLE.COM/BILL', amount: 69.90, date: '2025-01-28', account: '3361' },
            }];

            render(<TextToExpensesTable expenses={expenses} />);

            paste('APPLE.COM/BILL\t28/01/25\t3361\tfoo\t69.90 ₪');

            await new Promise((r) => setTimeout(r, 50));
            expect(renderedRowCount()).toBe(1);
        });

        it('does not mark when date differs', async () => {
            const fetchExpensesByDateRange = jest.fn(async () => [
                withSource({ id: 'db-1', name: 'APPLE.COM/BILL', amount: 69.90, date: '2024-01-28', account: '3361' }),
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
