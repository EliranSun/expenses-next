'use client';

import { Suspense, useState, useEffect } from 'react';
import Table from '@/components/organisms/table';

export default function PlainSearchableTable({
    items = [],
    updateCategory,
    deleteExpenses,
    updateNote,
    year,
    month
}) {
    const [searchResults, setSearchResults] = useState(items);

    useEffect(() => {
        setSearchResults(items);
    }, [items]);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className='max-w-screen-lg mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden'>
                <div className="px-0 w-full space-y-8 my-4">
                    <Table
                        year={year}
                        month={month}
                        rows={searchResults}
                        searchItems={items}
                        onSearch={setSearchResults}
                        updateCategory={updateCategory}
                        deleteExpenses={deleteExpenses}
                        updateNote={updateNote} />
                </div>
            </div>
        </Suspense>
    );
}