"use client";

import { useMemo } from "react";
import InfoDisplay from "@/components/molecules/info-display";
import { ExpensesTileData } from "@/components/organisms/ExpensesTileData";
import { getBudgetForMonth } from "@/constants/budget";
import { useBudgetOverrides } from "@/hooks/useBudgetOverrides";
import { Currency } from "./Currency";

const TopExpenses = ({ expenses }) => (
    <div className="border p-2 space-y-2">
        <h3>Top expenses</h3>
        <div className="flex flex-col gap-2 text-xs">
            {expenses
                .filter((expense) => expense.category !== "income")
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 20)
                .map((expense) => (
                    <Currency
                        key={expense.id}
                        col
                        amount={expense.amount}
                        label={expense.name} />
                ))}
        </div>
    </div>
);

export const MoneyClientSections = ({ data, year, month }) => {
    const { overrides } = useBudgetOverrides();
    const budgetData = useMemo(
        () => getBudgetForMonth(overrides, year, month),
        [overrides, year, month],
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono lg:col-span-12">
                <InfoDisplay
                    amount={data.totalIncome}
                    outOf={budgetData.totalIncome}
                    label="הכנסות"
                    isVisible
                    iconName="coins" />
                <InfoDisplay
                    amount={data.totalExpenses}
                    outOf={budgetData.totalExpenses}
                    label="הוצאות"
                    isVisible
                    iconName="shoppingCart" />
                <InfoDisplay
                    amount={data.total}
                    label="שורה תחתונה"
                    isVisible
                    outOf={budgetData.total}
                    isPositive={data.total > 0}
                    isNegative={data.total < 0}
                    iconName={data.total > 0 ? "trendUp" : "trendDown"} />
            </div>

            <div className="lg:col-span-8">
                <ExpensesTileData data={data} budgetData={budgetData} />
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
                <TopExpenses expenses={data.expenses} />
            </div>
        </>
    );
};
