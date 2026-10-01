'use client';

import { useSearchParams } from 'next/navigation';
import { BottomSheet } from '../molecules/BottomSheet';
import { HomepageFilterControls } from './HomepageFilterControls';

export function HomepageFilterSheet({
    search,
    sortCriteria,
    setSortCriteria,
    onUrlChange,
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
                search={search}
                sortCriteria={sortCriteria}
                setSortCriteria={setSortCriteria}
                onUrlChange={onUrlChange}
            />
        </BottomSheet>
    );
}
