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

const setup = (search = jest.fn(async () => [hit]), props = {}) => {
    const onPick = jest.fn();
    const onEdit = jest.fn();
    const utils = render(<GlobalSearch search={search} onPick={onPick} onEdit={onEdit} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /חיפוש בכל העסקאות/ }));
    const rerender = (next) => utils.rerender(
        <GlobalSearch search={search} onPick={onPick} onEdit={onEdit} {...props} {...next} />
    );
    return { search, onPick, onEdit, rerender };
};

const type = (value) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });

describe('GlobalSearch', () => {
    it('queries the DB with the typed term and lists the hits in a modal', async () => {
        const { search } = setup();

        type('shuf');

        expect(await screen.findByText('Shufersal')).toBeInTheDocument();
        expect(search).toHaveBeenCalledWith('shuf', { limit: 100, signal: expect.any(AbortSignal) });
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

    it('waits for two characters unless the term is a number', async () => {
        const { search } = setup();

        type('s');
        await new Promise((r) => setTimeout(r, 300));
        expect(search).not.toHaveBeenCalled();
        expect(screen.getByText('הקלידו לחיפוש בכל העסקאות')).toBeInTheDocument();

        type('5');
        await waitFor(() => expect(search).toHaveBeenCalledWith('5', expect.anything()));
    });

    it('debounces typing into one request and aborts the superseded one', async () => {
        const signals = [];
        const search = jest.fn(async (_term, { signal }) => {
            signals.push(signal);
            return [hit];
        });
        setup(search);

        type('sh');
        type('shu');
        type('shuf');

        await screen.findByText('Shufersal');
        expect(search).toHaveBeenCalledTimes(1);
        expect(search).toHaveBeenCalledWith('shuf', expect.anything());
    });

    it('serves a repeated term from cache until the version changes', async () => {
        const { search, rerender } = setup();

        type('shuf');
        await screen.findByText('Shufersal');
        type('shufe');
        await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
        type('shuf');
        expect(screen.getByText('Shufersal')).toBeInTheDocument();
        expect(search).toHaveBeenCalledTimes(2);

        rerender({ version: 1 });
        await waitFor(() => expect(search).toHaveBeenCalledTimes(3));
        expect(search).toHaveBeenLastCalledWith('shuf', expect.anything());
    });
});
