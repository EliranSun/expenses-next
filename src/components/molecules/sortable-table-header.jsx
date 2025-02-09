import React from 'react';

export default function SortableTableHeader({ label, sortKey, sortCriteria, setSortCriteria }) {
    const isCurrentSortKey = sortCriteria[0] === sortKey;

    return (
        <th onClick={() => {
            const sortOrder = isCurrentSortKey && sortCriteria[1] === 'asc' ? 'desc' : 'asc';
            console.log([sortKey, sortOrder]);
            setSortCriteria([sortKey, sortOrder]);
        }}>
            {label} {isCurrentSortKey ? (sortCriteria[1] === 'asc' ? '↑' : '↓') : ''}
        </th>
    );
}
