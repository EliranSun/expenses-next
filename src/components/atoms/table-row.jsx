import { CategoriesDropdown } from "../molecules/categories-dropdown";
import { CurrencyAmount } from "./currency-amount";
import { useState } from "react";
import { AccountName } from "@/constants/account";

const DataDisplay = ({ children, className }) => {
    return <div className={`items-center justify-center p-2 flex ${className}`}>{children}</div>
}

export const TableRow = ({ rowData = {}, updateCategory, updateNote, updateDate, onRowClick, deleteExpense }) => {
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isHideHovered, setIsHideHovered] = useState(false);
    const [category, setCategory] = useState(rowData.category || "");
    const [note, setNote] = useState(rowData.note || "");
    const [date, setDate] = useState(rowData.date || "");

    return (
        <div dir="rtl" className="flex flex-col gap-2 bg-gray-100
         dark:bg-transparent rounded-xl py-2 px-4 w-full">
            <div className="flex justify-between">
                <h1 className="text-xl">
                    {rowData.name} - {AccountName[rowData.account]?.translation}
                </h1>
                <button
                    className=" border border-gray-700 shadow p-1 rounded w-fit"
                    onClick={() => deleteExpense(rowData.id)}>
                    🗑️
                </button>
            </div>
            <div className="flex gap-2 rounded-xl">
                <DataDisplay className="w-24 bg-white rounded-xl shadow shrink-0 text-center">
                    <CurrencyAmount
                        isPositive={rowData.category === "income"}
                        isNegative={rowData.category !== "income"}
                        amount={rowData.amount} />
                </DataDisplay>
                <DataDisplay>
                    {new Date(rowData.date).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })}
                </DataDisplay>
                <DataDisplay className={`shrink-0 w-40 ${category ? "" : "hidden"}`}>
                    <CategoriesDropdown
                        value={category}
                        onCategoryChange={(value) => {
                            console.log("Changing category:", value);
                            setCategory(value === category ? "" : value);
                            updateCategory(rowData.id, value);
                        }} />
                </DataDisplay>
                <DataDisplay>
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
                </DataDisplay>
                {/* <DataDisplay>
                    {rowData.account.slice(0, 4)}
                </DataDisplay> */}
            </div>


            <DataDisplay className={`shrink-0 w-full ${category ? "hidden" : ""}`}>
                <CategoriesDropdown
                    value={category}
                    onCategoryChange={(value) => {
                        console.log("Changing category:", value);
                        setCategory(value === category ? "" : value);
                        updateCategory(rowData.id, value);
                    }} />
            </DataDisplay>
        </div>
    );
};