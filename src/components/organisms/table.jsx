'use client';

import { CurrencyAmount } from "../atoms/currency-amount";
import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
// import { useKeyboardControl } from "@/hooks/useKeyboardControl";
import { useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const PrivateAccount = [
    "3361",
    "4887",
    "170-489748"
];

export default function Table({ rows = [], updateCategory, updateNote, updateDate }) {
    const tableRef = useRef(null);
    const query = useSearchParams();
    const account = query.get("account");
    const categories = query.get("category") ? query.get("category").split(",") : [];

    console.log({ categories });

    const filteredRows = useMemo(() =>
        rows.filter((row) =>
            (account ?
                account === "private"
                    ? PrivateAccount.includes(row.account)
                    : !PrivateAccount.includes(row.account)
                : true) &&
            (categories.length ? categories.includes(row.category) : true)
        ), [rows, account, categories]);




    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);



    // useKeyboardControl(tableRef);

    return (
        <>

            <div className="grid grid-cols-3 gap-4" dir="rtl">
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
            </div>
            <table ref={tableRef} dir="rtl" data-testid="pasteable-expenses-table">
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
        </>
    );
}