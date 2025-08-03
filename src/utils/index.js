import { PrivateAccounts } from "@/constants/account";

export const parseTextToRows = (text) => {
    if (!text) return [];

    const rows = text.trim().split("\n");
    const uniqueRows = new Set(); // Set to track unique lines

    return rows
        .filter((row) => {
            if (uniqueRows.has(row.trim())) {
                return false; // Skip duplicate lines
            }
            uniqueRows.add(row.trim());
            return true;
        })
        .map((row) => {
            const data = row.trim().split("\t");
            const [name, date, account, action, amount] = data;

            return {
                name,
                date,
                account,
                action,
                amount: typeof amount === 'string' ? Number(amount
                    .replace('₪', '')
                    .replace(',', '')
                    .trim()) : null,
            };
        })
        .filter((row) => row.name && row.amount)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const formatDateToDB = (date) => {
    const splitDate = date.split("-");
    const year = splitDate[0].slice(2);
    const month = splitDate[1];
    const day = splitDate[2];
    return `${day}/${month}/${year}`;
};

export const formatDateFromDB = (date) => {
    const splitDate = date.split("/");
    const year = `20${splitDate[2]}`;
    const month = splitDate[1];
    const day = splitDate[0];
    return `${year}-${month}-${day}`;
};

export const groupExpensesByMonth = (expenses, isPrivate = true) => {
    if (!expenses || !Array.isArray(expenses)) return {};

    let temp = {};
    expenses
        // .filter(expense => expense.name === "משכורת")
        .filter(expense => isPrivate ? PrivateAccounts.includes(expense.account) : true)
        .forEach(expense => {
            const date = new Date(expense.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();

            const isIncome = expense.category === "income";

            const amount = isIncome
                ? expense.amount < 0 // some income is negative, like refunds
                    ? expense.amount * -1
                    : expense.amount
                : -expense.amount;

            if (expense.name === "משכורת") {
                console.log({ expense, year, month });
            }

            temp = {
                ...temp,
                [year]: {
                    ...(temp[year] || {}),
                    [month]: {
                        totalIncome: isIncome ? (temp[year]?.[month]?.totalIncome ?? 0) + amount : (temp[year]?.[month]?.totalIncome ?? 0),
                        totalExpenses: !isIncome ? (temp[year]?.[month]?.totalExpenses ?? 0) + amount : (temp[year]?.[month]?.totalExpenses ?? 0),
                        total: (temp[year]?.[month]?.total ?? 0) + amount,
                        expenses: [...(temp[year]?.[month]?.expenses || []), expense],
                        categoryTotals: {
                            ...(temp[year]?.[month]?.categoryTotals || {}),
                            [expense.category]: ((temp[year]?.[month]?.categoryTotals || {})[expense.category] ?? 0) + amount
                        }
                    }
                }
            }
        });

    return temp;
};