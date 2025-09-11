'use client';

import { useMemo, useState } from "react";
import { orderBy } from "lodash";
// import { PrivateAccounts, SharedAccount, WifeAccount } from "@/constants/account";

export const useSort = (data) => {
    const [sortCriteria, setSortCriteria] = useState(["date", "asc"]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const filteredData = useMemo(() => {
        const filtered = data.filter((row) => {
            if (data.includes(row.id)) {
                return false;
            }

            let accountMatch = true;
            // if (account) {
            //     if (account === "private") {
            //         accountMatch = PrivateAccounts.includes(row.account);
            //     } else if (account === "shared") {
            //         accountMatch = SharedAccount.includes(row.account);
            //     } else if (account === "wife") {
            //         accountMatch = WifeAccount.includes(row.account);
            //     } else {
            //         // all
            //         accountMatch = true;
            //     }
            // }

            let categoryMatch = false;

            if (categories.length > 0) {
                if (row.category) categoryMatch = categories.includes(row.category);
            } else {
                // return all if no category selected
                categoryMatch = true;
            }

            if (selectedCategories.length > 0) {
                if (row.category) categoryMatch = selectedCategories.includes(row.category);
            } else {
                // return all if no category selected
                categoryMatch = true;
            }

            return accountMatch && categoryMatch;
        });

        return orderBy(filtered, sortCriteria[0], sortCriteria[1]);
    }, [data, sortCriteria]);

    return { filteredData, sortCriteria, setSortCriteria };
}