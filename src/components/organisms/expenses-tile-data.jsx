'use client';

import InfoDisplay from "../molecules/info-display";
import { Categories } from "@/constants";

export const ExpensesTileData = ({ data, budgetData }) => {
    return (
        <>
            <div className="flex flex-wrap gap-2 font-mono">
                {Object.entries(data.categoryTotals)
                    .sort((a, b) => a[1] - b[1])
                    .map(([category, amount]) => (
                        <InfoDisplay
                            key={category}
                            amount={amount}
                            outOf={budgetData.categoryTotals[category]}
                            label={category}
                            isVisible
                            round
                            emoji={Categories[category]?.emoji} />
                    ))}
            </div>
        </>
    );
}