'use client';

import { Suspense, useState } from 'react';
import Search from '@/features/Search';
import Table from '@/components/organisms/table';
import { Navbar } from '@/components/molecules/navbar';

export default function PlainSearchableTable({ items = [] }) {
    const [searchResults, setSearchResults] = useState(items);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Navbar />
            <Search items={items} onSearch={setSearchResults} />
            <Table rows={searchResults} />
        </Suspense>
    );
}