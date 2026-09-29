'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sheet } from '@/components/molecules/BottomSheet';
import { Field, inputClass } from '@/components/organisms/EditExpenseSheet';
import { Categories } from '@/constants';
import { Accounts, AccountName } from '@/constants/account';
import { isValidInsertRow } from '@/utils';

const today = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const emptyForm = () => ({
    name: '',
    amount: '',
    date: today(),
    account: Accounts.all[0],
    category: '',
});

// Builds a staged row in the same shape parseAndPrepareRows produces, so it
// goes through the same duplicate check, category suggestion and save flow.
export const toManualRow = (form) => {
    const [year, month, day] = form.date.split('-').map(Number);
    return {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        amount: Number(form.amount),
        date: form.date,
        account: form.account,
        ...(form.category ? { category: form.category } : {}),
        timestamp: new Date(year, month - 1, day).getTime(),
        isDuplicate: false,
    };
};

export function ManualExpenseButton({ onRows, className = '' }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);

    const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

    const isValid = form.amount.trim() !== '' && isValidInsertRow({ ...form, id: 'new', amount: Number(form.amount) });

    const handleAdd = async () => {
        if (!isValid || busy) return;
        setBusy(true);
        try {
            await onRows([toManualRow(form)], { source: 'manual' });
            toast.success(`Added "${form.name.trim()}"`);
            // Keep date/account/category so several entries can be added in a row.
            setForm((prev) => ({ ...prev, name: '', amount: '' }));
            setOpen(false);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`bg-gray-200 text-gray-800 px-4 py-2 rounded-xl ${className}`}>
                Add manually
            </button>
            <Sheet open={open} onClose={() => setOpen(false)} title="הוספת הוצאה">
                <form
                    dir="rtl"
                    className="flex flex-col gap-3 max-w-lg mx-auto w-full"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleAdd();
                    }}>
                    <Field label="שם">
                        <input className={inputClass} value={form.name} onChange={set('name')} autoFocus />
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
                                {Accounts.all.map((account) => (
                                    <option key={account} value={account}>
                                        {account}{AccountName[account] ? ` · ${AccountName[account].translation}` : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="קטגוריה">
                            <select className={inputClass} value={form.category} onChange={set('category')}>
                                <option value="">אוטומטי</option>
                                {Object.entries(Categories).map(([key, { emoji, name }]) => (
                                    <option key={key} value={key}>{emoji} {name}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <button
                        type="submit"
                        disabled={!isValid || busy}
                        className="bg-blue-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-semibold mt-2">
                        {busy ? 'Adding…' : 'Add to list'}
                    </button>
                </form>
            </Sheet>
        </>
    );
}
