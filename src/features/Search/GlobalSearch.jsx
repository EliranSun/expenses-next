'use client';

import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Modal } from '@/components/molecules/Modal';
import { Categories } from '@/constants';
import { AccountName } from '@/constants/account';
import { EditButton, formatCurrency } from '@/features/ExpensesExplorer/ExpenseRow';
import keys from '@/app/he.json';
import { fetchSearch } from './fetchSearch';

const DEBOUNCE_MS = 250;
const LIMIT = 100;
const MIN_LENGTH = 2;
const CACHE_SIZE = 50;

const formatFullDate = (iso) => {
    const [yyyy, mm, dd] = iso.split('-');
    return `${dd}/${mm}/${yyyy.slice(2)}`;
};

// One character matches half the table; numbers are specific enough already.
const isSearchable = (term) => term.length >= MIN_LENGTH || /^\d+$/.test(term);

// Searches every expense in the DB (not just the loaded month) and lists the
// matches in a modal. Picking a row jumps to its month; the pencil edits it.
// Bump `version` after a mutation to drop cached results.
export function GlobalSearch({ onPick, onEdit, version = 0, search = fetchSearch }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef(new Map());

    useEffect(() => {
        cacheRef.current.clear();
    }, [version]);

    useEffect(() => {
        const term = query.trim();
        if (!open || !isSearchable(term)) {
            setResults([]);
            setLoading(false);
            return;
        }
        const cache = cacheRef.current;
        if (cache.has(term)) {
            setResults(cache.get(term));
            setLoading(false);
            return;
        }
        setLoading(true);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const rows = (await search(term, { limit: LIMIT, signal: controller.signal })) ?? [];
                if (controller.signal.aborted) return;
                cache.set(term, rows);
                if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
                setResults(rows);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('search failed:', error);
                setResults([]);
            }
            setLoading(false);
        }, DEBOUNCE_MS);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, open, version, search]);

    const close = () => setOpen(false);
    const term = query.trim();
    const searchable = isSearchable(term);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={keys.search_hint}
                className="border border-gray-300 bg-white dark:bg-gray-800 rounded-xl py-2 px-4 w-full flex items-center gap-2 text-start text-gray-500 dark:text-gray-400">
                <MagnifyingGlassIcon size={16} className="shrink-0" />
                <span className="truncate">{query || keys.search_all}</span>
            </button>
            <Modal open={open} onClose={close} title={keys.search_results}>
                <input
                    autoFocus
                    type="search"
                    aria-label={keys.search}
                    placeholder={keys.search_hint}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl py-2 px-4 w-full"
                />
                {!searchable && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{keys.search_type_more}</p>
                )}
                {searchable && loading && (
                    <p role="status" className="text-sm text-gray-500 dark:text-gray-400">{keys.loading}</p>
                )}
                {searchable && !loading && results.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{keys.search_no_results}</p>
                )}
                {searchable && results.length > 0 && (
                    <>
                        {results.length >= LIMIT && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {keys.search_limit.replace('{count}', LIMIT)}
                            </p>
                        )}
                        <ul
                            aria-busy={loading}
                            className={`divide-y divide-gray-100 dark:divide-gray-800 ${loading ? 'opacity-60' : ''}`}>
                            {results.map((item) => (
                                <li key={item.id} className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            close();
                                            onPick(item);
                                        }}
                                        title={keys.go_to_month}
                                        className="flex-1 min-w-0 flex items-center gap-2 py-2 px-1 text-start rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <span className="shrink-0" aria-hidden="true">
                                            {Categories[item.category]?.emoji ?? '❔'}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm text-gray-800 dark:text-gray-100 truncate leading-tight">
                                                {item.name}
                                            </span>
                                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                                                {[AccountName[item.account]?.translation ?? item.account, item.note]
                                                    .filter(Boolean).join(' · ')}
                                            </span>
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                                            {formatFullDate(item.date)}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums shrink-0 text-end min-w-[4rem]">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </button>
                                    <EditButton
                                        onClick={() => {
                                            close();
                                            onEdit(item);
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Modal>
        </>
    );
}
