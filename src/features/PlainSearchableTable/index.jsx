'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';
import { CaretDownIcon, CaretLeftIcon, ChartLineIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { HomepageFilterSheet } from '@/components/organisms/HomepageFilterSheet';
import { HomepageFilterControls } from '@/components/organisms/HomepageFilterControls';
import { Categories } from '@/constants';
import { EditExpenseSheet } from '@/components/organisms/EditExpenseSheet';
import { categoryHref } from '@/utils/categoryRange';
import keys from '@/app/he.json';

const VALID_SORT_FIELDS = ['amount', 'date'];
const VALID_SORT_DIRS = ['asc', 'desc'];
const VALID_VIEWS = ['columns', 'list'];
const DEFAULT_SORT_FIELD = 'amount';
const DEFAULT_SORT_DIR = 'desc';
const DEFAULT_VIEW = 'list';
const VIEW_STORAGE_KEY = 'homepage-view';

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

const readStoredView = () => {
    try {
        return window.localStorage.getItem(VIEW_STORAGE_KEY);
    } catch {
        return null;
    }
};

const storeView = (mode) => {
    try {
        window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
        // Storage unavailable (private mode, blocked) - URL param still applies.
    }
};

const getCategoricalData = (expenses = [], selectedCategories = [], idsToFilter = []) => {
    const Categories = {};
    let totalAmount = 0;
    let incomeAmount = 0;
    let expenseAmount = 0;

    expenses.forEach(item => {
        const isFiltered = idsToFilter.includes(item.id);
        const matchesCategory =
            selectedCategories.length === 0 || selectedCategories.includes(item.category);

        if (!isFiltered && matchesCategory) {
            if (item.category === "income") {
                totalAmount += item.amount;
                incomeAmount += item.amount;
            } else {
                totalAmount -= item.amount;
                expenseAmount += item.amount;
            }

            Categories[item.category] = [
                ...(Categories[item.category] || []),
                item,
            ];
        }
    })

    return { Categories, totalAmount, incomeAmount, expenseAmount };
}

const formatCurrency = amount =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);

// Tapping a row hides it from the total; the pencil edits it instead.
function EditButton({ onClick, className = '' }) {
    return (
        <button
            type="button"
            aria-label="Edit"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-200 shrink-0 ${className}`}>
            <PencilSimpleIcon size={14} />
        </button>
    );
}

const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
};

function PlainSearchableTableInner({
    items = [],
    updateExpense,
    deleteExpense,
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
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

    // localStorage isn't available during SSR, so restore the saved view after
    // mount. An explicit ?view= in the URL wins over the stored preference.
    useEffect(() => {
        if (searchParams.get('view')) return;
        const stored = readStoredView();
        if (VALID_VIEWS.includes(stored)) setViewModeState(stored);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    const selectedCategories = useMemo(() => {
        const raw = searchParams.get('category');
        return raw ? raw.split(',') : [];
    }, [searchParams]);

    const trendHref = useCallback((category) => categoryHref({
        category,
        year: searchParams.get('year'),
        month: searchParams.get('month'),
        account: searchParams.get('account'),
    }), [searchParams]);

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
        storeView(mode);
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

    const editingExpense = useMemo(
        () => searchResults.find((item) => item.id === editingId) ?? null,
        [searchResults, editingId]
    );

    const refresh = useCallback(() => startUrlTransition(() => router.refresh()), [router]);

    const handleSaved = useCallback((updated) => {
        setSearchResults((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
        setEditingId(null);
        refresh();
    }, [refresh]);

    const handleDeleted = useCallback((id) => {
        setSearchResults((prev) => prev.filter((item) => item.id !== id));
        setEditingId(null);
        refresh();
    }, [refresh]);

    const toggleCategory = useCallback((key) =>
        setCollapsedCategories((prev) => ({ ...prev, [key]: !prev[key] })), []);

    const renderColumns = () => (
        <div dir="rtl" className="flex gap-4 overflow-x-auto">
            {sortedCategories.map(({ key, sortedItems, total }) => {
                return (
                    <div key={key} className='min-w-52 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm'>
                        <h2 className='font-bold text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200 dark:border-gray-700'>
                            <Link href={trendHref(key)} className='hover:text-blue-500'>{key}</Link>
                        </h2>
                        <ul className="max-h-96 overflow-y-auto flex-1 mt-2">
                            {sortedItems.map(item =>
                                <li
                                    onClick={() => setIdsToFilter(prev => [...prev, item.id])}
                                    className='relative bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 my-1 p-2 pl-7 shadow-sm rounded flex flex-col cursor-pointer'
                                    key={item.id}>
                                    <EditButton onClick={() => setEditingId(item.id)} className="absolute top-1 left-1" />
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
        <div dir="rtl" className="flex flex-col gap-2">
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
                                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-right">
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
                                className="p-2 ml-1 rounded text-gray-400 hover:text-blue-500 shrink-0">
                                <ChartLineIcon size={16} />
                            </Link>
                        </div>
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
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums shrink-0 text-left min-w-[4rem]">
                                            {formatCurrency(item.amount)}
                                        </span>
                                        <EditButton onClick={() => setEditingId(item.id)} />
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
            <div dir="rtl" className="my-6 flex flex-col items-start gap-1">
                <div className="flex gap-3 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    <span>הכנסות {formatCurrency(categoricalData.incomeAmount)}</span>
                    <span>הוצאות {formatCurrency(categoricalData.expenseAmount)}</span>
                </div>
                <span className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400">
                    שורה תחתונה
                </span>
                <span className="text-4xl font-black tabular-nums text-gray-900 dark:text-gray-100 font-[family-name:var(--font-geist-mono)]">
                    {formatCurrency(categoricalData.totalAmount)}
                </span>
            </div>
            {isPending && (
                <div
                    role="status"
                    aria-label="Loading"
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-gray-900/90 text-white rounded-full px-4 py-2 shadow-lg backdrop-blur-sm">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span className="text-sm">Loading…</span>
                </div>
            )}
            <div
                aria-busy={isPending}
                className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
                {viewMode === 'list' ? renderList() : renderColumns()}
            </div>
            <EditExpenseSheet
                expense={editingExpense}
                open={!!editingExpense}
                onClose={() => setEditingId(null)}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
                updateExpense={updateExpense}
                deleteExpense={deleteExpense}
            />
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
