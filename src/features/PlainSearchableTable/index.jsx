'use client';

import { Suspense, useState, useEffect } from 'react';
import Search from '@/features/Search';
import Table from '@/components/organisms/table';
import { Navbar } from '@/components/molecules/navbar';

export default function PlainSearchableTable({ items = [] }) {
    const [searchResults, setSearchResults] = useState(items);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='flex flex-col md:flex-row-reverse gap-8 m-4 md:h-[95vh] overflow-hidden'>
                <div className='w-full md:w-1/3'>
                    <Navbar />
                </div>
                <div className="px-4 md:px-0w-full md:w-2/3 space-y-8">
                    <Search items={items} onSearch={setSearchResults} />
                    <Table rows={searchResults} />
                </div>
            </div>
        </Suspense>
    );
}