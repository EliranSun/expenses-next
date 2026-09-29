import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DuplicateGroupList } from './DuplicateGroupList';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const row = (id, overrides = {}) => ({
    id, name: 'WOLT', amount: 42, date: '2025-03-04', account: '3361', category: 'restaurants', note: null, ...overrides,
});

const groups = [
    { key: 'a|b|c', name: 'WOLT', amount: 42, date: '2025-03-04', rows: [row('a'), row('b'), row('c')] },
    { key: 'd|e', name: 'AROMA', amount: 18, date: '2025-03-02', rows: [row('d'), row('e')] },
];

const renderList = () => {
    const handlers = {
        deleteExpenses: jest.fn(async () => ({ ok: true })),
        dismissDuplicateGroup: jest.fn(async () => ({ ok: true })),
    };
    render(<DuplicateGroupList groups={groups} {...handlers} />);
    return handlers;
};

beforeEach(() => {
    window.confirm = jest.fn(() => true);
});

describe('DuplicateGroupList', () => {
    it('renders one card per group', () => {
        renderList();
        expect(screen.getAllByTestId('duplicate-group')).toHaveLength(2);
    });

    it('"keep this" deletes the other rows and removes the group', async () => {
        const { deleteExpenses } = renderList();
        const [first] = screen.getAllByTestId('duplicate-group');

        fireEvent.click(within(first).getAllByRole('button', { name: 'השאר רק את זו' })[1]);

        expect(deleteExpenses).toHaveBeenCalledWith(['a', 'c']);
        await waitFor(() => expect(screen.getAllByTestId('duplicate-group')).toHaveLength(1));
    });

    it('deleting one row keeps the group while 2+ rows remain', async () => {
        const { deleteExpenses } = renderList();
        const [first] = screen.getAllByTestId('duplicate-group');

        fireEvent.click(within(first).getAllByRole('button', { name: 'מחק' })[0]);

        expect(deleteExpenses).toHaveBeenCalledWith(['a']);
        await waitFor(() => expect(within(first).getAllByRole('button', { name: 'מחק' })).toHaveLength(2));
        expect(screen.getAllByTestId('duplicate-group')).toHaveLength(2);
    });

    it('"not a duplicate" dismisses the whole group', async () => {
        const { dismissDuplicateGroup } = renderList();
        const [, second] = screen.getAllByTestId('duplicate-group');

        fireEvent.click(within(second).getByRole('button', { name: 'לא כפול' }));

        expect(dismissDuplicateGroup).toHaveBeenCalledWith(['d', 'e']);
        await waitFor(() => expect(screen.getAllByTestId('duplicate-group')).toHaveLength(1));
    });

    it('does nothing when the confirm is cancelled', () => {
        window.confirm = jest.fn(() => false);
        const { deleteExpenses } = renderList();

        fireEvent.click(screen.getAllByRole('button', { name: 'מחק' })[0]);

        expect(deleteExpenses).not.toHaveBeenCalled();
    });

    it('shows the empty state', () => {
        render(<DuplicateGroupList groups={[]} deleteExpenses={jest.fn()} dismissDuplicateGroup={jest.fn()} />);
        expect(screen.getByText('אין כפילויות')).toBeInTheDocument();
    });
});
