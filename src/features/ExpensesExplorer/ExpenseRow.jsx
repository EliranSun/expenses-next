'use client';

import { PencilSimpleIcon } from '@phosphor-icons/react';
import keys from '@/app/he.json';

export const formatCurrency = (amount) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

export const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
};

// Tapping a row hides it from the total; the pencil edits it instead.
export function EditButton({ onClick, className = '' }) {
    return (
        <button
            type="button"
            aria-label={keys.edit}
            title={keys.edit}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-200 shrink-0 ${className}`}>
            <PencilSimpleIcon size={14} />
        </button>
    );
}

export function ExpenseRow({ item, onHide, onEdit, showDate = true, leading = null }) {
    return (
        <li
            onClick={() => onHide(item.id)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            {leading}
            <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 dark:text-gray-100 truncate leading-tight">
                    {item.name}
                </div>
                {item.note && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                        {item.note}
                    </div>
                )}
            </div>
            {showDate && (
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                    {formatShortDate(item.date)}
                </span>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums shrink-0 text-end min-w-[4rem]">
                {formatCurrency(item.amount)}
            </span>
            <EditButton onClick={() => onEdit(item.id)} />
        </li>
    );
}
