import { MainNavBar } from "@/components/molecules/MainNavBar";
import { fetchExpenses } from "@/utils/db";
import { groupExpensesByMonth } from "@/utils";
import { format, addMonths, subMonths } from "date-fns";
import classNames from "classnames";
import { he } from "date-fns/locale";
import InfoDisplay from "@/components/molecules/info-display";
import { ExpensesTileData } from "@/components/organisms/ExpensesTileData";
import Link from "next/link";

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
                    .slice(0, 20)
                    .map((expense) => {
                        return (
                            <Currency
                                key={expense.id}
                                col
                                amount={expense.amount}
                                label={expense.name} />
                        )
                    })}
            </div>
        </div>
    )
}

const getData = (expenses, targetYear, targetMonth) => {
    const expensesByMonth = groupExpensesByMonth(expenses);

    // Convert target year and month to the format used by groupExpensesByMonth
    const yearKey = 2000 + Number(targetYear); // Convert from 2-digit to 4-digit year
    const monthKey = Number(targetMonth) - 1; // Convert from 1-based to 0-based month

    const yearData = expensesByMonth[yearKey];
    if (!yearData) return null;

    return yearData[monthKey] || null;
}

export default async function MoneyPage({ searchParams }) {
    const defaultYear = new Date().getFullYear().toString().slice(2);
    const defaultMonth = new Date().getMonth() + 1; // Convert to 1-based month for URL params
    const { year = defaultYear, month = defaultMonth, account } = await searchParams;
    const existingExpenses = await fetchExpenses({
        year,
        account,
        month: Number(month) < 10 ? `0${Number(month)}` : Number(month),
    });

    const data = getData(existingExpenses, year, month);

    // Convert 1-based month to 0-based for Date constructor
    const currentDate = new Date(2000 + Number(year), Number(month) - 1);
    const nextDate = addMonths(currentDate, 1);
    const prevDate = subMonths(currentDate, 1);

    return (
        <div className="p-4" dir="rtl">
            <MainNavBar />
            <div className="">
                <div key={year}>
                    <div className="flex gap-2">
                        <div
                            className="w-full flex flex-col  space-y-8 my-8"
                            key={`${year}-${month}`}>
                            <div className="flex items-center w-full justify-between">
                                <Link
                                    href={`/money?year=${format(prevDate, "yy")}&month=${prevDate.getMonth() + 1}`}
                                    className="bg-white rounded-full size-10 flex items-center justify-center">
                                    {"<"}
                                </Link>
                                <h2 className="text-2xl text-center font-bold">
                                    {format(currentDate, "LLLL yy", { locale: he })}
                                </h2>
                                <Link
                                    href={`/money?year=${format(nextDate, "yy")}&month=${nextDate.getMonth() + 1}`}
                                    className="bg-white rounded-full size-10 flex items-center justify-center">
                                    {">"}
                                </Link>
                            </div>

                            {data ? <>
                                <div className="flex flex-col gap-2 font-mono">
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
                                        isPositive={data.total > 0}
                                        isNegative={data.total < 0}
                                        iconName={data.total > 0 ? "trendUp" : "trendDown"} />
                                </div>

                                <ExpensesTileData data={data} />
                                <TopExpenses expenses={data.expenses} />
                            </> : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}