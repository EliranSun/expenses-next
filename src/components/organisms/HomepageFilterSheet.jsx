'use client';

import { useSearchParams } from 'next/navigation';
import { CalendarIcon, CoinsIcon } from '@phosphor-icons/react';
import Search from '@/features/Search';
import { BottomSheet } from '../molecules/BottomSheet';
import { Navbar } from '../molecules/navbar';

export function HomepageFilterSheet({
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
}) {
    const searchParams = useSearchParams();
    const hasActiveFilter = Boolean(
        searchParams.get('account') ||
            searchParams.get('category') ||
            searchParams.get('year') ||
            searchParams.get('month')
    );

    const arrow = (field) =>
        sortCriteria[0] === field ? (sortCriteria[1] === 'asc' ? '↑' : '↓') : '';

    return (
        <BottomSheet hasIndicator={hasActiveFilter}>
            <Search items={searchItems} onSearch={onSearch} />

            <div className="flex gap-2 flex-wrap">
                <button
                    type="button"
                    className="bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    onClick={() =>
                        setSortCriteria([
                            'amount',
                            sortCriteria[0] === 'amount' && sortCriteria[1] === 'asc'
                                ? 'desc'
                                : 'asc',
                        ])
                    }>
                    <CoinsIcon size={20} />
                    <span className="text-sm">Amount {arrow('amount')}</span>
                </button>
                <button
                    type="button"
                    className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    onClick={() =>
                        setSortCriteria([
                            'date',
                            sortCriteria[0] === 'date' && sortCriteria[1] === 'asc'
                                ? 'desc'
                                : 'asc',
                        ])
                    }>
                    <CalendarIcon size={20} />
                    <span className="text-sm">Date {arrow('date')}</span>
                </button>
            </div>

            <Navbar />
        </BottomSheet>
    );
}
