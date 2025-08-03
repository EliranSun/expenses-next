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
    deleteExpense
}) {
    const tableRef = useRef(null);
    const query = useSearchParams();
    const account = query.get("account");
    const categories = query.get("category") ? query.get("category").split(",") : [];
    const querySort = query.get("sort");
    const year = query.get("year");
    const month = query.get("month");

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

            return accountMatch && categoryMatch;
        });

        return orderBy(foo, sortCriteria[0], sortCriteria[1]);
    }, [rows, account, categories, rowIdsToFilter, sortCriteria]);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);

    // useKeyboardControl(tableRef);

    const showFoo = categories.length === 0 || categories.includes("income");

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
        <div>
            <div className={`w-full flex flex-col md:flex-row justify-between`} dir="rtl">
                <div className="relative flex flex-col border-2">
                    <span className="absolute -top-6 right-0">
                        {keys.actual_title}
                    </span>
                    <div className="grid grid-cols-4 gap-1 border-2 ">
                        {showFoo && <InfoDisplay label={keys.total_income} amount={totalIncome} />}
                        <InfoDisplay label={keys.total_expenses} amount={totalExpenses} />
                        {showFoo &&
                            <InfoDisplay
                                showColorIndication
                                label={keys.bottom_line}
                                amount={totalIncome - totalExpenses} />}

                        <InfoDisplay
                            showColorIndication
                            showPercentage
                            amount={Math.round((totalIncome - totalExpenses) / totalIncome * 100)}
                        />
                    </div>
                </div>
                <div className="relative flex flex-col border-2">
                    <span className="absolute -top-6 right-0">
                        {keys.budget_title}
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                        {showFoo && temporalBudget &&
                            <InfoDisplay
                                label={keys.expected_income}
                                amount={temporalBudget.income}
                            />}
                        <InfoDisplay
                            label={keys.budget || "Budget"}
                            amount={budget}
                        />
                        <InfoDisplay
                            showColorIndication
                            label={keys.budget_difference || "Budget difference"}
                            amount={categories.length === 0 && temporalBudget
                                ? temporalBudget.income - budget
                                : budget - totalExpenses}
                        />
                        <InfoDisplay
                            showColorIndication
                            showPercentage
                            amount={Math.round((temporalBudget.income - budget) / temporalBudget.income * 100)}
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-between border p-4">
                {expensesByMonth && expensesByMonth['2025'] && Object.entries(expensesByMonth['2025']).reverse().map(([month, amount]) => (
                    <div className="flex flex-col justify-center items-center">
                        <span className="font-bold">{formatAmount(amount)}</span>
                        <span>{Months[month]}</span>
                    </div>
                ))}
            </div>
            <div className="w-full h-full border-2 overflow-auto">
                {filteredRows.length}
                <table ref={tableRef} dir="rtl" data-testid="pasteable-expenses-table" className="w-full">
                    <thead>
                        <tr>
                            <SortableTableHeader
                                label={keys.date}
                                sortKey="date"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                            <SortableTableHeader
                                label={keys.name}
                                sortKey="name"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                            <SortableTableHeader
                                label={keys.category}
                                sortKey="category"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                            <SortableTableHeader
                                label={keys.account}
                                sortKey="account"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                            <SortableTableHeader
                                label={keys.amount}
                                sortKey="amount"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                            <SortableTableHeader
                                label={keys.note}
                                sortKey="note"
                                sortCriteria={sortCriteria}
                                setSortCriteria={setSortCriteria}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row) => (
                            <Fragment key={row.id || (row.name + row.amount + row.account + row.date)}>
                                <TableRow
                                    rowData={row}
                                    updateCategory={updateCategory}
                                    deleteExpense={deleteExpense}
                                    updateNote={updateNote}
                                    updateDate={updateDate}
                                    onRowClick={() => {
                                        setRowIdsToFilter([...rowIdsToFilter, row.id]);
                                    }}
                                />
                                {/* <CategoriesDropdown
                                    value={row.category}
                                    onChange={(value) => {
                                        console.log("Changing category:", value);
                                        updateCategory(row.id, value);
                                    }} /> */}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}