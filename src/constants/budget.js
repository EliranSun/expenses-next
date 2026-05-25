

export const Budget = {
    '25': {
        '01': {
            private: {
                income: 18669,
                self: 1100,
                restaurants: 1000,
                house: 800,
                groceries: 1000,
                vacation: 0,
                wedding: 0,
                workout: 300,
                subscriptions: 300,
                animals: 300,
                transportation: 100,
                gifts: 100,
                savings: 6000,
                car: 250,
                fees: 750,
                games: 0,
                tech: 0,
                online: 0,
                entertainment: 1000,
            }
        },
        '02': {
            private: {
                income: 18669,
                self: 1100,
                restaurants: 1000,
                house: 800,
                groceries: 1000,
                vacation: 0,
                wedding: 0,
                workout: 300,
                subscriptions: 300,
                animals: 300,
                transportation: 100,
                gifts: 100,
                savings: 6000,
                car: 250,
                fees: 750,
                games: 0,
                tech: 0,
                online: 0,
                entertainment: 1000,
            }
        },
        '03': {
            private: {
                income: 15000,
                self: 1100,
                restaurants: 1000,
                house: 800,
                groceries: 1000,
                vacation: 0,
                wedding: 0,
                workout: 300,
                subscriptions: 300,
                animals: 300,
                transportation: 100,
                gifts: 100,
                savings: 6000,
                car: 250,
                fees: 750,
                games: 0,
                tech: 0,
                online: 0,
                entertainment: 1000,
            }
        },
        '05': {
            private: {
                income: 15000,
                self: 600,
                restaurants: 1000,
                house: 5300,
                groceries: 1000,
                vacation: 0,
                wedding: 0,
                workout: 800,
                subscriptions: 100,
                animals: 300,
                transportation: 100,
                gifts: 100,
                savings: 500,
                car: 250,
                fees: 750,
                games: 0,
                tech: 0,
                online: 0,
                entertainment: 0,
            }
        },
        '06': {
            private: {
                income: 15000,
                self: 300,
                restaurants: 1000,
                house: 5300,
                groceries: 1000,
                vacation: 0,
                wedding: 0,
                workout: 800,
                subscriptions: 100,
                animals: 300,
                transportation: 100,
                gifts: 100,
                savings: 500,
                car: 250,
                fees: 750,
                games: 0,
                tech: 0,
                online: 0,
                entertainment: 0,
            }
        }
    },
};

export const DefaultCategoryTotals = {
    income: 15000,
    savings: 6000,
    groceries: 1000,
    house: 200,
    fees: 750,
    workout: 700,
    restaurants: 500,
    self: 500,
    animals: 300,
    car: 250,
    transportation: 100,
    gifts: 100,
    subscriptions: 200,
    vacation: 0,
    entertainment: 0,
    wedding: 0,
    games: 0,
    tech: 0,
    online: 0,
};

export const BUDGET_STORAGE_KEY = "budgetOverrides";

export const monthKey = (year, month) => {
    const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
    const mm = String(Number(month)).padStart(2, "0");
    return `${fullYear}-${mm}`;
};

export const buildBudgetData = (categoryTotals) => {
    const totalIncome = Object.entries(categoryTotals)
        .filter(([category]) => category === "income")
        .reduce((acc, [, amount]) => acc + (Number(amount) || 0), 0);

    const totalExpenses = Object.entries(categoryTotals)
        .filter(([category]) => category !== "income")
        .reduce((acc, [, amount]) => acc + (Number(amount) || 0), 0);

    return {
        totalIncome,
        totalExpenses,
        total: totalIncome - totalExpenses,
        categoryTotals,
    };
};

export const getBudgetForMonth = (overrides, year, month) => {
    const base = { ...DefaultCategoryTotals, ...(overrides?.default || {}) };
    const monthOverride = overrides?.[monthKey(year, month)] || {};
    const merged = { ...base, ...monthOverride };
    return buildBudgetData(merged);
};
