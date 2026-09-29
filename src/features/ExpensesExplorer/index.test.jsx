import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockRefresh = jest.fn();
let mockParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
    useSearchParams: () => mockParams,
    useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));
jest.mock('../../components/organisms/HomepageFilterSheet', () => ({ HomepageFilterSheet: () => null }));
jest.mock('../../components/organisms/HomepageFilterControls', () => ({ HomepageFilterControls: () => null }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import ExpensesExplorer from './index';

const items = [
    { id: 'a', name: 'APPLE.COM/BILL', amount: 40, date: '2026-09-20', account: '1039', category: 'subscriptions', note: '' },
    { id: 'b', name: 'SUPERMARKET', amount: 100, date: '2026-09-21', account: '9325', category: 'groceries', note: '' },
];

const total = () => screen.getByText('שורה תחתונה').nextSibling.textContent;

describe('ExpensesExplorer editing', () => {
    it('tapping a row still hides it from the total', () => {
        render(<ExpensesExplorer items={items} />);
        const before = total();

        fireEvent.click(screen.getByText('APPLE.COM/BILL'));

        expect(total()).not.toBe(before);
        expect(screen.queryByText('APPLE.COM/BILL')).not.toBeInTheDocument();
    });

    it('the pencil opens the edit sheet without hiding the row', () => {
        render(<ExpensesExplorer items={items} updateExpense={jest.fn()} deleteExpense={jest.fn()} />);
        const before = total();

        const row = screen.getByText('APPLE.COM/BILL').closest('li');
        fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));

        expect(screen.getByRole('dialog', { name: 'עריכת הוצאה' })).toBeInTheDocument();
        expect(screen.getByLabelText('שם')).toHaveValue('APPLE.COM/BILL');
        expect(total()).toBe(before);
    });
});

const monthItems = [
    { id: 'a', name: 'APPLE.COM/BILL', amount: 40, date: '2026-09-20', timestamp: new Date(2026, 8, 20).getTime(), account: '1039', category: 'subscriptions', note: '' },
    { id: 'b', name: 'SUPERMARKET', amount: 100, date: '2026-09-21', timestamp: new Date(2026, 8, 21).getTime(), account: '9325', category: 'groceries', note: '' },
    { id: 'c', name: 'MARKET', amount: 60, date: '2026-09-21', timestamp: new Date(2026, 8, 21).getTime(), account: '9325', category: 'groceries', note: '' },
];

const dayButton = (day) => screen.getByRole('button', { name: new RegExp(`, ${day} בספטמבר$`) });

describe('ExpensesExplorer calendar view', () => {
    afterEach(() => { mockParams = new URLSearchParams(); });

    it('shows day totals and lists a tapped day', () => {
        mockParams = new URLSearchParams('year=26&month=09&view=calendar');
        render(<ExpensesExplorer items={monthItems} />);

        expect(dayButton(21).textContent).toMatch(/160/);
        expect(dayButton(20).textContent).toMatch(/40/);
        expect(screen.queryByText('SUPERMARKET')).not.toBeInTheDocument();

        fireEvent.click(dayButton(21));

        expect(screen.getByText('SUPERMARKET')).toBeInTheDocument();
        expect(screen.getByText('MARKET')).toBeInTheDocument();
        expect(screen.queryByText('APPLE.COM/BILL')).not.toBeInTheDocument();
    });

    it('hiding a row updates the day total and the bottom line', () => {
        mockParams = new URLSearchParams('year=26&month=09&view=calendar');
        render(<ExpensesExplorer items={monthItems} />);
        const before = total();

        fireEvent.click(dayButton(21));
        fireEvent.click(screen.getByText('SUPERMARKET'));

        expect(screen.queryByText('SUPERMARKET')).not.toBeInTheDocument();
        expect(dayButton(21).textContent).toMatch(/60/);
        expect(dayButton(21).textContent).not.toMatch(/160/);
        expect(total()).not.toBe(before);
    });

    it('respects the category filter like the other views', () => {
        mockParams = new URLSearchParams('year=26&month=09&view=calendar&category=groceries');
        render(<ExpensesExplorer items={monthItems} />);

        expect(dayButton(20).textContent).not.toMatch(/40/);
        expect(dayButton(21).textContent).toMatch(/160/);
        expect(total()).toMatch(/160/);
    });
});

describe('ExpensesExplorer budget view', () => {
    afterEach(() => { mockParams = new URLSearchParams(); });

    it('notes that budget targets are private when another account is filtered', () => {
        mockParams = new URLSearchParams('year=26&month=09&view=budget&account=shared');
        render(<ExpensesExplorer items={monthItems} />);

        expect(screen.getByText(/יעדי התקציב מוגדרים לחשבונות הפרטיים/)).toBeInTheDocument();
    });

    it('has no note for the private account', () => {
        mockParams = new URLSearchParams('year=26&month=09&view=budget&account=private');
        render(<ExpensesExplorer items={monthItems} />);

        expect(screen.queryByText(/יעדי התקציב מוגדרים לחשבונות הפרטיים/)).not.toBeInTheDocument();
        expect(screen.getByText('SUPERMARKET')).toBeInTheDocument();
    });
});
