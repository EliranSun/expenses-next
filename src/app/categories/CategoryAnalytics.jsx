"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Categories } from "@/constants";
import { Pill } from "@/components/molecules/navbar";
import { usePrefersDark } from "@/hooks/usePrefersDark";
import {
    addMonths,
    buildSeries,
    formatMonthLabel,
    monthKeyOf,
    monthsBetween,
    monthTransactionsHref,
    OTHER_KEY,
    resolveSeries,
    summarizeSeries,
    totalsByKind,
} from "@/utils/categoryRange";
import keys from "@/app/he.json";

// Validated categorical palette (fixed slot order, light / dark steps). The
// Categories colors repeat across entries, so they can't tell series apart.
const SERIES_COLORS = {
    light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
    dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};
const CHROME = {
    light: { grid: "#e1e0d9", axis: "#c3c2b7", muted: "#898781", surface: "#ffffff" },
    dark: { grid: "#2c2c2a", axis: "#383835", muted: "#898781", surface: "#111827" },
};
const OTHER_COLOR = "#898781";

const ACCOUNTS = ["all", "private", "shared", "wife"];
const CHART_TYPES = [
    { value: "line", label: keys.chart_line },
    { value: "bar", label: keys.chart_bar },
    { value: "stacked", label: keys.chart_stacked },
];

const currency = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    notation: "compact",
    maximumFractionDigits: 1,
});
const formatILS = (value) => currency.format(Math.round(value));

const seriesLabel = (key) => {
    if (key === OTHER_KEY) return keys.other;
    const meta = Categories[key];
    return meta ? `${meta.emoji} ${meta.name}` : key;
};

const presets = (today) => {
    const current = monthKeyOf(today);
    const trailing = (n) => ({ from: addMonths(current, -(n - 1)), to: current });
    return [
        { label: "3M", ...trailing(3) },
        { label: "6M", ...trailing(6) },
        { label: "12M", ...trailing(12) },
        { label: "24M", ...trailing(24) },
        { label: "YTD", from: `${today.getFullYear()}-01`, to: current },
    ];
};

const Card = ({ className = "", children }) => (
    <div className={classNames("bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm", className)}>
        {children}
    </div>
);

const FilterRow = ({ label, children }) => (
    <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">{label}</span>
        <div className="flex gap-1 flex-wrap items-center">{children}</div>
    </div>
);

const StatTile = ({ label, value }) => (
    <Card className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatILS(value)}</span>
    </Card>
);

