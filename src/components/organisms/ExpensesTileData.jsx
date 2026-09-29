'use client';

import Link from "next/link";
import InfoDisplay from "../molecules/info-display";
import { Categories } from "@/constants";
import { categoryHref } from "@/utils/categoryRange";

// The money page only counts private accounts (groupExpensesByMonth), so the
// category page opens with the same account filter.
export const ExpensesTileData = ({ data, budgetData, year, month }) => {
    return (
        <>
            <div className="flex flex-wrap gap-2 font-mono">
                {Object.entries(data.categoryTotals)
                    .sort((a, b) => a[1] - b[1])
                    .map(([category, amount]) => (
                        <Link
                            key={category}
                            href={categoryHref({ category, year, month, account: "private" })}
                            className="grow flex hover:opacity-80">
                            <InfoDisplay
                                amount={amount}
                                outOf={budgetData.categoryTotals[category]}
                                label={category}
                                isVisible
                                round
                                emoji={Categories[category]?.emoji} />
                        </Link>
                    ))}
            </div>
        </>
    );
}
