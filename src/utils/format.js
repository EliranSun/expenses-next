export const formatCurrency = amount =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount);
