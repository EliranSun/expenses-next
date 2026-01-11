'use client';

import { Suspense, useState, useEffect } from 'react';
import Table from '@/components/organisms/table';
import { keyBy } from 'lodash';
import { PrivateAccounts, SharedAccounts } from '@/constants/account';

const getCategoricalData = (expenses = [], isShared = false) => {
    const Categories = {};
    let totalAmount = 0;

    expenses.forEach(item => {
        const shouldAdd =
            (SharedAccounts.includes(item.account) && isShared) ||
            (PrivateAccounts.includes(item.account) && !isShared);

        if (shouldAdd) {
            item.category === "income"
                ? totalAmount += item.amount
                : totalAmount -= item.amount;

            Categories[item.category] = [
                ...(Categories[item.category] || []),
                item,
            ];
        }
    })

    return { Categories, totalAmount };
}

const formatCurrency = amount =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);

export default function PlainSearchableTable({
    items = [],
    updateCategory,
    deleteExpense,
    updateNote,
    year,
    month
}) {
    const [isShared, setIsShared] = useState(true);
    const [searchResults, setSearchResults] = useState(items);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    const categoricalData = getCategoricalData(searchResults, isShared);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="w-full max-w-screen-xl mx-auto">
                {/* <Table
                    year={year}
                    month={month}
                    rows={searchResults}
                    searchItems={items}
                    onSearch={setSearchResults}
                    updateCategory={updateCategory}
                    deleteExpense={deleteExpense}
                    updateNote={updateNote}
                /> */}
                <div className='space-x-4'>
                    <button onClick={() => setIsShared(false)}>Private</button>
                    <button onClick={() => setIsShared(true)}>Shared</button>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {Object.entries(categoricalData.Categories).map(([key, items]) => {
                        const total = items.reduce((prev, curr) => prev + curr.amount, 0);
                        return (
                            <div key={key} className='min-w-32'>
                                <h2 className='underline font-bold'>{key}</h2>
                                <ul className="h-96 overflow-y-auto">
                                    {items
                                        .sort((a, b) => b.amount - a.amount)
                                        .map(item =>
                                            <li
                                                className='bg-white my-2 p-2 shadow-sm rounded flex flex-col'
                                                key={item.id}>
                                                <span className='text-sm underline'>{item.name.slice(0, 15)}</span>
                                                <span className='text-xs'>{formatCurrency(item.amount)}</span>
                                            </li>)}
                                </ul>
                                <div className='font-black'>
                                    {formatCurrency(total)}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className='text-xl font-black my-4'>
                    {formatCurrency(categoricalData.totalAmount)}
                </div>
            </div>
        </Suspense>
    );
}