'use client';

import { useEffect, useState, useCallback } from "react";

export default function Search({ items = [], onSearch }) {
    const [search, setSearch] = useState("");

    const filterItems = useCallback((items, search) => {
        if (search === "") {
            return items;
        }

        return items.filter((item) => {
            const isNumber = !isNaN(Number(search));
            if (isNumber) {
                const searchNumber = Number(search);
                return item.amount >= searchNumber * 0.95 && item.amount <= searchNumber * 1.05;
            }

            return (
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.account.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.toLowerCase().includes(search.toLowerCase()) ||
                item.date.toLowerCase().includes(search.toLowerCase()) ||
                item.note?.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        const search = url.searchParams.get("search") || "";
        setSearch(search);
        onSearch(filterItems(items, search));
    }, [items]);

    return (
        <input
            className="border border-gray-300 rounded-full py-2 px-4 w-full"
            placeholder="Search"
            type="text"
            value={search}
            onChange={(event) => {
                const value = event.target.value;
                // update url search params with search value
                const url = new URL(window.location.href);
                url.searchParams.set("search", value);
                window.history.pushState({}, "", url);
                onSearch(filterItems(items, value));
                setSearch(value);
            }} />
    );
}