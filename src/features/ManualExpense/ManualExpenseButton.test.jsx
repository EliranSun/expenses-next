import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ManualExpenseButton, toManualRow } from './ManualExpenseButton';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe('toManualRow', () => {
    it('builds a staged row with ISO date and numeric amount', () => {
        const row = toManualRow({ name: ' Cafe ', amount: '12.5', date: '2026-09-01', account: '3361', category: '' });
        expect(row).toMatchObject({ name: 'Cafe', amount: 12.5, date: '2026-09-01', account: '3361', isDuplicate: false });
        expect(row).not.toHaveProperty('category');
        expect(typeof row.id).toBe('string');
        expect(row.timestamp).toBe(new Date(2026, 8, 1).getTime());
    });

    it('keeps an explicitly chosen category', () => {
        const row = toManualRow({ name: 'Cafe', amount: '5', date: '2026-09-01', account: '3361', category: 'house' });
        expect(row.category).toBe('house');
    });
});

describe('ManualExpenseButton', () => {
    it('submits the entered expense through onRows', async () => {
        const onRows = jest.fn().mockResolvedValue(undefined);
        render(<ManualExpenseButton onRows={onRows} />);

        fireEvent.click(screen.getByRole('button', { name: 'Add manually' }));
        const submit = screen.getByRole('button', { name: 'Add to list' });
        expect(submit).toBeDisabled();

        fireEvent.change(screen.getByLabelText('שם'), { target: { value: 'Cash coffee' } });
        fireEvent.change(screen.getByLabelText('סכום'), { target: { value: '18' } });
        fireEvent.change(screen.getByLabelText('תאריך'), { target: { value: '2026-09-02' } });
        expect(submit).toBeEnabled();
        fireEvent.click(submit);

        await waitFor(() => expect(onRows).toHaveBeenCalledTimes(1));
        const [rows, options] = onRows.mock.calls[0];
        expect(options).toEqual({ source: 'manual' });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ name: 'Cash coffee', amount: 18, date: '2026-09-02' });
    });
});

describe('ManualExpenseButton modal variant', () => {
    it('renders the form in a modal that closes on Escape', async () => {
        render(<ManualExpenseButton onRows={jest.fn()} variant="modal" />);

        fireEvent.click(screen.getByRole('button', { name: 'Add manually' }));
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
});
