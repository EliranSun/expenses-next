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
            <div className="flex gap-4 overflow-x-auto">
                {Object.entries(categoricalData.Categories).map(([key, categoryItems]) => {
                    const total = categoryItems.reduce((prev, curr) => prev + curr.amount, 0);
                    const sortedItems = orderBy(categoryItems, [sortCriteria[0]], [sortCriteria[1]]);
                    return (
                        <div key={key} className='min-w-32'>
                            <h2 className='underline font-bold'>{key}</h2>
                            <ul className="h-96 overflow-y-auto">
                                {sortedItems.map(item =>
                                    <li
                                        onClick={() => setIdsToFilter(prev => [...prev, item.id])}
                                        className='bg-white dark:bg-gray-800 my-2 p-2 shadow-sm rounded flex flex-col'
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
    );
}

export default function PlainSearchableTable(props) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlainSearchableTableInner {...props} />
        </Suspense>
    );
}
