'use client';

import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useRef, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Budget } from "@/constants";
// import { useKeyboardControl } from "@/hooks/useKeyboardControl";
import { Categories } from "@/constants";
import InfoDisplay from "../molecules/info-display";

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

    const categoriesEmoji = categories.map((category) => Categories[category].emoji);

    const budget = useMemo(() => {
        const temporalBudget = Budget[year]?.[month];
        if (!temporalBudget) return 0;

        return Object.keys(temporalBudget).reduce((acc, key) => {
            if (categories.length > 0 ? categories.includes(key) : true) {
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
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2" dir="rtl">
                <InfoDisplay label={keys.total_income} amount={totalIncome} />
                <InfoDisplay label={keys.total_expenses} amount={totalExpenses} />
                <InfoDisplay label={keys.bottom_line} amount={totalIncome - totalExpenses} />
                <InfoDisplay
                    label={keys.budget || "Budget"}
                    amount={budget}
                    additionalText={categories.length > 0 ? categoriesEmoji.join(", ") : "all"}
                />
                <InfoDisplay
                    label={keys.budget_difference || "Budget difference"}
                    amount={budget - totalExpenses}
                />
            </div>
            <div className="w-full min-h-fit max-h-[66vh] max-w-[95vw] overflow-x-auto">
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