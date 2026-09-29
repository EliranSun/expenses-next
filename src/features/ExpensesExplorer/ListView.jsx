'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { CaretDownIcon, CaretLeftIcon, ChartLineIcon } from '@phosphor-icons/react';
import { Categories } from '@/constants';
import keys from '@/app/he.json';
import { ExpenseRow, formatCurrency } from './ExpenseRow';

export function ListView({ sortedCategories, trendHref, onHide, onEdit }) {
    const [collapsedCategories, setCollapsedCategories] = useState({});

    const toggleCategory = useCallback((key) =>
        setCollapsedCategories((prev) => ({ ...prev, [key]: !prev[key] })), []);

    return (
        <div className="flex flex-col gap-2">
            {sortedCategories.map(({ key, sortedItems, total }) => {
                const meta = Categories[key];
                const isCollapsed = collapsedCategories[key];
                return (
                    <section
                        key={key}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800">
                            <button
                                type="button"
                                onClick={() => toggleCategory(key)}
                                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-start">
                                {isCollapsed
                                    ? <CaretLeftIcon size={14} className="shrink-0 text-gray-500" />
                                    : <CaretDownIcon size={14} className="shrink-0 text-gray-500" />}
                                {meta?.emoji && <span className="shrink-0">{meta.emoji}</span>}
                                <span className="font-bold text-gray-800 dark:text-gray-200 flex-1 truncate">
                                    {meta?.name || key}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                    {sortedItems.length}
                                </span>
                                <span className="font-black text-gray-900 dark:text-gray-100 tabular-nums shrink-0">
                                    {formatCurrency(total)}
                                </span>
                            </button>
                            <Link
                                href={trendHref(key)}
                                aria-label={keys.view_trend}
                                title={keys.view_trend}
                                className="p-2 me-1 rounded text-gray-400 hover:text-blue-500 shrink-0">
                                <ChartLineIcon size={16} />
                            </Link>
                        </div>
                        {!isCollapsed && (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {sortedItems.map((item) => (
                                    <ExpenseRow key={item.id} item={item} onHide={onHide} onEdit={onEdit} />
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
