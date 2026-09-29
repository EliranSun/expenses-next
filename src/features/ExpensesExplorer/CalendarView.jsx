'use client';

import { useMemo, useState } from 'react';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import { getDay, getDaysInMonth } from 'date-fns';
import { Categories } from '@/constants';
import keys from '@/app/he.json';
import { ExpenseRow, formatCurrency } from './ExpenseRow';

const pad = (n) => String(n).padStart(2, '0');

const compactCurrency = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const dayLabelFormat = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

// 2023-01-01 was a Sunday; Israeli weeks start on Sunday.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat('he-IL', { weekday: 'narrow' }).format(new Date(2023, 0, 1 + i))
);

// Amber tint scaled to the busiest day. rgba keeps it readable in dark mode.
const heat = (amount, max) => {
    if (amount <= 0 || max <= 0) return undefined;
    return { backgroundColor: `rgba(245, 158, 11, ${0.12 + 0.68 * Math.min(amount / max, 1)})` };
};

const dateKey = (fullYear, monthIndex, day) => `${fullYear}-${pad(monthIndex + 1)}-${pad(day)}`;

// Per-day totals keyed by 'YYYY-MM-DD'. `expense` counts everything except
// income (refunds stay negative so they net out); income is tracked apart.
const groupByDay = (items) => {
    const days = {};
    items.forEach((item) => {
        if (!item.date) return;
        const day = days[item.date] || (days[item.date] = { expense: 0, income: 0, items: [] });
        if (item.category === 'income') day.income += item.amount;
        else day.expense += item.amount;
        day.items.push(item);
    });
    return days;
};

// Weeks of 7 cells (null = padding) for the given month.
const monthWeeks = (fullYear, monthIndex) => {
    const first = new Date(fullYear, monthIndex, 1);
    const cells = [
        ...Array(getDay(first)).fill(null),
        ...Array.from({ length: getDaysInMonth(first) }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
};

const todayKey = () => {
    const now = new Date();
    return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

function MonthGrid({ fullYear, monthIndex, days, onHide, onEdit }) {
    const [selectedDay, setSelectedDay] = useState(null);
    const weeks = useMemo(() => monthWeeks(fullYear, monthIndex), [fullYear, monthIndex]);
    const today = todayKey();

    const maxDay = useMemo(() => {
        let max = 0;
        weeks.flat().forEach((day) => {
            if (day) max = Math.max(max, days[dateKey(fullYear, monthIndex, day)]?.expense ?? 0);
        });
        return max;
    }, [weeks, days, fullYear, monthIndex]);

    const selected = selectedDay ? days[selectedDay] : null;
    const selectedItems = selected ? orderBy(selected.items, ['amount'], ['desc']) : [];

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm">
                {WEEKDAYS.map((label) => (
                    <div key={label} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1">
                        {label}
                    </div>
                ))}
                <div className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1 px-1">
                    {keys.week}
                </div>

                {weeks.map((week, weekIndex) => {
                    const weekTotal = week.reduce(
                        (sum, day) => sum + (day ? days[dateKey(fullYear, monthIndex, day)]?.expense ?? 0 : 0),
                        0,
                    );
                    return [
                        ...week.map((day, i) => {
                            if (!day) return <div key={`${weekIndex}-${i}`} />;
                            const key = dateKey(fullYear, monthIndex, day);
                            const stats = days[key];
                            const isSelected = selectedDay === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-label={dayLabelFormat.format(new Date(fullYear, monthIndex, day))}
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedDay(isSelected ? null : key)}
                                    style={heat(stats?.expense ?? 0, maxDay)}
                                    className={classNames(
                                        'relative min-h-14 sm:min-h-20 rounded-lg p-1 flex flex-col items-start justify-between text-start',
                                        'border hover:border-amber-400 transition-colors',
                                        {
                                            'border-transparent': !isSelected,
                                            'border-gray-900 dark:border-gray-100': isSelected,
                                            'ring-2 ring-blue-500 ring-inset': key === today,
                                            'bg-gray-50 dark:bg-gray-800/60': !stats?.expense,
                                        },
                                    )}>
                                    <span className="text-xs text-gray-600 dark:text-gray-300 tabular-nums">{day}</span>
                                    {stats?.expense ? (
                                        <span className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-gray-50 tabular-nums leading-tight">
                                            {compactCurrency.format(stats.expense)}
                                        </span>
                                    ) : null}
                                    {stats?.income > 0 && (
                                        <span
                                            title={keys.income}
                                            className="absolute top-1 end-1 size-1.5 rounded-full bg-green-500" />
                                    )}
                                </button>
                            );
                        }),
                        <div
                            key={`week-${weekIndex}`}
                            className="flex items-center justify-center px-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                            {weekTotal ? compactCurrency.format(weekTotal) : ''}
                        </div>,
                    ];
                })}
            </div>

            {selected ? (
                <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                    <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">
                            {dayLabelFormat.format(new Date(`${selectedDay}T00:00:00`))}
                        </h3>
                        <span className="font-black tabular-nums text-gray-900 dark:text-gray-100">
                            {formatCurrency(selected.expense)}
                        </span>
                    </header>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selectedItems.map((item) => (
                            <ExpenseRow
                                key={item.id}
                                item={item}
                                onHide={onHide}
                                onEdit={onEdit}
                                showDate={false}
                                leading={<span className="shrink-0">{Categories[item.category]?.emoji}</span>}
                            />
                        ))}
                    </ul>
                </section>
            ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {selectedDay ? keys.no_expenses_day : keys.pick_day}
                </p>
            )}
        </div>
    );
}

