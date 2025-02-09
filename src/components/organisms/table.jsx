'use client';

import { CurrencyAmount } from "../atoms/currency-amount";
import { TableRow } from "../atoms/table-row";
import keys from "@/app/gi.json";
import { useRef, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Budget } from "@/constants";
// import { useKeyboardControl } from "@/hooks/useKeyboardControl";

const PrivateAccount = [
    "3361",
    "4887",
    "170-489748",
    "500-489746"
];

export default function Table({ rows = [], updateCategory, updateNote, updateDate }) {
    const tableRef = useRef(null);
    const query = useSearchParams();
    const account = query.get("account");
    const categories = query.get("category") ? query.get("category").split(",") : [];
    const pathname = usePathname();
    const year = pathname.split("/")[1];
    const month = pathname.split("/")[2];

    const budget = useMemo(() => {
        const temporalBudget = Budget[year][month];
        return Object.keys(temporalBudget).reduce((acc, key) => {
            if (categories.includes(key)) {
                acc += temporalBudget[key];
            }
            return acc;
        }, 0);
    }, [year, month, categories]);

    const filteredRows = useMemo(() =>
        rows.filter((row) =>
            (account ?
                account === "private"
                    ? PrivateAccount.includes(row.account)
                    : !PrivateAccount.includes(row.account)
                : true) &&
            (categories.length && row.category ? categories.includes(row.category) : true)
        ), [rows, account, categories]);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);

    // useKeyboardControl(tableRef);


    return (
        <>
            <div className="grid grid-cols-5 gap-2" dir="rtl">
                <div className="flex flex-col items-center gap-2">
                    <span>{keys.total_income}</span>
                    <CurrencyAmount amount={totalIncome} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span>{keys.total_expenses}</span>
                    <CurrencyAmount amount={totalExpenses} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span>{keys.bottom_line}</span>
                    <CurrencyAmount amount={totalIncome - totalExpenses} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span>{keys.budget} for {categories.join(", ")}</span>
                    <CurrencyAmount amount={budget} />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span>Budget difference</span>
                    <CurrencyAmount amount={budget - totalExpenses} />
                </div>
            </div>
            <div className="w-full min-h-fit max-h-[66vh]">
                <table ref={tableRef} dir="rtl" data-testid="pasteable-expenses-table" className="w-full">
                    <thead>
                        <tr>
                            <th>{keys.date}</th>
                            <th>{keys.name}</th>
                            <th>{keys.category}</th>
                            <th>{keys.account}</th>
                            <th>{keys.amount}</th>
                            <th>{keys.note}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row) => (
                            <TableRow
                                key={row.id || (row.name + row.amount + row.account + row.date)}
                                rowData={row}
                                updateCategory={updateCategory}
                                updateNote={updateNote}
                                updateDate={updateDate}
                            />
                        ))}

                    </tbody>
                </table>
            </div>
        </>
    );
}