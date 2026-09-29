'use client';

import { useEffect, useState } from 'react';
import { Sheet } from '../molecules/BottomSheet';
import { Categories } from '@/constants';
import { Accounts, AccountName } from '@/constants/account';
import { isValidInsertRow } from '@/utils';
import { run } from '@/utils/action';

const toForm = (expense) => ({
    name: expense?.name ?? '',
    amount: expense?.amount != null ? String(expense.amount) : '',
    date: expense?.date ?? '',
    account: expense?.account ?? '',
    category: expense?.category ?? '',
    note: expense?.note ?? '',
});

const inputClass = 'border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-transparent';

function Field({ label, children }) {
    return (
        <label className="flex flex-col gap-1 text-sm flex-1 min-w-0">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            {children}
        </label>
    );
}

export function EditExpenseSheet({ expense, open, onClose, onSaved, onDeleted, updateExpense, deleteExpense }) {
    const [form, setForm] = useState(() => toForm(expense));
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setForm(toForm(expense));
    }, [expense?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

    const payload = {
        id: expense?.id != null ? String(expense.id) : '',
        name: form.name.trim(),
        amount: Number(form.amount),
        date: form.date,
        account: form.account,
        category: form.category || null,
        note: form.note,
    };
    const isValid = form.amount.trim() !== '' && isValidInsertRow(payload);

    const accounts = Accounts.all.includes(form.account) || !form.account
        ? Accounts.all
        : [form.account, ...Accounts.all];

    const handleSave = async () => {
        if (!isValid || busy) return;
        setBusy(true);
        try {
            const res = await run(updateExpense(payload), { success: 'Saved' });
            if (res?.ok) onSaved?.({ ...expense, ...payload, id: expense.id });
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (busy || !window.confirm(`Delete "${expense?.name}"?`)) return;
        setBusy(true);
        try {
            const res = await run(deleteExpense(expense.id), { success: 'Deleted' });
            if (res?.ok) onDeleted?.(expense.id);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Sheet open={open} onClose={onClose} title="עריכת הוצאה">
            <form
                dir="rtl"
                className="flex flex-col gap-3 max-w-lg mx-auto w-full"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                }}>
                <Field label="שם">
                    <input className={inputClass} value={form.name} onChange={set('name')} />
                </Field>
                <div className="flex gap-3">
                    <Field label="סכום">
                        <input
                            className={inputClass}
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            dir="ltr"
                            value={form.amount}
                            onChange={set('amount')} />
                    </Field>
                    <Field label="תאריך">
                        <input className={inputClass} type="date" value={form.date} onChange={set('date')} />
                    </Field>
                </div>
                <div className="flex gap-3">
                    <Field label="חשבון">
                        <select className={inputClass} value={form.account} onChange={set('account')}>
                            {accounts.map((account) => (
                                <option key={account} value={account}>
                                    {account}{AccountName[account] ? ` · ${AccountName[account].translation}` : ''}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="קטגוריה">
                        <select className={inputClass} value={form.category} onChange={set('category')}>
                            <option value="">ללא</option>
                            {Object.entries(Categories).map(([key, { emoji, name }]) => (
                                <option key={key} value={key}>{emoji} {name}</option>
                            ))}
                        </select>
                    </Field>
                </div>
                <Field label="הערה">
                    <input className={inputClass} value={form.note} onChange={set('note')} />
                </Field>
                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={!isValid || busy}
                        className="flex-1 bg-blue-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-semibold">
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleDelete}
                        className="border border-red-300 text-red-600 px-4 py-2 rounded-xl">
                        Delete
                    </button>
                </div>
            </form>
        </Sheet>
    );
}
