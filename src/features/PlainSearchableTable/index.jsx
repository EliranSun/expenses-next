'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';
import { HomepageFilterSheet } from '@/components/organisms/HomepageFilterSheet';
import { HomepageFilterControls } from '@/components/organisms/HomepageFilterControls';

const getCategoricalData = (expenses = [], selectedCategories = [], idsToFilter = []) => {
    const Categories = {};
    let totalAmount = 0;

    expenses.forEach(item => {
        const isFiltered = idsToFilter.includes(item.id);
        const matchesCategory =
            selectedCategories.length === 0 || selectedCategories.includes(item.category);

        if (!isFiltered && matchesCategory) {
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

function PlainSearchableTableInner({
    items = [],
}) {
    const searchParams = useSearchParams();
    const [searchResults, setSearchResults] = useState(items);
    const [idsToFilter, setIdsToFilter] = useState([]);
    const [sortCriteria, setSortCriteria] = useState(['amount', 'desc']);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    const selectedCategories = searchParams.get('category')
        ? searchParams.get('category').split(',')
        : [];

    const categoricalData = getCategoricalData(searchResults, selectedCategories, idsToFilter);

    return (
        <div className="w-full max-w-screen-xl mx-auto">
            <div className="md:hidden">
                <HomepageFilterSheet
                    searchItems={items}
                    onSearch={setSearchResults}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                />
            </div>
            <div className="hidden md:block mb-4">
                <HomepageFilterControls
                    searchItems={items}
                    onSearch={setSearchResults}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                />
            </div>
            <div className='text-xl font-black my-4 text-gray-900 dark:text-gray-100'>
                {formatCurrency(categoricalData.totalAmount)}
            </div>
            <div className="flex gap-4 overflow-x-auto">
                {Object.entries(categoricalData.Categories).map(([key, categoryItems]) => {
                    const total = categoryItems.reduce((prev, curr) => prev + curr.amount, 0);
                    const sortedItems = orderBy(categoryItems, [sortCriteria[0]], [sortCriteria[1]]);
                    return (
                        <div key={key} className='min-w-52 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm'>
                            <h2 className='font-bold text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-gray-700'>{key}</h2>
                            <ul className="max-h-96 overflow-y-auto flex-1 mt-2">
                                {sortedItems.map(item =>
                                    <li
                                        onClick={() => setIdsToFilter(prev => [...prev, item.id])}
                                        className='bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 my-1 p-2 shadow-sm rounded flex flex-col cursor-pointer'
                                        key={item.id}>
                                        <span className='text-sm text-gray-800 dark:text-gray-100 truncate'>{item.name.slice(0, 20)}</span>
                                        {item.note && (
                                            <span className='text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight'>{item.note}</span>
                                        )}
                                        <span className='text-xs text-gray-500 dark:text-gray-400'>{formatCurrency(item.amount)}</span>
                                    </li>)}
                            </ul>
                            <div className='font-black text-gray-900 dark:text-gray-100 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700'>
                                {formatCurrency(total)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default function PlainSearchableTable(props) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlainSearchableTableInner {...props} />
        </Suspense>
    );
}
