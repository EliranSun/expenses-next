'use client';

import { CoinsIcon, CalendarIcon, PersonIcon, UsersIcon } from "@phosphor-icons/react";

export const SortButtons = ({ sortCriteria, onSort = () => { } }) => {
    return (
        <div className="flex gap-2">
            <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                onClick={() => {
                    onSort(["amount", sortCriteria[1] === "asc" ? "desc" : "asc"]);
                }}>
                <CoinsIcon size={24} />
                {sortCriteria[0] === "asc" ? "↑" : "↓"}
            </button>
            <button
                className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                onClick={() => {
                    onSort(["date", sortCriteria[1] === "asc" ? "desc" : "asc"]);
                }}>
                <CalendarIcon size={24} />
                {sortCriteria[1] === "asc" ? "↑" : "↓"}
            </button>
            {/* <button
                className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                onClick={() => {
                    onSort(account === "private" ? "shared" : "private");
                }}>
                {account === "private" ? <PersonIcon size={24} /> : <UsersIcon size={24} />}
            </button> */}
        </div>
    );
}