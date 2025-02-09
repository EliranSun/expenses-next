'use client';

import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useRef, useMemo, useState } from "react";
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
    const [rowIdsToFilter, setRowIdsToFilter] = useState([]);
    const pathname = usePathname();
    const year = pathname.split("/")[1];
    const month = pathname.split("/")[2];
    const categoriesEmoji = categories.map((category) => Categories[category].emoji);
    const temporalBudget = useMemo(() => Budget[year]?.[month], [year, month]);
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

    const filteredRows = useMemo(() =>
        rows.filter((row) => {
            if (rowIdsToFilter.includes(row.id)) {
                return false;
            }

            let accountMatch = true;
            if (account) {
                if (account === "private") {
                    accountMatch = PrivateAccount.includes(row.account);
                } else {
                    accountMatch = !PrivateAccount.includes(row.account);
                }
            }

            let categoryMatch = true;
            if (!row.category) {
                return true;
            }

            if (categories.length && row.category) {
                categoryMatch = categories.includes(row.category);
            }

            return accountMatch && categoryMatch;
        }), [rows, account, categories]);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0), [filteredRows]);

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0), [filteredRows]);

    // useKeyboardControl(tableRef);


    return (
        <>
            <div className={`grid grid-cols-3 ${categories.length === 0
                ? "md:grid-cols-6" : "md:grid-cols-3"} gap-2`} dir="rtl">
                {categories.length === 0 && <InfoDisplay label={keys.total_income} amount={totalIncome} />}
                <InfoDisplay label={keys.total_expenses} amount={totalExpenses} />
                {categories.length === 0 && <InfoDisplay
                    showColorIndication
                    label={keys.bottom_line}
                    amount={totalIncome - totalExpenses} />}
                {categories.length === 0 && <InfoDisplay
                    label={keys.expected_income}
                    amount={temporalBudget.income}
                />}
                <InfoDisplay
                    label={keys.budget || "Budget"}
                    amount={budget}
                    additionalText={categories.length > 0 ? categoriesEmoji.join(", ") : keys.all}
                />
                <InfoDisplay
                    label={keys.budget_difference || "Budget difference"}
                    amount={categories.length === 0
                        ? temporalBudget.income - budget
                        : budget - totalExpenses}
                    showColorIndication
                />
            </div>
            <div className="w-full min-h-fit max-h-[66vh] max-w-[95vw] overflow-x-auto pb-96">
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
                                onRowClick={() => {
                                    setRowIdsToFilter([...rowIdsToFilter, row.id]);
                                }}
                            />
                        ))}

                    </tbody>
                </table>
            </div>
        </>
    );
}