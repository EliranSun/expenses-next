'use client';

import { Suspense, useState, useEffect } from 'react';
import Search from '@/features/Search';
import Table from '@/components/organisms/table';
import { Navbar } from '@/components/molecules/navbar';

export default function PlainSearchableTable({ items = [], updateCategory, updateNote }) {
    const [searchResults, setSearchResults] = useState(items);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='w-full flex flex-col md:flex-row-reverse gap-8 m-4 overflow-hidden'>
                <div className='w-full md:w-1/4'>
                    <Navbar />
                </div>
                <div className="px-4 md:px-0w-full md:w-3/4 space-y-8">
                    <Search items={items} onSearch={setSearchResults} />
                    <Table rows={searchResults} updateCategory={updateCategory} updateNote={updateNote} />
                </div>
            </div>
        </Suspense>
    );
}