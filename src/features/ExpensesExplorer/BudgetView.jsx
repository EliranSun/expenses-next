'use client';

import { useMemo } from 'react';
import InfoDisplay from '@/components/molecules/info-display';
import { ExpensesTileData } from '@/components/organisms/ExpensesTileData';
import { getBudgetForMonth } from '@/constants/budget';
import { useBudgetOverrides } from '@/hooks/useBudgetOverrides';
import { groupExpensesByMonth } from '@/utils';
import keys from '@/app/he.json';
import { Currency } from './Currency';

const TopExpenses = ({ expenses }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
        <h3 className="font-bold">{keys.top_expenses}</h3>
        <div className="flex flex-col gap-2 text-xs">
            {expenses
                .filter((expense) => expense.category !== 'income')
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

const Hint = ({ children }) => (
    <p className="text-center text-gray-500 dark:text-gray-400 py-12">{children}</p>
);

// Budget vs. actual for one month. Accounts are already filtered in SQL by the
// shared account filter, so every row passed in counts (isPrivate=false).
export function BudgetView({ items, year, month, account }) {
    const { overrides } = useBudgetOverrides();
    const hasMonth = Boolean(year && month);

    const data = useMemo(() => {
        if (!hasMonth) return null;
        const byMonth = groupExpensesByMonth(items, false);
        return byMonth[2000 + Number(year)]?.[Number(month) - 1] ?? null;
    }, [items, year, month, hasMonth]);

    const budgetData = useMemo(
        () => getBudgetForMonth(overrides, year, month),
        [overrides, year, month],
    );

    if (!hasMonth) return <Hint>{keys.pick_month}</Hint>;
    if (!data) return <Hint>{keys.no_data}</Hint>;

    return (
        <div className="flex flex-col gap-6">
            {account !== 'private' && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    {keys.budget_private_note}
                </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <InfoDisplay
                    amount={data.totalIncome}
                    outOf={budgetData.totalIncome}
                    label={keys.income}
                    isVisible
                    iconName="coins" />
                <InfoDisplay
                    amount={data.totalExpenses}
                    outOf={budgetData.totalExpenses}
                    label={keys.expenses}
                    isVisible
                    iconName="shoppingCart" />
                <InfoDisplay
                    amount={data.total}
                    label={keys.bottom_line}
                    isVisible
                    outOf={budgetData.total}
                    isPositive={data.total > 0}
                    isNegative={data.total < 0}
                    iconName={data.total > 0 ? 'trendUp' : 'trendDown'} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <ExpensesTileData data={data} budgetData={budgetData} year={year} month={month} account={account || undefined} />
                </div>
                <div className="xl:sticky xl:top-4 xl:self-start">
                    <TopExpenses expenses={data.expenses} />
                </div>
            </div>
        </div>
    );
}
