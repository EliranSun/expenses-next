"use client";

import { useMemo, useState } from "react";
import { MainNavBar } from "@/components/molecules/MainNavBar";
import { Categories } from "@/constants";
import { DefaultCategoryTotals, monthKey } from "@/constants/budget";
import { useBudgetOverrides } from "@/hooks/useBudgetOverrides";
import keys from "@/app/he.json";

const currentMonthInputValue = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const categoryEntries = Object.entries(Categories);

const parseAmount = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
};

const DefaultBudgetSection = ({ overrides, setDefault, clearDefault, hydrated }) => {
    const effectiveDefault = useMemo(
        () => ({ ...DefaultCategoryTotals, ...(overrides.default || {}) }),
        [overrides.default],
    );

    return (
        <section className="space-y-3">
            <h2 className="text-xl font-bold">תקציב ברירת מחדל</h2>
            <p className="text-sm text-gray-500">
                ערכים אלה משמשים כל חודש שאין לו תקציב ייעודי.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {categoryEntries.map(([key, { name, emoji }]) => {
                    const isOverridden = overrides.default && key in overrides.default;
                    return (
                        <div
                            key={key}
                            className="flex items-center justify-between gap-2 bg-white dark:bg-black rounded-lg p-3 shadow-sm">
                            <label className="flex items-center gap-2 flex-1" htmlFor={`default-${key}`}>
                                <span>{emoji}</span>
                                <span>{name}</span>
                            </label>
                            <input
                                id={`default-${key}`}
                                type="number"
                                inputMode="numeric"
                                disabled={!hydrated}
                                value={effectiveDefault[key] ?? ""}
                                onChange={(e) => {
                                    const parsed = parseAmount(e.target.value);
                                    if (parsed === undefined) {
                                        clearDefault(key);
                                    } else {
                                        setDefault(key, parsed);
                                    }
                                }}
                                className="w-28 text-end border rounded px-2 py-1 bg-transparent" />
                            {isOverridden ? (
                                <button
                                    type="button"
                                    aria-label="אפס לערך ברירת המחדל"
                                    onClick={() => clearDefault(key)}
                                    className="text-gray-400 hover:text-red-500">
                                    ✕
                                </button>
                            ) : (
                                <span className="w-4" />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

const MonthOverrideSection = ({
    overrides,
    setMonthOverride,
    removeMonthOverride,
    resetMonth,
    hydrated,
}) => {
    const [selectedMonth, setSelectedMonth] = useState(currentMonthInputValue());
    const effectiveDefault = useMemo(
        () => ({ ...DefaultCategoryTotals, ...(overrides.default || {}) }),
        [overrides.default],
    );
    const monthEntry = overrides[selectedMonth] || {};
    const [yearPart, monthPart] = selectedMonth.split("-");
    const mKey = monthKey(yearPart, monthPart);

    const overrideCount = Object.keys(monthEntry).length;

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">תקציב לחודש מסוים</h2>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border rounded px-2 py-1 bg-transparent" />
                {overrideCount > 0 ? (
                    <button
                        type="button"
                        onClick={() => resetMonth(mKey)}
                        className="text-sm text-red-500 underline">
                        אפס את החודש ({overrideCount})
                    </button>
                ) : null}
            </div>
            <p className="text-sm text-gray-500">
                רק קטגוריות שתשנה כאן יחליפו את ברירת המחדל לחודש שנבחר.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {categoryEntries.map(([key, { name, emoji }]) => {
                    const isOverridden = key in monthEntry;
                    const value = isOverridden ? monthEntry[key] : "";
                    const placeholder = String(effectiveDefault[key] ?? 0);
                    return (
                        <div
                            key={key}
                            className="flex items-center justify-between gap-2 bg-white dark:bg-black rounded-lg p-3 shadow-sm">
                            <label className="flex items-center gap-2 flex-1" htmlFor={`month-${key}`}>
                                <span>{emoji}</span>
                                <span>{name}</span>
                            </label>
                            <input
                                id={`month-${key}`}
                                type="number"
                                inputMode="numeric"
                                disabled={!hydrated}
                                value={value}
                                placeholder={placeholder}
                                onChange={(e) => {
                                    const parsed = parseAmount(e.target.value);
                                    if (parsed === undefined) {
                                        removeMonthOverride(mKey, key);
                                    } else {
                                        setMonthOverride(mKey, key, parsed);
                                    }
                                }}
                                className="w-28 text-end border rounded px-2 py-1 bg-transparent" />
                            {isOverridden ? (
                                <button
                                    type="button"
                                    aria-label="הסר עקיפה"
                                    onClick={() => removeMonthOverride(mKey, key)}
                                    className="text-gray-400 hover:text-red-500">
                                    ✕
                                </button>
                            ) : (
                                <span className="w-4" />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default function BudgetPage() {
    const {
        overrides,
        hydrated,
        setDefault,
        clearDefault,
        setMonthOverride,
        removeMonthOverride,
        resetMonth,
        resetAll,
    } = useBudgetOverrides();

    return (
        <div className="p-4 max-w-screen-2xl mx-auto" dir="rtl">
            <MainNavBar />
            <div className="space-y-10 my-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{keys.budget}</h1>
                    <button
                        type="button"
                        onClick={resetAll}
                        className="text-sm text-red-500 underline">
                        אפס הכל
                    </button>
                </div>
                <DefaultBudgetSection
                    overrides={overrides}
                    setDefault={setDefault}
                    clearDefault={clearDefault}
                    hydrated={hydrated} />
                <MonthOverrideSection
                    overrides={overrides}
                    setMonthOverride={setMonthOverride}
                    removeMonthOverride={removeMonthOverride}
                    resetMonth={resetMonth}
                    hydrated={hydrated} />
            </div>
        </div>
    );
}
