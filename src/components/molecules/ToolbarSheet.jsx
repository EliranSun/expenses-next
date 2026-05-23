'use client';

import {
    CalendarIcon,
    CoinsIcon,
    PersonIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import Search from '@/features/Search';
import { Categories } from '@/constants';
import classNames from 'classnames';
import { BottomSheet } from './BottomSheet';

export function ToolbarSheet({
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
    account,
    setAccount,
    selectedCategories,
    setSelectedCategories,
}) {
    const hasActiveFilter = Boolean(account) || selectedCategories.length > 0;

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
                <button
                    type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    onClick={() =>
                        setAccount(account === 'private' ? 'shared' : 'private')
                    }>
                    {account === 'private' ? (
                        <PersonIcon size={20} />
                    ) : (
                        <UsersIcon size={20} />
                    )}
                    <span className="text-sm">
                        {account === 'private' ? 'Private' : 'Shared'}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
                {Object.entries(Categories).map(([key, value]) => (
                    <button
                        type="button"
                        key={key}
                        className={classNames(
                            'border rounded-lg py-2 flex items-center justify-center',
                            {
                                'bg-gray-200 border-gray-400':
                                    selectedCategories.includes(key),
                                'border-gray-300': !selectedCategories.includes(key),
                            }
                        )}
                        onClick={() =>
                            setSelectedCategories(
                                selectedCategories.includes(key)
                                    ? selectedCategories.filter((c) => c !== key)
                                    : [...selectedCategories, key]
                            )
                        }>
                        <span className="text-xl">{value.emoji}</span>
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
}
