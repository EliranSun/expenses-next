'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CalendarIcon,
    CoinsIcon,
    FunnelIcon,
    PersonIcon,
    UsersIcon,
    XIcon,
} from '@phosphor-icons/react';
import Search from '@/features/Search';
import { Categories } from '@/constants';
import classNames from 'classnames';

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
    const [open, setOpen] = useState(false);
    const hasActiveFilter = Boolean(account) || selectedCategories.length > 0;

    const arrow = (field) =>
        sortCriteria[0] === field ? (sortCriteria[1] === 'asc' ? '↑' : '↓') : '';

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open filters"
                className="fixed bottom-6 right-6 z-30 bg-blue-500 text-white rounded-full p-4 shadow-lg">
                <FunnelIcon size={24} weight="bold" />
                {hasActiveFilter && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            key="backdrop"
                            className="fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            key="sheet"
                            className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">Filters</h2>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close">
                                    <XIcon size={24} />
                                </button>
                            </div>

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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
