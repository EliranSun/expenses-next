'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import { HomepageFilterSheet } from '@/components/organisms/HomepageFilterSheet';
import { HomepageFilterControls } from '@/components/organisms/HomepageFilterControls';
import { Categories } from '@/constants';

const VALID_SORT_FIELDS = ['amount', 'date'];
const VALID_SORT_DIRS = ['asc', 'desc'];
const VALID_VIEWS = ['columns', 'list'];
const DEFAULT_SORT_FIELD = 'amount';
const DEFAULT_SORT_DIR = 'desc';
const DEFAULT_VIEW = 'columns';

const pickValid = (value, valids, fallback) =>
    valids.includes(value) ? value : fallback;

// Updates URL params without triggering a Next.js navigation / server refetch.
// Sort/dir/view are purely client-side display state; we still mirror them to
// the URL so the values persist across reloads and remain shareable.
const writeUrlParams = (updates) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });
    window.history.replaceState(null, '', url.toString());
};

const getCategoricalData = (expenses = [], selectedCategories = [], idsToFilter = []) => {
    const Categories = {};
    let totalAmount = 0;

    expenses.forEach(item => {
        const isFiltered = idsToFilter.includes(item.id);
        const matchesCategory =
            selectedCategories.length === 0 || selectedCategories.includes(item.category);

        if (!isFiltered && matchesCategory) {
            item.category === "income"
                ? totalAmount += item.amount
                : totalAmount -= item.amount;

            Categories[item.category] = [
                ...(Categories[item.category] || []),
                item,
            ];
        }
    })

    return { Categories, totalAmount };
}

const formatCurrency = amount =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);

const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
};

function PlainSearchableTableInner({
    items = [],
}) {
    const searchParams = useSearchParams();
    const [searchResults, setSearchResults] = useState(items);
    const [idsToFilter, setIdsToFilter] = useState([]);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    // Navbar clicks (year/month/account/category) trigger router.push and a
    // server refetch. Wrapping that in a transition gives us isPending so we
    // can dim the table immediately and signal that something is happening.
    const [isPending, startUrlTransition] = useTransition();

    // Sort/view live in local state so changes don't trigger a server re-render
    // (and therefore don't re-run fetchExpenses). The URL is synced via
    // window.history.replaceState below so reloads still see the chosen values.
    const [sortField, setSortField] = useState(() =>
        pickValid(searchParams.get('sort'), VALID_SORT_FIELDS, DEFAULT_SORT_FIELD)
    );
    const [sortDir, setSortDir] = useState(() =>
        pickValid(searchParams.get('dir'), VALID_SORT_DIRS, DEFAULT_SORT_DIR)
    );
    const [viewMode, setViewModeState] = useState(() =>
        pickValid(searchParams.get('view'), VALID_VIEWS, DEFAULT_VIEW)
    );

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    const selectedCategories = useMemo(() => {
        const raw = searchParams.get('category');
        return raw ? raw.split(',') : [];
    }, [searchParams]);

    const sortCriteria = useMemo(() => [sortField, sortDir], [sortField, sortDir]);

    const setSortCriteria = useCallback(([field, direction]) => {
        setSortField(field);
        setSortDir(direction);
        writeUrlParams({
            sort: field === DEFAULT_SORT_FIELD ? null : field,
            dir: direction === DEFAULT_SORT_DIR ? null : direction,
        });
    }, []);

    const setViewMode = useCallback((mode) => {
        setViewModeState(mode);
        writeUrlParams({ view: mode === DEFAULT_VIEW ? null : mode });
    }, []);

    const categoricalData = useMemo(
        () => getCategoricalData(searchResults, selectedCategories, idsToFilter),
        [searchResults, selectedCategories, idsToFilter]
    );

    const sortedCategories = useMemo(() => orderBy(
        Object.entries(categoricalData.Categories).map(([key, categoryItems]) => {
            const total = categoryItems.reduce((prev, curr) => prev + curr.amount, 0);
            const timestamps = categoryItems.map((i) => i.timestamp ?? new Date(i.date).getTime());
            const latest = timestamps.length ? Math.max(...timestamps) : 0;
            const earliest = timestamps.length ? Math.min(...timestamps) : 0;
            const sortedItems = orderBy(categoryItems, [sortField], [sortDir]);
            return { key, categoryItems, sortedItems, total, latest, earliest };
        }),
        [(c) => {
            if (sortField === 'amount') return c.total;
            return sortDir === 'asc' ? c.earliest : c.latest;
        }],
        [sortDir]
    ), [categoricalData.Categories, sortField, sortDir]);

    const toggleCategory = useCallback((key) =>
        setCollapsedCategories((prev) => ({ ...prev, [key]: !prev[key] })), []);

    const renderColumns = () => (
        <div className="flex gap-4 overflow-x-auto">
            {sortedCategories.map(({ key, sortedItems, total }) => {
                return (
                    <div key={key} className='min-w-52 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm'>
                        <h2 className='font-bold text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-gray-700'>{key}</h2>
                        <ul className="max-h-96 overflow-y-auto flex-1 mt-2">
                            {sortedItems.map(item =>
                                <li
                                    onClick={() => setIdsToFilter(prev => [...prev, item.id])}
                                    className='bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 my-1 p-2 shadow-sm rounded flex flex-col cursor-pointer'
                                    key={item.id}>
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
                )
            })}
        </div>
    );

    const renderList = () => (
        <div className="flex flex-col gap-2">
            {sortedCategories.map(({ key, sortedItems, total }) => {
                const meta = Categories[key];
                const isCollapsed = collapsedCategories[key];
                return (
                    <section
                        key={key}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleCategory(key)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                            {isCollapsed
                                ? <CaretRightIcon size={14} className="shrink-0 text-gray-500" />
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
                        {!isCollapsed && (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-700">
                                {sortedItems.map((item) => (
                                    <li
                                        key={item.id}
                                        onClick={() => setIdsToFilter((prev) => [...prev, item.id])}
                                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
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
                                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                                            {formatShortDate(item.date)}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums shrink-0 text-right min-w-[4rem]">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );

    return (
        <div className="w-full max-w-screen-xl mx-auto">
            <div className="md:hidden">
                <HomepageFilterSheet
                    searchItems={items}
                    onSearch={setSearchResults}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onUrlChange={startUrlTransition}
                />
            </div>
            <div className="hidden md:block mb-4">
                <HomepageFilterControls
                    searchItems={items}
                    onSearch={setSearchResults}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onUrlChange={startUrlTransition}
                />
            </div>
            <div className='flex items-center gap-3 my-4'>
                <span className='text-xl font-black text-gray-900 dark:text-gray-100'>
                    {formatCurrency(categoricalData.totalAmount)}
                </span>
                {isPending && (
                    <span
                        aria-label="Loading"
                        className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-amber-500 animate-spin"
                    />
                )}
            </div>
            <div
                aria-busy={isPending}
                className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
                {viewMode === 'list' ? renderList() : renderColumns()}
            </div>
        </div>
    );
}

export default function PlainSearchableTable(props) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlainSearchableTableInner {...props} />
        </Suspense>
    );
}
