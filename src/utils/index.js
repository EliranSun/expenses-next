import { data } from "@/data";

export const parseTextToRows = (text = data) => {
    const rows = text.split("\n");
    return rows
        .map((row) => {
            const data = row.split("\t");
            const [name, date, account, action, amount] = data;

            return {
                id: crypto.randomUUID(),
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
