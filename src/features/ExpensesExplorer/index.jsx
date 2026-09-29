'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderBy } from 'lodash';
import { HomepageFilterSheet } from '@/components/organisms/HomepageFilterSheet';
import { HomepageFilterControls } from '@/components/organisms/HomepageFilterControls';
import { EditExpenseSheet } from '@/components/organisms/EditExpenseSheet';
import { buildSearchParams } from '@/components/molecules/navbar';
import { categoryHref } from '@/utils/categoryRange';
import { formatCurrency } from './ExpenseRow';
import { ListView } from './ListView';
import { ColumnsView } from './ColumnsView';
import { CalendarView } from './CalendarView';
import { BudgetView } from './BudgetView';
import { ViewSwitcher, VIEWS } from './ViewSwitcher';
import { MonthStepper } from './MonthStepper';

const VALID_SORT_FIELDS = ['amount', 'date'];
const VALID_SORT_DIRS = ['asc', 'desc'];
const VALID_VIEWS = VIEWS.map(({ id }) => id);
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

const getCategoricalData = (expenses = []) => {
    const Categories = {};
    let totalAmount = 0;
    let incomeAmount = 0;
    let expenseAmount = 0;

    expenses.forEach(item => {
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
    })

    return { Categories, totalAmount, incomeAmount, expenseAmount };
}

// One page, several views of the same month. Every view reads `visibleItems`,
// so search, the URL filters (account/year/month/category) and tap-to-hide
// apply to all of them alike.
function ExpensesExplorerInner({
    items = [],
    updateExpense,
    deleteExpense,
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
    const [searchResults, setSearchResults] = useState(items);
    const [idsToFilter, setIdsToFilter] = useState([]);
    // Navbar clicks (year/month/account/category) trigger router.push and a
    // server refetch. Wrapping that in a transition gives us isPending so we
    // can dim the content immediately and signal that something is happening.
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

    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';
    const account = searchParams.get('account') || '';

    const selectedCategories = useMemo(() => {
        const raw = searchParams.get('category');
        return raw ? raw.split(',') : [];
    }, [searchParams]);

    const visibleItems = useMemo(() => searchResults.filter((item) =>
        !idsToFilter.includes(item.id) &&
        (selectedCategories.length === 0 || selectedCategories.includes(item.category))
    ), [searchResults, idsToFilter, selectedCategories]);

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

    // Server-side filters (year/month/account) go through router.push so the
    // page refetches; buildSearchParams keeps sort/view/category intact.
    const navigate = useCallback((updates) => {
        startUrlTransition(() =>
            router.push(`${window.location.pathname}?${buildSearchParams(updates)}`));
    }, [router]);

    const categoricalData = useMemo(() => getCategoricalData(visibleItems), [visibleItems]);

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

    const hideItem = useCallback((id) => setIdsToFilter((prev) => [...prev, id]), []);

    const renderView = () => {
        switch (viewMode) {
            case 'columns':
                return <ColumnsView sortedCategories={sortedCategories} trendHref={trendHref} onHide={hideItem} onEdit={setEditingId} />;
            case 'calendar':
                return (
                    <CalendarView
                        items={visibleItems}
                        year={year}
                        month={month}
                        onHide={hideItem}
                        onEdit={setEditingId}
                        onPickMonth={(picked) => navigate({ month: picked })}
                    />
                );
            case 'budget':
                return <BudgetView items={visibleItems} year={year} month={month} account={account} />;
            default:
                return <ListView sortedCategories={sortedCategories} trendHref={trendHref} onHide={hideItem} onEdit={setEditingId} />;
        }
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto">
            <div className="md:hidden">
                <HomepageFilterSheet
                    searchItems={items}
                    onSearch={setSearchResults}
                    sortCriteria={sortCriteria}
                    setSortCriteria={setSortCriteria}
                    onUrlChange={startUrlTransition}
                />
            </div>
            <div className="md:flex md:flex-col lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
                <aside className="hidden md:block mb-4 lg:mb-0 lg:order-last lg:col-span-1 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                    <HomepageFilterControls
                        searchItems={items}
                        onSearch={setSearchResults}
                        sortCriteria={sortCriteria}
                        setSortCriteria={setSortCriteria}
                        onUrlChange={startUrlTransition}
                    />
                </aside>
                <div className="min-w-0 lg:col-span-2">
                    <div dir="rtl" className="flex items-center justify-between gap-2 flex-wrap">
                        <ViewSwitcher value={viewMode} onChange={setViewMode} />
                        <MonthStepper year={year} month={month} onNavigate={navigate} />
                    </div>
                    {viewMode !== 'budget' && (
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
                    )}
                    {viewMode === 'budget' && <div className="h-6" />}
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
                        {renderView()}
                    </div>
                </div>
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

export default function ExpensesExplorer(props) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExpensesExplorerInner {...props} />
        </Suspense>
    );
}
