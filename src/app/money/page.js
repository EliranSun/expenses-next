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

    return (
        <div className="p-8" dir="rtl">
            <MainNavBar />
              <div className="">
    <div key={latestYear}>
      <h1 className="text-2xl font-bold">{latestYear}</h1>

      <div className="flex gap-2">
        <div className="w-full border p-2 flex flex-col font-mono" key={`${latestYear}-${latestMonth}`}>
          <h2 className="text-lg font-bold">
            {format(new Date(latestYearNum, latestMonthNum), "LLL", { locale: he })}
          </h2>

          <Currency amount={data.totalIncome} label="הכנסה" />
          <Currency amount={data.totalExpenses} label="הוצאה" />
          <Currency amount={data.total} label="סה״כ" />

          <div className="flex flex-col gap-2 border p-2">
            {Object.entries(data.categoryTotals)
              .sort((a, b) => a[1] - b[1])
              .map(([category, amount]) => (
                <Currency key={category} amount={amount} label={category.slice(0, 4)} />
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