const Swatch = ({ color }) => (
    <span className="inline-block size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
);

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div dir="rtl" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-2 text-xs space-y-1">
            <div className="font-bold text-gray-900 dark:text-gray-100">{formatMonthLabel(label)}</div>
            {payload.map((entry) => (
                <div key={entry.dataKey} className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Swatch color={entry.color} />
                    <span className="flex-1">{entry.name}</span>
                    <span className="tabular-nums">{formatILS(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

const TrendChart = ({ data, seriesKeys, colorOf, chartType }) => {
    const isDark = usePrefersDark();
    const chrome = CHROME[isDark ? "dark" : "light"];

    const axes = (
        <>
            <CartesianGrid vertical={false} stroke={chrome.grid} />
            <XAxis
                dataKey="month"
                reversed
                tickFormatter={formatMonthLabel}
                tick={{ fill: chrome.muted, fontSize: 12 }}
                axisLine={{ stroke: chrome.axis }}
                tickLine={false} />
            <YAxis
                orientation="right"
                width={64}
                tickFormatter={(value) => compactCurrency.format(value)}
                tick={{ fill: chrome.muted, fontSize: 12 }}
                axisLine={false}
                tickLine={false} />
            <Tooltip
                content={<ChartTooltip />}
                cursor={chartType === "line" ? { stroke: chrome.axis } : { fill: chrome.grid, opacity: 0.5 }} />
            {seriesKeys.length > 1 && (
                <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-gray-700 dark:text-gray-200 text-sm">{value}</span>} />
            )}
        </>
    );

    return (
        // SVG text-anchor flips under dir="rtl", pushing axis labels into the plot.
        <div dir="ltr" className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                    <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                        {axes}
                        {seriesKeys.map((key) => (
                            <Line
                                key={key}
                                type="linear"
                                dataKey={key}
                                name={seriesLabel(key)}
                                stroke={colorOf(key)}
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 2, stroke: chrome.surface, fill: colorOf(key) }}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface }}
                                isAnimationActive={false} />
                        ))}
                    </LineChart>
                ) : (
                    <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={2}>
                        {axes}
                        {seriesKeys.map((key, index) => {
                            const isStacked = chartType === "stacked";
                            const isTop = !isStacked || index === seriesKeys.length - 1;
                            return (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    name={seriesLabel(key)}
                                    fill={colorOf(key)}
                                    stackId={isStacked ? "total" : undefined}
                                    stroke={isStacked ? chrome.surface : undefined}
                                    strokeWidth={isStacked ? 1 : 0}
                                    radius={isTop ? [4, 4, 0, 0] : 0}
                                    maxBarSize={48}
                                    isAnimationActive={false} />
                            );
                        })}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};

const SeriesSummary = ({ data, seriesKeys, colorOf }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {seriesKeys.map((key) => {
            const { total, average, max, latest, vsAverage } = summarizeSeries(data, key);
            return (
                <Card key={key} className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                        <Swatch color={colorOf(key)} />
                        <span className="flex-1 truncate">{seriesLabel(key)}</span>
                        <span className="tabular-nums">{formatILS(total)}</span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-600 dark:text-gray-300">
                        <dt>{keys.monthly_average}</dt>
                        <dd className="tabular-nums text-left">{formatILS(average)}</dd>
                        <dt>{keys.highest_month}</dt>
                        <dd className="tabular-nums text-left">
                            {max ? `${formatILS(max.value)} · ${formatMonthLabel(max.month)}` : "—"}
                        </dd>
                        <dt>{keys.latest_vs_average}</dt>
                        <dd className="tabular-nums text-left" dir="ltr">
                            {latest && vsAverage != null
                                ? `${vsAverage > 0 ? "▲" : vsAverage < 0 ? "▼" : ""} ${Math.abs(Math.round(vsAverage))}%`
                                : "—"}
                        </dd>
                    </dl>
                </Card>
            );
        })}
    </div>
);

const MonthTable = ({ data, seriesKeys, selected, account }) => {
    const totals = Object.fromEntries(seriesKeys.map((key) => [key, summarizeSeries(data, key).total]));
    const accountParam = account && account !== "all" ? account : undefined;
    return (
        <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-right font-normal p-2">{keys.month}</th>
                        {seriesKeys.map((key) => (
                            <th key={key} className="text-left font-normal p-2 whitespace-nowrap">{seriesLabel(key)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...data].reverse().map((point) => (
                        <tr key={point.month} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="p-2 whitespace-nowrap">
                                <Link
                                    href={monthTransactionsHref({ month: point.month, categories: selected, account: accountParam })}
                                    className="text-blue-600 dark:text-blue-400 hover:underline">
                                    {formatMonthLabel(point.month)}
                                </Link>
                            </td>
                            {seriesKeys.map((key) => (
                                <td key={key} className="p-2 text-left tabular-nums text-gray-800 dark:text-gray-100">
                                    {point[key] ? formatILS(point[key]) : "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold text-gray-900 dark:text-gray-100">
                        <td className="p-2">{keys.total}</td>
                        {seriesKeys.map((key) => (
                            <td key={key} className="p-2 text-left tabular-nums">{formatILS(totals[key])}</td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </Card>
    );
};

export const CategoryAnalytics = ({ rows, selected, from, to, account, chart }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isDark = usePrefersDark();

    const chartType = CHART_TYPES.some(({ value }) => value === chart)
        ? chart
        : selected.length ? "line" : "stacked";

    const months = useMemo(() => monthsBetween(from, to), [from, to]);
    const { keys: categoryKeys, otherKeys } = useMemo(() => resolveSeries(rows, selected), [rows, selected]);
    const seriesKeys = otherKeys.length ? [...categoryKeys, OTHER_KEY] : categoryKeys;
    const data = useMemo(
        () => buildSeries(rows, months, categoryKeys, otherKeys),
        [rows, months, categoryKeys, otherKeys],
    );
    const totals = useMemo(() => totalsByKind(rows), [rows]);

    const palette = SERIES_COLORS[isDark ? "dark" : "light"];
    const colorOf = (key) => (key === OTHER_KEY ? OTHER_COLOR : palette[categoryKeys.indexOf(key) % palette.length]);

    const update = (changes) => {
        const params = new URLSearchParams();
        const next = { category: selected.join(","), from, to, account, chart, ...changes };
        Object.entries(next).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        startTransition(() => router.push(`/categories?${params.toString()}`));
    };

    const toggleCategory = (key) => {
        const list = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
        update({ category: list.join(",") });
    };

    const today = new Date();

    return (
        <div className="space-y-6 my-6">
            <h1 className="text-2xl font-bold">{keys.categories_title}</h1>

            <Card className="flex flex-col gap-3">
                <FilterRow label={keys.category}>
                    {Object.entries(Categories).map(([key, { emoji, name }]) => (
                        <Pill
                            key={key}
                            isSelected={selected.includes(key)}
                            className="flex items-center gap-1"
                            onClick={() => toggleCategory(key)}>
                            <span>{emoji}</span>
                            <span className="hidden sm:inline">{name}</span>
                        </Pill>
                    ))}
                    {selected.length > 0 && (
                        <button type="button" onClick={() => update({ category: "" })} className="text-sm text-red-500 underline px-2">
                            {keys.clear}
                        </button>
                    )}
                </FilterRow>
                <FilterRow label={keys.account}>
                    {ACCOUNTS.map((name) => (
                        <Pill
                            key={name}
                            isSelected={account === name}
                            onClick={() => update({ account: account === name ? "" : name })}>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </Pill>
                    ))}
                </FilterRow>
                <FilterRow label={keys.range}>
                    {presets(today).map((preset) => (
                        <Pill
                            key={preset.label}
                            isSelected={preset.from === from && preset.to === to}
                            onClick={() => update({ from: preset.from, to: preset.to })}>
                            {preset.label}
                        </Pill>
                    ))}
                    <label className="flex items-center gap-1 text-sm">
                        {keys.from}
                        <input
                            type="month"
                            value={from}
                            max={to}
                            onChange={(e) => e.target.value && update({ from: e.target.value })}
                            className="border rounded px-2 py-1 bg-transparent" />
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                        {keys.to}
                        <input
                            type="month"
                            value={to}
                            min={from}
                            onChange={(e) => e.target.value && update({ to: e.target.value })}
                            className="border rounded px-2 py-1 bg-transparent" />
                    </label>
                </FilterRow>
                <FilterRow label={keys.chart}>
                    {CHART_TYPES.map(({ value, label }) => (
                        <Pill key={value} isSelected={chartType === value} onClick={() => update({ chart: value })}>
                            {label}
                        </Pill>
                    ))}
                </FilterRow>
            </Card>

            <div
                aria-busy={isPending}
                className={classNames("space-y-6 transition-opacity", { "opacity-60 pointer-events-none": isPending })}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatTile label={keys.income} value={totals.income} />
                    <StatTile label={keys.expenses} value={totals.expenses} />
                    <StatTile label={keys.bottom_line} value={totals.net} />
                </div>

                {seriesKeys.length === 0 ? (
                    <Card className="text-center text-gray-500">{keys.no_data}</Card>
                ) : (
                    <>
                        <Card>
                            {selected.length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{keys.all_categories_hint}</p>
                            )}
                            <TrendChart data={data} seriesKeys={seriesKeys} colorOf={colorOf} chartType={chartType} />
                        </Card>
                        <SeriesSummary data={data} seriesKeys={seriesKeys} colorOf={colorOf} />
                        <MonthTable data={data} seriesKeys={seriesKeys} selected={selected} account={account} />
                    </>
                )}
            </div>
        </div>
    );
};
