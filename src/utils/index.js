
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
