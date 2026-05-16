'use client';
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { orderBy } from "lodash";
import { PrivateAccounts, SharedAccounts, WifeAccount } from "@/constants/account";

export function filterExpenseRows(rows, { account, urlCategories, selectedCategories, rowIdsToFilter }) {
    return rows.filter(row => {
        if (rowIdsToFilter.includes(row.id)) return false;

        let accountMatch = true;
        if (account) {
            if (account === "private") accountMatch = PrivateAccounts.includes(row.account);
            else if (account === "shared") accountMatch = SharedAccounts.includes(row.account);
            else if (account === "wife") accountMatch = WifeAccount.includes(row.account);
        }

        let categoryMatch = true;
        if (urlCategories.length > 0) {
            categoryMatch = row.category ? urlCategories.includes(row.category) : false;
        }
        if (selectedCategories.length > 0) {
            categoryMatch = row.category ? selectedCategories.includes(row.category) : false;
        }

        return accountMatch && categoryMatch;
    });
}

export function useExpensesView(rawRows, rowIdsToFilter = []) {
    const query = useSearchParams();
    const [account, setAccount] = useState(query.get("account"));
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sort, setSort] = useState(() => {
        const qs = query.get("sort");
        return qs ? qs.split(":") : ["date", "asc"];
    });

    const urlCategories = useMemo(() =>
        query.get("category") ? query.get("category").split(",") : [],
    [query]);

    const rows = useMemo(() => {
        const filtered = filterExpenseRows(rawRows, { account, urlCategories, selectedCategories, rowIdsToFilter });
        return orderBy(filtered, sort[0], sort[1]);
    }, [rawRows, account, urlCategories, selectedCategories, rowIdsToFilter, sort]);

    return {
        rows,
        filters: { account, selectedCategories, urlCategories },
        setFilters: { setAccount, setSelectedCategories },
        sort,
        setSort,
    };
}
