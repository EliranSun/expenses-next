import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditExpenseSheet } from './EditExpenseSheet';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const expense = {
    id: 'e1',
    name: 'APPLE.COM/BILL',
    amount: 39.9,
    date: '2026-09-20',
    account: '1039',
    category: 'tech',
    note: '',
};

const renderSheet = (props = {}) => {
    const handlers = {
        onClose: jest.fn(),
        onSaved: jest.fn(),
        onDeleted: jest.fn(),
        updateExpense: jest.fn(async () => ({ ok: true })),
        deleteExpense: jest.fn(async () => ({ ok: true })),
    };
    render(<EditExpenseSheet expense={expense} open {...handlers} {...props} />);
    return handlers;
};

describe('EditExpenseSheet', () => {
    it('prefills the form from the expense', () => {
        renderSheet();
        expect(screen.getByLabelText('שם')).toHaveValue('APPLE.COM/BILL');
        expect(screen.getByLabelText('סכום')).toHaveValue(39.9);
        expect(screen.getByLabelText('תאריך')).toHaveValue('2026-09-20');
        expect(screen.getByLabelText('חשבון')).toHaveValue('1039');
        expect(screen.getByLabelText('קטגוריה')).toHaveValue('tech');
    });

    it('saves the edited fields', async () => {
        const { updateExpense, onSaved } = renderSheet();

        fireEvent.change(screen.getByLabelText('סכום'), { target: { value: '52.8' } });
        fireEvent.change(screen.getByLabelText('קטגוריה'), { target: { value: 'subscriptions' } });
        fireEvent.change(screen.getByLabelText('הערה'), { target: { value: 'iCloud' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        const payload = {
            id: 'e1',
            name: 'APPLE.COM/BILL',
            amount: 52.8,
            date: '2026-09-20',
            account: '1039',
            category: 'subscriptions',
            note: 'iCloud',
        };
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith(payload));
        expect(updateExpense).toHaveBeenCalledWith(payload);
    });

    it('disables save for invalid input', () => {
        renderSheet();
        fireEvent.change(screen.getByLabelText('שם'), { target: { value: ' ' } });
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('שם'), { target: { value: 'x' } });
        fireEvent.change(screen.getByLabelText('סכום'), { target: { value: '' } });
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('does not report a failed save', async () => {
        const updateExpense = jest.fn(async () => ({ ok: false, error: 'x' }));
        const { onSaved } = renderSheet({ updateExpense });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(updateExpense).toHaveBeenCalled());
        expect(onSaved).not.toHaveBeenCalled();
    });

    it('deletes after confirmation', async () => {
        const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const { deleteExpense, onDeleted } = renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('e1'));
        expect(deleteExpense).toHaveBeenCalledWith('e1');
        confirm.mockRestore();
    });

    it('does not delete when not confirmed', () => {
        const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
        const { deleteExpense } = renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(deleteExpense).not.toHaveBeenCalled();
        confirm.mockRestore();
    });
});
