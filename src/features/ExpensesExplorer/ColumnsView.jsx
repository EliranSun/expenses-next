'use client';

import Link from 'next/link';
import { Categories } from '@/constants';
import { EditButton, formatCurrency } from './ExpenseRow';

export function ColumnsView({ sortedCategories, trendHref, onHide, onEdit }) {
    return (
        <div className="flex gap-4 overflow-x-auto">
            {sortedCategories.map(({ key, sortedItems, total }) => (
                <div key={key} className='min-w-52 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm'>
                    <h2 className='font-bold text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-gray-700'>
                        <Link href={trendHref(key)} className='hover:text-blue-500'>
                            {Categories[key]?.emoji} {Categories[key]?.name || key}
                        </Link>
                    </h2>
                    <ul className="max-h-96 overflow-y-auto flex-1 mt-2">
                        {sortedItems.map(item =>
                            <li
                                onClick={() => onHide(item.id)}
                                className='relative bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 my-1 p-2 pe-7 shadow-sm rounded flex flex-col cursor-pointer'
                                key={item.id}>
                                <EditButton onClick={() => onEdit(item.id)} className="absolute top-1 end-1" />
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
            ))}
        </div>
    );
}
