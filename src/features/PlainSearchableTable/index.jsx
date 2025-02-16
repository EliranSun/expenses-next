'use client';

import Search from '@/features/Search';
import Table from '@/components/organisms/table';
import { useState } from 'react';

export default function PlainSearchableTable({ items = [] }) {
    const [searchResults, setSearchResults] = useState(items);

    return (
        <>
            <Search items={items} onSearch={setSearchResults} />
            <Table rows={searchResults} />
        </>
    );
}