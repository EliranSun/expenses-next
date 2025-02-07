'use client';

import { CurrencyAmount } from "../atoms/currency-amount";
import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useKeyboardControl } from "@/hooks/useKeyboardControl";
import { useRef } from "react";

export default function Table({ rows = [], updateCategory, updateNote, updateDate }) {
    const totalExpenses = rows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0);
    const totalIncome = rows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0);
    const tableRef = useRef(null);


    useKeyboardControl(tableRef);

    return (
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
                {rows.map((row) => (
                    <TableRow
                        key={row.id || (row.name + row.amount + row.account + row.date)}
                        rowData={row}
                        updateCategory={updateCategory}
                        updateNote={updateNote}
                        updateDate={updateDate}
                    />
                ))}

            </tbody>
            <tfoot>
                <tr>
                    <td />
                    <td />
                    <td>{keys.total_income}</td>
                    <td><CurrencyAmount amount={totalIncome} /></td>
                </tr>
                <tr>
                    <td />
                    <td />
                    <td>{keys.total_expenses}</td>
                    <td><CurrencyAmount amount={totalExpenses} /></td>
                </tr>
                <tr>
                    <td />
                    <td />
                    <td>{keys.bottom_line}</td>
                    <td><CurrencyAmount amount={totalIncome - totalExpenses} /></td>
                </tr>
            </tfoot>




        </table>
    );
}