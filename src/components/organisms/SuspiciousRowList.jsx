'use client';

import { useState } from 'react';
import { run } from '@/utils/action';
import { AccountName } from '@/constants/account';

const ISSUE_LABEL = {
    name: 'bad name',
    account: 'bad account',
    date: 'no date',
    amount: 'no amount',
    category: 'no category',
};

const formatField = (value) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string' && value.trim() === '') return '""';
    return String(value);
};

export function SuspiciousRowList({ rows: initialRows, deleteExpense }) {
    const [rows, setRows] = useState(initialRows);
    const [busyId, setBusyId] = useState(null);

    const handleDelete = async (id) => {
        if (!confirm('Delete this row?')) return;
        setBusyId(id);
        const res = await run(deleteExpense(id), { success: 'Deleted' });
        setBusyId(null);
        if (res?.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    };

    if (rows.length === 0) {
        return <div className="text-center text-gray-500 my-8">No suspicious rows.</div>;
    }

    return (
        <ul className="flex flex-col gap-2 max-w-screen-md mx-auto">
            {rows.map((row) => (
                <li
                    key={row.id}
                    className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                            <div className="flex gap-1 flex-wrap">
                                {row.issues.map((issue) => (
                                    <span
                                        key={issue}
                                        className="bg-red-100 text-red-800 rounded-full px-2 py-0.5 text-xs">
                                        {ISSUE_LABEL[issue] ?? issue}
                                    </span>
                                ))}
                            </div>
                            <dl className="text-sm font-mono break-all grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                                <dt className="text-gray-500">name</dt>
                                <dd>{formatField(row.name)}</dd>
                                <dt className="text-gray-500">amount</dt>
                                <dd>{formatField(row.amount)}</dd>
                                <dt className="text-gray-500">date</dt>
                                <dd>{formatField(row.date)}</dd>
                                <dt className="text-gray-500">account</dt>
                                <dd>
                                    {formatField(row.account)}
                                    {row.account && AccountName[row.account]?.translation
                                        ? ` (${AccountName[row.account].translation})`
                                        : ''}
                                </dd>
                                <dt className="text-gray-500">category</dt>
                                <dd>{formatField(row.category)}</dd>
                                <dt className="text-gray-500">id</dt>
                                <dd className="text-xs text-gray-500">{row.id}</dd>
                            </dl>
                        </div>
                        <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => handleDelete(row.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg shrink-0 disabled:bg-gray-300">
                            {busyId === row.id ? '…' : 'Delete'}
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
