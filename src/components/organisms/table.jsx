'use client';

import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useRef, useMemo, useState, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { Budget } from "@/constants/budget";
import InfoDisplay from "../molecules/info-display";
import { orderBy } from "lodash";
import SortableTableHeader from "../molecules/sortable-table-header";
import { PrivateAccounts, SharedAccount, WifeAccount } from "@/constants/account";
import { Inter } from 'next/font/google';
import Search from "@/features/Search";
import { CalendarIcon, CoinsIcon, CopyRight, PersonIcon, ShoppingCartIcon, TrendDownIcon, TrendUpIcon, UsersIcon } from "@phosphor-icons/react";
import { Categories } from "@/constants";
import classNames from "classnames";

const interFont = Inter({
    subsets: ["latin"],
    weight: ["400", "700"],
});

const formatAmount = amount => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);
const Months = {
    0: "ינואר",
    1: "פברואר",
    2: "מרץ",
    3: "אפריל",
    4: "מאי",
    5: "יוני",
    6: "יולי",
    7: "אוגוסט",
    8: "ספטמבר",
    9: "אוקטובר",
    10: "נובמבר",
    11: "דצמבר",
};

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
    const [selectedCategories, setSelectedCategories] = useState([]);
    const tableRef = useRef(null);
    const query = useSearchParams();
    const [account, setAccount] = useState(query.get("account"));
    const categories = query.get("category") ? query.get("category").split(",") : [];
    const querySort = query.get("sort");

    const [rowIdsToFilter, setRowIdsToFilter] = useState([]);
    const [sortCriteria, setSortCriteria] = useState(querySort ? querySort.split(":") : ["date", "asc"]);
    const temporalBudget = useMemo(() => Budget[year]?.[month]?.[account] || 0, [year, month, account]);

    const budget = useMemo(() => {
        if (!temporalBudget) return 0;

        return Object.keys(temporalBudget).reduce((acc, key) => {
            if (key === "income") return acc;

            if (categories.length > 0 ? categories.includes(key) : true) {
                acc += temporalBudget[key];
            }
            return acc;
        }, 0);
    }, [year, month, categories, temporalBudget]);

    const filteredRows = useMemo(() => {
        const foo = rows.filter((row) => {
            if (rowIdsToFilter.includes(row.id)) {
                return false;
            }

            let accountMatch = true;
            if (account) {
                if (account === "private") {
                    accountMatch = PrivateAccounts.includes(row.account);
                } else if (account === "shared") {
                    accountMatch = SharedAccount.includes(row.account);
                } else if (account === "wife") {
                    accountMatch = WifeAccount.includes(row.account);
                } else {
                    // all
                    accountMatch = true;
                }
            }

            let categoryMatch = false;

            if (categories.length > 0) {
                if (row.category) categoryMatch = categories.includes(row.category);
            } else {
                // return all if no category selected
                categoryMatch = true;
            }

            if (selectedCategories.length > 0) {
                if (row.category) categoryMatch = selectedCategories.includes(row.category);
            } else {
                // return all if no category selected
                categoryMatch = true;
            }

            return accountMatch && categoryMatch;
        });

        return orderBy(foo, sortCriteria[0], sortCriteria[1]);
    }, [rows, account, categories, rowIdsToFilter, sortCriteria]);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);

    // useKeyboardControl(tableRef);

    const showIncome = categories.length === 0 || categories.includes("income");

    const expensesByMonth = useMemo(() => {
        let temp = {};
        filteredRows.forEach(expense => {
            const date = new Date(expense.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();

            const amount = expense.category === "income"
                ? expense.amount < 0 // some income is negative, like refunds
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

    console.log({ expensesByMonth });

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
                            setSortCriteria(["amount", sortCriteria[1] === "asc" ? "desc" : "asc"]);
                        }}>
                        <CoinsIcon size={24} />
                        {sortCriteria[0] === "asc" ? "↑" : "↓"}
                    </button>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => {
                            setSortCriteria(["date", sortCriteria[1] === "asc" ? "desc" : "asc"]);
                        }}>
                        <CalendarIcon size={24} />
                        {sortCriteria[1] === "asc" ? "↑" : "↓"}
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                        onClick={() => {
                            setAccount(account === "private" ? "shared" : "private");
                        }}>
                        {account === "private" ? <PersonIcon size={24} /> : <UsersIcon size={24} />}
                        {/* {account === "private" ? "Private" : "Shared"} */}
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
                            deleteExpense={(id) => {
                                console.log(`Deleting ID ${id}`)
                                deleteExpense(id);
                                setRowIdsToFilter([...rowIdsToFilter, id]);
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