'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Categories } from '@/constants';
import { CurrencyAmount } from '../atoms/currency-amount';
import { AccountName } from '@/constants/account';
import { run } from '@/utils/action';
import { formatDate } from '@/utils/formatDate';

export function ExpenseCard({
    rowData,
    updateCategory,
    updateNote,
    deleteExpense,
    onCategorySelected,
}) {
    const [note, setNote] = useState(rowData.note || '');
    const [selectedCat, setSelectedCat] = useState(rowData.category || '');

    const handleCategoryTap = (key) => {
        const isNew = key !== selectedCat;
        setSelectedCat(key);
        run(updateCategory(rowData.id, key));
        if (isNew) {
            window.setTimeout(() => onCategorySelected?.(key), 180);
        }
    };

    return (
        <div
            dir="rtl"
            className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl p-4 gap-3 shadow">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                    <h2 className="text-xl font-bold leading-tight truncate">{rowData.name}</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {AccountName[rowData.account]?.translation || rowData.account}
                    </span>
                </div>
                <button
                    type="button"
                    aria-label="Delete"
                    className="border border-gray-300 rounded-lg px-2 py-1 text-lg shrink-0"
                    onClick={() => deleteExpense(rowData.id)}>
                    🗑️
                </button>
            </div>

            <div className="flex items-center justify-between" dir="ltr">
                <div className="text-3xl">
                    <CurrencyAmount
                        amount={rowData.amount}
                        isPositive={rowData.category === 'income'}
                        isNegative={rowData.category !== 'income'}
                    />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(rowData.date)}</div>
            </div>

            <input
                type="text"
                placeholder="הערה"
                defaultValue={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => run(updateNote(rowData.id, note))}
                className="border border-gray-200 rounded-lg p-2 w-full bg-transparent text-right"
            />

            <div className="grid grid-cols-4 gap-2 flex-1 min-h-0 content-stretch">
                {Object.entries(Categories).map(([key, value]) => {
                    const isSelected = selectedCat === key;
                    return (
                        <motion.button
                            key={key}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => handleCategoryTap(key)}
                            className={`rounded-xl border flex flex-col items-center justify-center gap-1 py-1 px-1 ${isSelected
                                ? 'bg-blue-100 border-blue-400'
                                : 'bg-white dark:bg-gray-800 border-gray-200'
                                }`}>
                            <span className="text-2xl leading-none">{value.emoji}</span>
                            <span className="text-[10px] text-gray-700 dark:text-gray-300 leading-tight text-center line-clamp-2">
                                {value.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
