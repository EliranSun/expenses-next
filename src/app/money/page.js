import { MainNavBar } from "@/components/molecules/MainNavBar";
import { fetchExpenses } from "@/utils/db";
import { groupExpensesByMonth } from "@/utils";
import { format } from "date-fns";
import classNames from "classnames";
import { he } from "date-fns/locale";
import InfoDisplay from "@/components/molecules/info-display";
import { Categories } from "@/constants";

const Currency = ({ amount, label, col = false }) => {
    return (
        <div className={classNames("flex gap-2", {
            "flex-col": col
        })}>
            <span><b>{label}</b></span>
            <span>
                {Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(Math.abs(Math.round(amount / 10) * 10))}
            </span>
        </div>
    )
}

const TopExpenses = ({ expenses }) => {
    return (
        <div className="border p-2 my-4 space-y-2">
            <h3>Top expenses</h3>
            <div className="flex flex-col gap-2 text-xs">
                {expenses
                    .filter(expense => expense.category !== "income")
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 10)
                    .map((expense) => {
                        return <Currency
                            key={expense.id}
                            col
                            amount={expense.amount}
                            label={expense.name} />
                    })}
            </div>
        </div>
    )
}

export default async function MoneyPage({ searchParams }) {
    const { year, month, account } = await searchParams;
    const existingExpenses = await fetchExpenses({ year, month, account });
    const expensesByMonth = groupExpensesByMonth(existingExpenses);

    const years = Object.keys(expensesByMonth).map(Number);
    if (years.length === 0) return null;

    const latestYearNum = Math.max(...years);
    const latestYear = String(latestYearNum);

    const monthsObj = expensesByMonth[latestYear] ?? {};
    const monthKeys = Object.keys(monthsObj).map(Number);
    if (monthKeys.length === 0) return null;

    const latestMonthNum = Math.max(...monthKeys);
    const latestMonth = String(latestMonthNum);

    const data = monthsObj[latestMonth];

    console.log({ 'data.categoryTotals': data.categoryTotals });

    return (
        <div className="p-4" dir="rtl">
            <MainNavBar />
            <div className="">
                <div key={latestYear}>
                    <div className="flex gap-2">
                        <div
                            className="w-full flex flex-col font-mono space-y-8 my-8"
                            key={`${latestYear}-${latestMonth}`}>
                            <h2 className="text-2xl text-center font-bold">
                                {format(new Date(latestYearNum, latestMonthNum), "LLL YYY", { locale: he })}
                            </h2>

                            <div className="flex md:flex-row flex-col gap-2">
                                <InfoDisplay
                                    amount={data.totalIncome}
                                    label="הכנסות"
                                    isVisible
                                    iconName="coins" />
                                <InfoDisplay
                                    amount={data.totalExpenses}
                                    label="הוצאות"
                                    isVisible
                                    iconName="shoppingCart" />
                                <InfoDisplay
                                    amount={data.total}
                                    label="שורה תחתונה"
                                    isVisible
                                    iconName="trendUp" />
                            </div>

                            {/* <Currency amount={data.totalIncome} label="הכנסה" />
                            <Currency amount={data.totalExpenses} label="הוצאה" />
                            <Currency amount={data.total} label="סה״כ" /> */}

                            <div className="flex flex-wrap gap-2">
                                {Object.entries(data.categoryTotals)
                                    .sort((a, b) => a[1] - b[1])
                                    .map(([category, amount]) => (
                                        <InfoDisplay
                                            key={category}
                                            amount={amount}
                                            label={category.slice(0, 9)}
                                            isVisible
                                            emoji={Categories[category].emoji} />
                                    ))}
                            </div>

                            <TopExpenses expenses={data.expenses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}