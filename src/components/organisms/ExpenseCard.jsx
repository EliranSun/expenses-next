'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Categories } from '@/constants';
import { CurrencyAmount } from '../atoms/currency-amount';
import { AccountName } from '@/constants/account';
import { run } from '@/utils/action';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Text-like edits are committed on blur, and on unmount in case the card is
// swiped away while the field still has focus. Only changed values go out.
// `live` commits on every change instead (unsaved rows: the edit is local).
function useCommittedField(initial, commit, live) {
    const [value, setValue] = useState(initial);
    const latest = useRef(initial);
    const committed = useRef(initial);
    const commitRef = useRef(commit);
    commitRef.current = commit;

    const flush = () => {
        if (latest.current === committed.current) return;
        if (!commitRef.current(latest.current)) return;
        committed.current = latest.current;
    };

    useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

    const onChange = (next) => {
        latest.current = next;
        setValue(next);
        if (live) flush();
    };

    return [value, onChange, flush];
}

export function ExpenseCard({
    rowData,
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense,
    unmarkDuplicate,
    onCategorySelected,
    liveEdits = false,
}) {
    const [selectedCat, setSelectedCat] = useState(rowData.category || '');
    const [note, setNote, flushNote] = useCommittedField(rowData.note || '', (value) => {
        run(updateNote(rowData.id, value));
        return true;
    }, liveEdits);
    const [date, setDate, flushDate] = useCommittedField(rowData.date || '', (value) => {
        if (!ISO_DATE.test(value)) return false;
        run(updateDate(rowData.id, value));
        return true;
    }, liveEdits);

    const isDuplicate = !!rowData.isDuplicate;

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
            className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl p-4 gap-3 shadow ${isDuplicate ? 'border-2 border-amber-300' : ''}`}>
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

            {isDuplicate && (
                <div className="flex items-center justify-between gap-2 bg-amber-100 text-amber-900 rounded-lg px-3 py-2 text-sm">
                    <span>כבר קיים במסד - לא יישמר</span>
                    <button
                        type="button"
                        onClick={() => unmarkDuplicate?.(rowData.id)}
                        className="bg-amber-200 rounded-full px-3 py-1 text-xs font-semibold shrink-0">
                        Save anyway
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between gap-2" dir="ltr">
                <div className="text-3xl">
                    <CurrencyAmount
                        amount={rowData.amount}
                        isPositive={rowData.category === 'income'}
                        isNegative={rowData.category !== 'income'}
                    />
                </div>
                <input
                    type="date"
                    aria-label="Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={flushDate}
                    className="border border-gray-200 rounded-lg p-1 text-base bg-transparent text-gray-700 dark:text-gray-300"
                />
            </div>

            <input
                type="text"
                aria-label="Note"
                placeholder="הערה"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={flushNote}
                className="border border-gray-200 rounded-lg p-2 w-full bg-transparent text-right text-base"
            />

            <div className="grid grid-cols-4 gap-2 flex-1 min-h-0 content-start overflow-y-auto">
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
