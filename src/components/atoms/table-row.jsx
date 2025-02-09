import { CategoriesDropdown } from "../molecules/categories-dropdown";
import { CurrencyAmount } from "./currency-amount";
import { useState } from "react";

const TableData = ({ children, className }) => {
    return <td className={`px-2 ${className}`}>{children}</td>
}


export const TableRow = ({ rowData = {}, updateCategory, updateNote, updateDate }) => {
    const [category, setCategory] = useState(rowData.category || "");
    const [note, setNote] = useState(rowData.note || "");
    const [date, setDate] = useState(rowData.date || "");

    return (
        <tr className="bg-gray-100 dark:bg-transparent even:bg-white dark:even:bg-neutral-800 text-sm">
            <TableData>
                <input
                    type="date"
                    className="bg-transparent"
                    value={date}

                    onBlur={() => {
                        updateDate(rowData.id, date);
                    }}
                    onChange={(e) => {
                        setDate(e.target.value);
                    }} />

            </TableData>
            <TableData className="w-40 max-w-40 text-xs overflow-hidden whitespace-nowrap">{rowData.name}</TableData>
            <TableData>
                <CategoriesDropdown
                    value={category}
                    onChange={(value) => {
                        console.log("Changing category:", value);
                        setCategory(value);
                        updateCategory(rowData.id, value);
                    }} />
            </TableData>
            <TableData className="w-28 max-w-28 text-sm overflow-hidden whitespace-nowrap">{rowData.account}</TableData>
            <TableData><CurrencyAmount amount={rowData.amount} /></TableData>
            <TableData>
                <input
                    type="text"
                    className="bg-transparent"
                    defaultValue={note}
                    onBlur={() => {
                        console.log("Changing note:", note);
                        updateNote(rowData.id, note);
                    }}
                    onChange={(e) => {
                        console.log("Changing note:", e.target.value);
                        setNote(e.target.value);
                    }} />


            </TableData>

        </tr>

    );
};