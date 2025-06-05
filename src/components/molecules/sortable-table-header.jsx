import React from 'react';

export default function SortableTableHeader({ label, sortKey, sortCriteria, setSortCriteria }) {
    const isCurrentSortKey = sortCriteria[0] === sortKey;

    return (
        <th
            className='p-4 bg-stone-200'
            onClick={() => {
                const sortOrder = isCurrentSortKey && sortCriteria[1] === 'asc' ? 'desc' : 'asc';
                setSortCriteria([sortKey, sortOrder]);
                // add to query params
                const url = new URL(window.location.href);
                url.searchParams.set('sort', `${sortKey}:${sortOrder}`);
                window.history.pushState({}, '', url);
            }}>
            {label} {isCurrentSortKey ? (sortCriteria[1] === 'asc' ? '↑' : '↓') : ''}
        </th>
    );
}
