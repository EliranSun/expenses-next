'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import keys from '@/app/he.json';

const pad = (n) => String(n).padStart(2, '0');

// year is 2-digit ('26'), month is '01'-'12'.
const shift = (year, month, delta) => {
    const date = new Date(2000 + Number(year), Number(month) - 1 + delta, 1);
    return { year: pad(date.getFullYear() % 100), month: pad(date.getMonth() + 1) };
};

const buttonClass = 'p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700';

export function MonthStepper({ year, month, onNavigate }) {
    if (!year || !month) return null;

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label={keys.previous_month}
                title={keys.previous_month}
                onClick={() => onNavigate(shift(year, month, -1))}
                className={buttonClass}>
                <CaretRightIcon size={16} />
            </button>
            <button
                type="button"
                aria-label={keys.next_month}
                title={keys.next_month}
                onClick={() => onNavigate(shift(year, month, 1))}
                className={buttonClass}>
                <CaretLeftIcon size={16} />
            </button>
        </div>
    );
}
