import { PrivateAccounts } from "@/constants/account";

const RESERVED_FIELD_VALUES = new Set(['null', 'undefined', 'nan']);

export const isMeaningfulField = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    return !RESERVED_FIELD_VALUES.has(trimmed.toLowerCase());
};

const DATE_DDMMYY = /^\d{2}\/\d{2}\/\d{2}$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const isValidParsedRow = (row) =>
    !!row &&
    isMeaningfulField(row.name) &&
    isMeaningfulField(row.account) &&
    typeof row.date === 'string' && DATE_DDMMYY.test(row.date.trim()) &&
    typeof row.amount === 'number' && Number.isFinite(row.amount) && row.amount !== 0;

export const isValidInsertRow = (row) =>
    !!row &&
    isMeaningfulField(row.name) &&
    isMeaningfulField(row.account) &&
    typeof row.id === 'string' && row.id.trim().length > 0 &&
    typeof row.date === 'string' && DATE_ISO.test(row.date) &&
    typeof row.amount === 'number' && Number.isFinite(row.amount) && row.amount !== 0;

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
                name: typeof name === 'string' ? name.trim() : name,
                date: typeof date === 'string' ? date.trim() : date,
                account: typeof account === 'string' ? account.trim() : account,
                action,
                amount: typeof amount === 'string' ? Number(amount
                    .replace('₪', '')
                    .replace(',', '')
                    .trim()) : null,
            };
        })
        .filter(isValidParsedRow)
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