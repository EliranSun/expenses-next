'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwiseIcon, EyeSlashIcon } from '@phosphor-icons/react';
import keys from '@/app/he.json';
import { formatCurrency, formatShortDate } from './ExpenseRow';

// Tap-to-hide takes rows out of the totals; this chip shows what was taken
// out and lets each row (or all of them) come back.
export function HiddenExpenses({ items, incomeAmount, expenseAmount, onRestore, onRestoreAll }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handlePointer = (event) => {
            if (!containerRef.current?.contains(event.target)) setOpen(false);
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('pointerdown', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    useEffect(() => {
        if (items.length === 0) setOpen(false);
    }, [items.length]);

    if (items.length === 0) return null;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <EyeSlashIcon size={14} />
                <span>{keys.hidden_count.replace('{count}', items.length)}</span>
                <span className="tabular-nums font-semibold">
                    {formatCurrency(expenseAmount || incomeAmount)}
                </span>
            </button>
            {open && (
                <div
                    role="dialog"
                    aria-label={keys.hidden_expenses}
                    className="absolute start-0 top-full mt-2 z-40 w-[min(22rem,calc(100vw-2rem))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {keys.hidden_expenses}
                        </div>
                        <div className="flex gap-3 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                            {incomeAmount > 0 && <span>{keys.income} {formatCurrency(incomeAmount)}</span>}
                            {expenseAmount > 0 && <span>{keys.expenses} {formatCurrency(expenseAmount)}</span>}
                        </div>
                    </div>
                    <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => onRestore(item.id)}
                                    aria-label={`${keys.restore} ${item.name}`}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-start hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <span className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-100 truncate">
                                        {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                                        {formatShortDate(item.date)}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums shrink-0 text-end min-w-[4rem]">
                                        {formatCurrency(item.amount)}
                                    </span>
                                    <ArrowCounterClockwiseIcon size={14} className="shrink-0 text-gray-400" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={onRestoreAll}
                        className="w-full px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {keys.restore_all}
                    </button>
                </div>
            )}
        </div>
    );
}
