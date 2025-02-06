'use client';

import { CurrencyAmount } from "../atoms/currency-amount";
import { TableRow } from "../atoms/table-row";
import keys from "@/app/he.json";
import { useKeyboardControl } from "@/hooks/useKeyboardControl";
import { useRef } from "react";

export default function Table({ rows = [] }) {
    const total = rows.reduce((acc, row) => acc + row.amount, 0);
    const tableRef = useRef(null);

    useKeyboardControl(tableRef);

    return (
        <table ref={tableRef} dir="rtl" data-testid="pasteable-expenses-table">
            <thead>
                <tr>
                    <th>{keys.name}</th>
                    <th>{keys.date}</th>
                    <th>{keys.account}</th>
                    <th>{keys.amount}</th>
                    <th>{keys.category}</th>
                    <th>{keys.note}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <TableRow key={row.id} rowData={row} />
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={3}>{keys.total}</td>
                    <td>
                        <CurrencyAmount amount={total} />
                    </td>
                </tr>
            </tfoot>
        </table>
    );
}