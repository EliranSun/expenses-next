import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalSearch } from './GlobalSearch';

const hit = {
    id: '7',
    name: 'Shufersal',
    amount: 120,
    date: '2023-05-14',
    month: 5,
    year: 23,
    account: '3361',
    category: 'groceries',
    note: 'weekly',
};

const setup = (searchExpenses = jest.fn(async () => [hit])) => {
    const onPick = jest.fn();
    const onEdit = jest.fn();
    render(<GlobalSearch searchExpenses={searchExpenses} onPick={onPick} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /חיפוש בכל העסקאות/ }));
    return { searchExpenses, onPick, onEdit };
};

describe('GlobalSearch', () => {
    it('queries the DB with the typed term and lists the hits in a modal', async () => {
        const { searchExpenses } = setup();

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'shuf' } });

        expect(await screen.findByText('Shufersal')).toBeInTheDocument();
        expect(searchExpenses).toHaveBeenCalledWith('shuf', { limit: 100 });
        expect(screen.getByRole('dialog')).toHaveTextContent('14/05/23');
        expect(screen.getByRole('dialog')).toHaveTextContent('weekly');
    });

    it('jumps to the hit on click and closes', async () => {
        const { onPick } = setup();
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'shuf' } });

        fireEvent.click(await screen.findByText('Shufersal'));

        expect(onPick).toHaveBeenCalledWith(hit);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('opens the editor from the pencil', async () => {
        const { onEdit } = setup();
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'shuf' } });
        await screen.findByText('Shufersal');

        fireEvent.click(screen.getByRole('button', { name: 'עריכה' }));

        expect(onEdit).toHaveBeenCalledWith(hit);
    });

    it('shows an empty state when nothing matches', async () => {
        setup(jest.fn(async () => []));

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });

        expect(await screen.findByText('לא נמצאו עסקאות')).toBeInTheDocument();
    });
});
