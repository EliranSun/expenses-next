'use client';

import { CalendarIcon, CoinsIcon } from '@phosphor-icons/react';
import Search from '@/features/Search';
import { Navbar } from '../molecules/navbar';

export function HomepageFilterControls({
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
}) {
    const arrow = (field) =>
        sortCriteria[0] === field ? (sortCriteria[1] === 'asc' ? '↑' : '↓') : '';

    const toggleSort = (field) =>
        setSortCriteria([
            field,
            sortCriteria[0] === field && sortCriteria[1] === 'asc' ? 'desc' : 'asc',
        ]);

    return (
        <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="flex-1 min-w-0">
                    <Search items={searchItems} onSearch={onSearch} />
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        type="button"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => toggleSort('amount')}>
                        <CoinsIcon size={18} />
                        <span className="text-sm">Amount {arrow('amount')}</span>
                    </button>
                    <button
                        type="button"
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => toggleSort('date')}>
                        <CalendarIcon size={18} />
                        <span className="text-sm">Date {arrow('date')}</span>
                    </button>
                </div>
            </div>

            <Navbar />
        </div>
    );
}
