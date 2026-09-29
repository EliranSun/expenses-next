import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));
jest.mock('../../components/organisms/HomepageFilterSheet', () => ({ HomepageFilterSheet: () => null }));
jest.mock('../../components/organisms/HomepageFilterControls', () => ({ HomepageFilterControls: () => null }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import PlainSearchableTable from './index';

const items = [
    { id: 'a', name: 'APPLE.COM/BILL', amount: 40, date: '2026-09-20', account: '1039', category: 'subscriptions', note: '' },
    { id: 'b', name: 'SUPERMARKET', amount: 100, date: '2026-09-21', account: '9325', category: 'groceries', note: '' },
];

const total = () => screen.getByText('שורה תחתונה').nextSibling.textContent;

describe('PlainSearchableTable editing', () => {
    it('tapping a row still hides it from the total', () => {
        render(<PlainSearchableTable items={items} />);
        const before = total();

        fireEvent.click(screen.getByText('APPLE.COM/BILL'));

        expect(total()).not.toBe(before);
        expect(screen.queryByText('APPLE.COM/BILL')).not.toBeInTheDocument();
    });

    it('the pencil opens the edit sheet without hiding the row', () => {
        render(<PlainSearchableTable items={items} updateExpense={jest.fn()} deleteExpense={jest.fn()} />);
        const before = total();

        const row = screen.getByText('APPLE.COM/BILL').closest('li');
        fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));

        expect(screen.getByRole('dialog', { name: 'עריכת הוצאה' })).toBeInTheDocument();
        expect(screen.getByLabelText('שם')).toHaveValue('APPLE.COM/BILL');
        expect(total()).toBe(before);
    });
});
