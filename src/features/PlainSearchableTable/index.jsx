'use client';

import { Suspense, useState, useEffect } from 'react';
import Search from '@/features/Search';
import Table from '@/components/organisms/table';
import { Navbar } from '@/components/molecules/navbar';

export default function PlainSearchableTable({ items = [], updateCategory, updateNote, year, month }) {
    const [searchResults, setSearchResults] = useState(items);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='w-full flex flex-col md:flex-row-reverse gap-8 md:m-4 overflow-hidden'>
                <div className='w-full md:w-1/4 order-last md:order-first'>
                    <Navbar />
                </div>
                <div className="px-0 w-full md:w-3/4 space-y-8 my-4">
                    <Search items={items} onSearch={setSearchResults} />
                    <Table
                        year={year}
                        month={month}
                        rows={searchResults}
                        updateCategory={updateCategory}
                        updateNote={updateNote} />
                </div>
            </div>
        </Suspense>
    );
}