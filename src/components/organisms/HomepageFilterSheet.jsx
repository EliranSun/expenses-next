'use client';

import { useSearchParams } from 'next/navigation';
import { BottomSheet } from '../molecules/BottomSheet';
import { HomepageFilterControls } from './HomepageFilterControls';

export function HomepageFilterSheet({
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
    viewMode,
    setViewMode,
}) {
    const searchParams = useSearchParams();
    const hasActiveFilter = Boolean(
        searchParams.get('account') ||
            searchParams.get('category') ||
            searchParams.get('year') ||
            searchParams.get('month')
    );

    return (
        <BottomSheet hasIndicator={hasActiveFilter}>
            <HomepageFilterControls
                searchItems={searchItems}
                onSearch={onSearch}
                sortCriteria={sortCriteria}
                setSortCriteria={setSortCriteria}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
        </BottomSheet>
    );
}
