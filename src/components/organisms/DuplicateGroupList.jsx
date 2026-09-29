'use client';

import { useState } from 'react';
import { run } from '@/utils/action';
import { AccountName } from '@/constants/account';
import { CurrencyAmount } from '@/components/atoms/currency-amount';
import { formatDate } from '@/utils/formatDate';
import keys from '@/app/he.json';

const DuplicateRow = ({ row, busy, onKeep, onDelete }) => (
    <li className="flex justify-between items-center gap-3 py-2">
        <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 min-w-0 flex-1">
            <dt className="text-gray-500">{keys.account}</dt>
            <dd>
                {row.account}
                {AccountName[row.account]?.translation ? ` (${AccountName[row.account].translation})` : ''}
            </dd>
            <dt className="text-gray-500">{keys.category}</dt>
            <dd>{keys.categories[row.category] ?? row.category ?? '-'}</dd>
            {row.note ? (
                <>
                    <dt className="text-gray-500">{keys.note}</dt>
                    <dd className="break-words">{row.note}</dd>
                </>
            ) : null}
            <dt className="text-gray-500">id</dt>
            <dd className="text-xs text-gray-500 font-mono break-all">{row.id}</dd>
        </dl>
        <div className="flex flex-col gap-2 shrink-0">
            <button
                type="button"
                disabled={busy}
                onClick={onKeep}
                className="bg-black text-white px-3 py-2 rounded-lg text-sm disabled:bg-gray-300">
                {keys.keep_this}
            </button>
            <button
                type="button"
                disabled={busy}
                onClick={onDelete}
                className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm disabled:bg-gray-300">
                {keys.delete}
            </button>
        </div>
    </li>
);

export function DuplicateGroupList({ groups: initialGroups, deleteExpenses, dismissDuplicateGroup }) {
    const [groups, setGroups] = useState(initialGroups);
    const [busyKey, setBusyKey] = useState(null);

    const removeRows = (key, ids) => {
        setGroups((prev) => prev
            .map((g) => (g.key === key ? { ...g, rows: g.rows.filter((r) => !ids.includes(r.id)) } : g))
            .filter((g) => g.rows.length > 1));
    };

    const withBusy = async (key, fn) => {
        setBusyKey(key);
        try {
            await fn();
        } finally {
            setBusyKey(null);
        }
    };

    const handleKeep = (group, keepId) => {
        if (!confirm(keys.confirm_keep_this)) return;
        const ids = group.rows.filter((r) => r.id !== keepId).map((r) => r.id);
        return withBusy(group.key, async () => {
            const res = await run(deleteExpenses(ids), { success: `Deleted ${ids.length}` });
            if (res?.ok) removeRows(group.key, ids);
        });
    };

    const handleDelete = (group, id) => {
        if (!confirm(keys.confirm_delete)) return;
        return withBusy(group.key, async () => {
            const res = await run(deleteExpenses([id]), { success: 'Deleted' });
            if (res?.ok) removeRows(group.key, [id]);
        });
    };

    const handleDismiss = (group) => withBusy(group.key, async () => {
        const res = await run(dismissDuplicateGroup(group.rows.map((r) => r.id)), { success: 'Marked as not duplicate' });
        if (res?.ok) setGroups((prev) => prev.filter((g) => g.key !== group.key));
    });

    if (groups.length === 0) {
        return <div className="text-center text-gray-500 my-8">{keys.duplicates_empty}</div>;
    }

    return (
        <ul className="flex flex-col gap-3 max-w-screen-md mx-auto">
            {groups.map((group) => {
                const busy = busyKey === group.key;
                return (
                    <li
                        key={group.key}
                        data-testid="duplicate-group"
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold break-words">{group.name}</span>
                                <span className="text-sm text-gray-500">
                                    {formatDate(group.date)} · {group.rows.length}×
                                </span>
                            </div>
                            <CurrencyAmount amount={group.amount} />
                        </div>
                        <ul className="divide-y divide-gray-200 my-2">
                            {group.rows.map((row) => (
                                <DuplicateRow
                                    key={row.id}
                                    row={row}
                                    busy={busy}
                                    onKeep={() => handleKeep(group, row.id)}
                                    onDelete={() => handleDelete(group, row.id)}
                                />
                            ))}
                        </ul>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDismiss(group)}
                            className="w-full border border-gray-300 rounded-lg py-2 text-sm disabled:opacity-50">
                            {keys.not_duplicate}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
