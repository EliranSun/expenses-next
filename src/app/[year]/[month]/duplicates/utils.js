export const getDuplicates = (expenses = []) => {
    const groupedExpenses = expenses.reduce((acc, expense) => {
        const key = `${expense.name}-${expense.date}-${expense.amount}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(expense);
        return acc;
    }, {});

    return Object.values(groupedExpenses)
        .filter(group => group.length > 1)
        .flatMap(group => group.slice(1)); // Only return duplicates
};