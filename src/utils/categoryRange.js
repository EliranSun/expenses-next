import { Categories } from "@/constants";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DEFAULT_SPAN = 12;
export const MAX_SERIES = 8;
export const OTHER_KEY = "__other";

const pad = (n) => String(n).padStart(2, "0");

const toMonthKey = (y, m) => `${y}-${pad(m)}`;

const parseMonthKey = (key) => {
    const [y, m] = key.split("-").map(Number);
    return { y, m };
};

// Shift a 'YYYY-MM' key by n months (n may be negative).
export const addMonths = (key, n) => {
    const { y, m } = parseMonthKey(key);
    const idx = y * 12 + (m - 1) + n;
    return toMonthKey(Math.floor(idx / 12), (idx % 12) + 1);
};

export const monthKeyOf = (date) => toMonthKey(date.getFullYear(), date.getMonth() + 1);

// from/to are inclusive 'YYYY-MM' keys. Returns SQL bounds with an exclusive
// end date, the same shape db.js uses for month/year filters.
export const parseRange = ({ from, to } = {}, today = new Date()) => {
    let end = MONTH_RE.test(to ?? "") ? to : monthKeyOf(today);
    let start = MONTH_RE.test(from ?? "") ? from : addMonths(end, -(DEFAULT_SPAN - 1));
    if (start > end) [start, end] = [end, start];
    return {
        from: start,
        to: end,
        startDate: `${start}-01`,
        endDate: `${addMonths(end, 1)}-01`,
    };
};

export const monthsBetween = (from, to) => {
    const months = [];
    for (let key = from; key <= to; key = addMonths(key, 1)) months.push(key);
    return months;
};

export const formatMonthLabel = (key) => {
    const { y, m } = parseMonthKey(key);
    return new Intl.DateTimeFormat("he-IL", { month: "short", year: "2-digit" })
        .format(new Date(y, m - 1, 1));
};

// Which categories get their own series. An explicit selection keeps its order
// (so colors follow the category); with no selection, the biggest expense
// categories are shown. Anything past MAX_SERIES folds into OTHER_KEY.
export const resolveSeries = (rows, selected = []) => {
    const valid = selected.filter((key) => Categories[key]);
    let candidates = valid;
    if (candidates.length === 0) {
        const totals = {};
        rows.forEach(({ category, total }) => {
            if (category === "income" || !Categories[category]) return;
            totals[category] = (totals[category] ?? 0) + total;
        });
        candidates = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
    }
    if (candidates.length <= MAX_SERIES) return { keys: candidates, otherKeys: [] };
    return {
        keys: candidates.slice(0, MAX_SERIES - 1),
        otherKeys: candidates.slice(MAX_SERIES - 1),
    };
};

// One object per month with a zero-filled value per series key, the shape
// recharts expects.
export const buildSeries = (rows, months, keys, otherKeys = []) => {
    const byMonth = Object.fromEntries(months.map((month) => {
        const point = { month };
        keys.forEach((key) => { point[key] = 0; });
        if (otherKeys.length) point[OTHER_KEY] = 0;
        return [month, point];
    }));
    rows.forEach(({ month, category, total }) => {
        const point = byMonth[month];
        if (!point) return;
        if (keys.includes(category)) point[category] += total;
        else if (otherKeys.includes(category)) point[OTHER_KEY] += total;
    });
    return months.map((month) => byMonth[month]);
};

export const summarizeSeries = (data, key) => {
    const values = data.map((point) => ({ month: point.month, value: point[key] ?? 0 }));
    const total = values.reduce((sum, { value }) => sum + value, 0);
    const average = values.length ? total / values.length : 0;
    const max = values.reduce((best, v) => (best == null || v.value > best.value ? v : best), null);
    const latest = values[values.length - 1] ?? null;
    const vsAverage = latest && average ? ((latest.value - average) / Math.abs(average)) * 100 : null;
    return { total, average, max, latest, vsAverage };
};

export const totalsByKind = (rows) => rows.reduce((acc, { category, total }) => {
    if (category === "income") acc.income += total;
    else acc.expenses += total;
    acc.net = acc.income - acc.expenses;
    return acc;
}, { income: 0, expenses: 0, net: 0 });

// Link to the category page from pages filtered by the homepage's 2-digit year
// / month params. A single month opens the 12 months ending at it so the trend
// is visible; a year opens that whole year.
export const categoryHref = ({ category, year, month, account } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (year && month) {
        const to = toMonthKey(2000 + Number(year), Number(month));
        params.set("from", addMonths(to, -(DEFAULT_SPAN - 1)));
        params.set("to", to);
    } else if (year) {
        const y = 2000 + Number(year);
        params.set("from", toMonthKey(y, 1));
        params.set("to", toMonthKey(y, 12));
    }
    if (account) params.set("account", account);
    const query = params.toString();
    return query ? `/categories?${query}` : "/categories";
};

// Homepage link for one month of the category page's table.
export const monthTransactionsHref = ({ month, categories = [], account } = {}) => {
    const { y, m } = parseMonthKey(month);
    const params = new URLSearchParams({ year: pad(y % 100), month: pad(m) });
    if (account) params.set("account", account);
    if (categories.length) params.set("category", categories.join(","));
    return `/?${params.toString()}`;
};
