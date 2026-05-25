'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Navbar } from '@/components/molecules/navbar';

function MoneyFiltersInner() {
    const searchParams = useSearchParams();
    const hasActiveFilter = Boolean(
        searchParams.get('account') ||
            searchParams.get('category') ||
            searchParams.get('year') ||
            searchParams.get('month')
    );

    return (
        <>
            <div className="md:hidden">
                <BottomSheet hasIndicator={hasActiveFilter}>
                    <Navbar />
                </BottomSheet>
            </div>
            <div
                dir="ltr"
                className="hidden md:block mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                <Navbar />
            </div>
        </>
    );
}

export function MoneyFilters() {
    return (
        <Suspense fallback={null}>
            <MoneyFiltersInner />
        </Suspense>
    );
}
