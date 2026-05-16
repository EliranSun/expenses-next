'use client';

import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useMemo, useState, Fragment } from "react";
import { Budget } from "@/constants/budget";
import InfoDisplay from "../molecules/info-display";
import { Inter } from 'next/font/google';
import Search from "@/features/Search";
import { CalendarIcon, CoinsIcon, CopyRight, PersonIcon, ShoppingCartIcon, TrendDownIcon, TrendUpIcon, UsersIcon } from "@phosphor-icons/react";
import { Categories } from "@/constants";
import classNames from "classnames";
import { run } from "@/utils/action";
import { useExpensesView } from "@/hooks/useExpensesView";
import { getBudget } from "@/utils/budget";

const interFont = Inter({
    subsets: ["latin"],
    weight: ["400", "700"],
});

export default function Table({
    rows = [],
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense,
    year,
    month,
    searchItems,
    onSearch
}) {
    const [rowIdsToFilter, setRowIdsToFilter] = useState([]);

    const { rows: filteredRows, filters, setFilters, sort, setSort } = useExpensesView(rows, rowIdsToFilter);
    const { account, selectedCategories, urlCategories } = filters;
    const { setAccount, setSelectedCategories } = setFilters;

    const budget = getBudget(year, month, account, urlCategories);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const showIncome = urlCategories.length === 0 || urlCategories.includes("income");

    const expensesByMonth = useMemo(() => {
        let temp = {};
        filteredRows.forEach(expense => {
            const date = new Date(expense.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();

            const amount = expense.category === "income"
                ? expense.amount < 0
                    ? expense.amount * -1
                    : expense.amount
                : -expense.amount;

            temp = {
                ...temp,
                [year]: {
                    ...(temp[year] || {}),
                    [month]: temp[year]?.[month]
                        ? temp[year]?.[month] + amount
                        : amount
                }
            }
        });

        return temp;
    }, [filteredRows]);

    return (
        <div className="flex justify-center flex-col md:flex-row-reverse gap-4">
            <div className="md:w-1/3 flex flex-col items-center gap-8">
                <h1 className={`text-3xl text-right font-bold ${interFont.className}`}>
                    {new Date(year, month - 1, 1).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "long"
                    })}<br />
                </h1>
                <div className="flex flex-col gap-2 text-3xl w-full" dir="ltr">
                    <InfoDisplay
                        amount={totalIncome}
                        round
                        label="Income"
                        isVisible={showIncome}
                        icon={<CoinsIcon size={32} />} />
                    <InfoDisplay
                        label="Expenses"
                        amount={totalExpenses}
                        round
                        icon={<ShoppingCartIcon size={32} />} />
                    <InfoDisplay
                        label="Bottom Line"
                        showColorIndication
                        round
                        isVisible={showIncome}
                        amount={totalIncome - totalExpenses}
                        percentage={Math.round((totalIncome - totalExpenses) / totalIncome * 100)}
                        icon={totalIncome - totalExpenses > 0
                            ? <TrendUpIcon size={32} />
                            : <TrendDownIcon size={32} />} />
                </div>

            </div>

            <div dir="rtl" className="w-full bg-white rounded-xl p-4 space-y-2 h-[80vh] overflow-auto">
                <Search items={searchItems} onSearch={onSearch} />
                <div className="flex gap-2">
                    <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => {
                            setSort(["amount", sort[1] === "asc" ? "desc" : "asc"]);
                        }}>
                        <CoinsIcon size={24} />
                        {sort[1] === "asc" ? "↑" : "↓"}
                    </button>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => {
                            setSort(["date", sort[1] === "asc" ? "desc" : "asc"]);
                        }}>
                        <CalendarIcon size={24} />
                        {sort[1] === "asc" ? "↑" : "↓"}
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => {
                            setAccount(account === "private" ? "shared" : "private");
                        }}>
                        {account === "private" ? <PersonIcon size={24} /> : <UsersIcon size={24} />}
                    </button>

                    <div className="flex gap-2 overflow-x-auto">
                        {Object.entries(Categories).map(([key, value]) => (
                            <button
                                key={key}
                                className={classNames({
                                    "border border-gray-300 px-4": true,
                                    "py-2 rounded-xl flex items-center gap-2": true,
                                    "bg-gray-300": selectedCategories.includes(key)
                                })}
                                onClick={() => {
                                    setSelectedCategories(selectedCategories.includes(key) ? selectedCategories.filter(category => category !== key) : [...selectedCategories, key]);
                                }}>
                                {value.emoji}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {filteredRows.map((row) => (
                        <TableRow
                            key={row.id || (row.name + row.amount + row.account + row.date)}
                            rowData={row}
                            updateCategory={updateCategory}
                            updateNote={updateNote}
                            updateDate={updateDate}
                            deleteExpense={async (id) => {
                                const res = await run(deleteExpense(id), { success: "Deleted" });
                                if (res?.ok) {
                                    setRowIdsToFilter([...rowIdsToFilter, id]);
                                }
                            }}
                            onRowClick={() => {
                                setRowIdsToFilter([...rowIdsToFilter, row.id]);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