function YearGrid({ fullYear, days, onPickMonth }) {
    const months = useMemo(
        () => Array.from({ length: 12 }, (_, monthIndex) => {
            const weeks = monthWeeks(fullYear, monthIndex);
            const total = weeks.flat().reduce(
                (sum, day) => sum + (day ? days[dateKey(fullYear, monthIndex, day)]?.expense ?? 0 : 0),
                0,
            );
            return { monthIndex, weeks, total };
        }),
        [fullYear, days],
    );

    const maxDay = useMemo(
        () => Object.entries(days).reduce(
            (max, [key, stats]) => (key.startsWith(`${fullYear}-`) ? Math.max(max, stats.expense) : max),
            0,
        ),
        [days, fullYear],
    );

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {months.map(({ monthIndex, weeks, total }) => (
                <button
                    key={monthIndex}
                    type="button"
                    onClick={() => onPickMonth(pad(monthIndex + 1))}
                    className="flex flex-col gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-amber-400 rounded-xl p-2 shadow-sm text-start">
                    <div className="flex items-baseline justify-between gap-1 w-full">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(new Date(fullYear, monthIndex, 1))}
                        </span>
                        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                            {total ? compactCurrency.format(total) : ''}
                        </span>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 w-full">
                        {weeks.flat().map((day, i) => (
                            <span
                                key={i}
                                style={day ? heat(days[dateKey(fullYear, monthIndex, day)]?.expense ?? 0, maxDay) : undefined}
                                className={classNames('aspect-square rounded-sm', {
                                    'bg-gray-100 dark:bg-gray-800': day,
                                })} />
                        ))}
                    </div>
                </button>
            ))}
        </div>
    );
}

export function CalendarView({ items, year, month, onHide, onEdit, onPickMonth }) {
    const days = useMemo(() => groupByDay(items), [items]);

    if (!year) {
        return <p className="text-center text-gray-500 dark:text-gray-400 py-12">{keys.pick_year}</p>;
    }

    const fullYear = 2000 + Number(year);
    if (!month) return <YearGrid fullYear={fullYear} days={days} onPickMonth={onPickMonth} />;

    return (
        <MonthGrid
            key={`${fullYear}-${month}`}
            fullYear={fullYear}
            monthIndex={Number(month) - 1}
            days={days}
            onHide={onHide}
            onEdit={onEdit}
        />
    );
}
