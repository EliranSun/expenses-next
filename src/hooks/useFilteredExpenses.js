'use client';

import { useMemo } from 'react';
import { orderBy } from 'lodash';
import { PrivateAccounts, SharedAccount, WifeAccount } from "@/constants/account";

export function useFilteredExpenses({
    rows = [],
    account = null,
    categories = [],
    sortCriteria = ['date', 'asc'],
    rowIdsToFilter = []
}) {
    const filteredRows = useMemo(() => {
        const filtered = rows.filter((row) => {
            if (rowIdsToFilter.includes(row.id)) {
                return false;
            }

            let accountMatch = true;
            if (account) {
                if (account === "private") {
                    accountMatch = PrivateAccounts.includes(row.account);
                } else if (account === "shared") {
                    accountMatch = SharedAccount.includes(row.account);
                } else if (account === "wife") {
                    accountMatch = WifeAccount.includes(row.account);
                } else {
                    // all
                    accountMatch = true;
                }
            }

            let categoryMatch = false;
            if (categories.length > 0) {
                if (row.category) categoryMatch = categories.includes(row.category);
            } else {
                // return all if no category selected
                categoryMatch = true;
            }

            return accountMatch && categoryMatch;
        });

        return orderBy(filtered, sortCriteria[0], sortCriteria[1]);
    }, [rows, account, categories, rowIdsToFilter, sortCriteria]);

    const totalExpenses = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category !== "income" ? acc + row.amount : acc, 0),
        [filteredRows]
    );

    const totalIncome = useMemo(() =>
        filteredRows.reduce((acc, row) => row.category === "income" ? acc + row.amount : acc, 0),
        [filteredRows]
    );

    return {
        filteredRows,
        totalExpenses,
        totalIncome
    };
}