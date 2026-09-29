'use client';

import classNames from 'classnames';
import { CalendarBlankIcon, ChartPieSliceIcon, ColumnsIcon, LayoutIcon, RowsIcon } from '@phosphor-icons/react';
import keys from '@/app/he.json';

export const VIEWS = [
    { id: 'list', label: keys.view_list, Icon: RowsIcon },
    { id: 'columns', label: keys.view_columns, Icon: ColumnsIcon },
    { id: 'calendar', label: keys.view_calendar, Icon: CalendarBlankIcon },
    { id: 'treemap', label: keys.view_treemap, Icon: LayoutIcon },
    { id: 'budget', label: keys.view_budget, Icon: ChartPieSliceIcon },
];

export function ViewSwitcher({ value, onChange }) {
    return (
        <div
            role="group"
            aria-label={keys.view}
            className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {VIEWS.map(({ id, label, Icon }) => {
                const isActive = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={isActive}
                        aria-label={label}
                        title={label}
                        onClick={() => onChange(id)}
                        className={classNames(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                            {
                                'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm font-bold': isActive,
                                'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': !isActive,
                            },
                        )}>
                        <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
