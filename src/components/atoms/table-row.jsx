import { CategoriesDropdown } from "../molecules/categories-dropdown";
import { CurrencyAmount } from "./currency-amount";
import { useState } from "react";
const TableData = ({ children }) => {
    return <td className="px-2">{children}</td>
}


export const TableRow = ({ rowData = {}, updateCategory, updateNote }) => {
    const [category, setCategory] = useState(rowData.category || "");
    const [note, setNote] = useState(rowData.note || "");

    return (
        <tr className="bg-gray-100 even:bg-white">


            <TableData>{rowData.name}</TableData>
            <TableData>{rowData.date}</TableData>
            <TableData>{rowData.account}</TableData>
            <TableData><CurrencyAmount amount={rowData.amount} /></TableData>
            <TableData>
                <CategoriesDropdown
                    value={category}
                    onChange={(value) => {
                        console.log("Changing category:", value);
                        setCategory(value);
                        updateCategory(rowData.id, value);
                    }} />
            </TableData>
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