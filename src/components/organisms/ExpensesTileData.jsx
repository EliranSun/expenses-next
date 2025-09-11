'use client';

// import { useSort } from "@/hooks/useSort";
// import { SortButtons } from "./SortButtons";
import InfoDisplay from "../molecules/info-display";
import { Categories } from "@/constants";

export const ExpensesTileData = ({ data }) => {
    // const { filteredData, sortCriteria, setSortCriteria } = useSort(data.expenses);

    return (
        <>
            {/* <SortButtons onSort={setSortCriteria} sortCriteria={sortCriteria} /> */}
            <div className="flex flex-wrap gap-2 font-mono">
                {Object.entries(data.categoryTotals)
                    .sort((a, b) => a[1] - b[1])
                    .map(([category, amount]) => (
                        <InfoDisplay
                            key={category}
                            amount={amount}
                            label={category}
                            isVisible
                            round
                            emoji={Categories[category]?.emoji} />
                    ))}
            </div>
        </>
    );
}