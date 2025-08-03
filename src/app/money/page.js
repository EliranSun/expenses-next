import { MainNavBar } from "@/components/molecules/MainNavBar";
import { fetchExpenses } from "@/utils/db";
import { groupExpensesByMonth } from "@/utils";
import { format } from "date-fns";
import { PrivateAccounts } from "@/constants/account";
import classNames from "classnames";
import { he } from "date-fns/locale";

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

    console.log({ expensesByMonth });
    return (
        <div className="p-8" dir="rtl">
            <MainNavBar />
            <div className="">
                {Object.entries(expensesByMonth).map(([year, months]) => {
                    return (
                        <div key={year}>
                            <h1 className="text-2xl font-bold">{year}</h1>
                            <div className="flex gap-2">
                                {Object
                                    .entries(months)
                                    .map(([month, data]) => {
                                        return (
                                            <div className="w-full border p-2 flex flex-col font-mono" key={`${year}-${month}`}>
                                                <h2 className="text-lg font-bold">{format(new Date(year, month), "LLL", { locale: he })}</h2>
                                                <Currency amount={data.totalIncome} label="הכנסה" />
                                                <Currency amount={data.totalExpenses} label="הוצאה" />
                                                <Currency amount={data.total} label="סכהכל" />
                                                <TopExpenses expenses={data.expenses} />
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}