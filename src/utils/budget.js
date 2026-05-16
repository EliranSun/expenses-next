import { Budget } from "@/constants/budget";

export function getBudget(year, month, account, categories = []) {
    const temporal = Budget[year]?.[month]?.[account];
    if (!temporal) return 0;
    return Object.keys(temporal).reduce((acc, key) => {
        if (key === "income") return acc;
        if (categories.length > 0 ? categories.includes(key) : true) acc += temporal[key];
        return acc;
    }, 0);
}
