import { CategoriesDropdown } from "../molecules/categories-dropdown";
import { CurrencyAmount } from "./currency-amount";
import { useState } from "react";
import { AccountName } from "@/constants/account";
import { run } from "@/utils/action";

const DataDisplay = ({ children, className }) => {
    return <div className={`items-center justify-center p-2 flex ${className}`}>{children}</div>
}

export const TableRow = ({ rowData = {}, updateCategory, updateNote, updateDate, onRowClick, deleteExpense }) => {
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isHideHovered, setIsHideHovered] = useState(false);
    const [category, setCategory] = useState(rowData.category || "");
    const [note, setNote] = useState(rowData.note || "");
    const [date, setDate] = useState(rowData.date || "");

    const isDuplicate = !!rowData.isDuplicate;

    return (
        <div dir="rtl" className={`flex flex-col gap-2 bg-gray-100 dark:bg-transparent rounded-xl py-2 px-4 w-full ${isDuplicate ? 'opacity-50 border border-amber-300' : ''}`}>
            <div className="flex justify-between">
                <h1 className="text-xl flex items-center gap-2">
                    {rowData.name} - {AccountName[rowData.account]?.translation}
                    {isDuplicate && (
                        <span className="text-[10px] uppercase tracking-wide bg-amber-200 text-amber-900 rounded-full px-2 py-0.5">duplicate</span>
                    )}
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
                <DataDisplay className={`shrink-0 w-40 ${category ? "" : "hidden"} ${isDuplicate ? "pointer-events-none" : ""}`}>
                    <CategoriesDropdown
                        value={category}
                        onCategoryChange={(value) => {
                            if (isDuplicate) return;
                            setCategory(value === category ? "" : value);
                            run(updateCategory(rowData.id, value));
                        }} />
                </DataDisplay>
                <DataDisplay>
                    <input
                        type="text"
                        className="bg-transparent"
                        defaultValue={note}
                        disabled={isDuplicate}
                        onBlur={() => {
                            if (isDuplicate) return;
                            run(updateNote(rowData.id, note));
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


            <DataDisplay className={`shrink-0 w-full ${category ? "hidden" : ""} ${isDuplicate ? "pointer-events-none" : ""}`}>
                <CategoriesDropdown
                    value={category}
                    onCategoryChange={(value) => {
                        if (isDuplicate) return;
                        setCategory(value === category ? "" : value);
                        run(updateCategory(rowData.id, value));
                    }} />
            </DataDisplay>
        </div>
    );
};