'use client';

import { Suspense, useState, useEffect } from 'react';
import Table from '@/components/organisms/table';

export default function PlainSearchableTable({
    items = [],
    updateCategory,
    deleteExpense,
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
            <div className="px-0 w-full space-y-8 my-4">
                <Table
                    year={year}
                    month={month}
                    rows={searchResults}
                    searchItems={items}
                    onSearch={setSearchResults}
                    updateCategory={updateCategory}
                    deleteExpense={deleteExpense}
                    updateNote={updateNote}
                />
            </div>
        </Suspense>
    );
}