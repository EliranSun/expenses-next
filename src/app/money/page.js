import { MainNavBar } from "@/components/molecules/MainNavBar";
import { fetchExpenses } from "@/utils/db";
import { groupExpensesByMonth } from "@/utils";
import { format, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { MoneyClientSections } from "./MoneyClientSections";

const getData = (expenses, targetYear, targetMonth) => {
    const expensesByMonth = groupExpensesByMonth(expenses);

    const yearKey = 2000 + Number(targetYear);
    const monthKey = Number(targetMonth) - 1;

    const yearData = expensesByMonth[yearKey];
    if (!yearData) return null;

    return yearData[monthKey] || null;
};

export default async function MoneyPage({ searchParams }) {
    const defaultYear = new Date().getFullYear().toString().slice(2);
    const defaultMonth = new Date().getMonth() + 1;
    const { year = defaultYear, month = defaultMonth, account } = await searchParams;
    const existingExpenses = await fetchExpenses({
        year,
        account,
        month: Number(month) < 10 ? `0${Number(month)}` : Number(month),
    });

    const data = getData(existingExpenses, year, month);

    const currentDate = new Date(2000 + Number(year), Number(month) - 1);
    const nextDate = addMonths(currentDate, 1);
    const prevDate = subMonths(currentDate, 1);

    return (
        <div className="p-4 max-w-screen-2xl mx-auto" dir="rtl">
            <MainNavBar />
            <div key={year}>
                <div
                    className="w-full my-8"
                    key={`${year}-${month}`}>
                    <div className="sticky top-0 z-10 py-4 flex items-center w-full justify-between">
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

                    {data ? (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 mt-6">
                            <MoneyClientSections data={data} year={year} month={month} />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
