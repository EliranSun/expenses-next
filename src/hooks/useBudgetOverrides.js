"use client";

import { useCallback, useEffect, useState } from "react";
import { BUDGET_STORAGE_KEY } from "@/constants/budget";

const readStorage = () => {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeStorage = (next) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // ignore quota / serialization errors
    }
};

export const useBudgetOverrides = () => {
    const [overrides, setOverrides] = useState({});
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setOverrides(readStorage());
        setHydrated(true);
        const onStorage = (e) => {
            if (e.key === BUDGET_STORAGE_KEY) setOverrides(readStorage());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const update = useCallback((mutator) => {
        setOverrides((prev) => {
            const next = mutator(prev) || prev;
            writeStorage(next);
            return next;
        });
    }, []);

    const setDefault = useCallback((category, value) => {
        update((prev) => ({
            ...prev,
            default: { ...(prev.default || {}), [category]: value },
        }));
    }, [update]);

    const clearDefault = useCallback((category) => {
        update((prev) => {
            const nextDefault = { ...(prev.default || {}) };
            delete nextDefault[category];
            return { ...prev, default: nextDefault };
        });
    }, [update]);

    const setMonthOverride = useCallback((mKey, category, value) => {
        update((prev) => ({
            ...prev,
            [mKey]: { ...(prev[mKey] || {}), [category]: value },
        }));
    }, [update]);

    const removeMonthOverride = useCallback((mKey, category) => {
        update((prev) => {
            const monthEntry = { ...(prev[mKey] || {}) };
            delete monthEntry[category];
            const next = { ...prev };
            if (Object.keys(monthEntry).length === 0) {
                delete next[mKey];
            } else {
                next[mKey] = monthEntry;
            }
            return next;
        });
    }, [update]);

    const resetMonth = useCallback((mKey) => {
        update((prev) => {
            const next = { ...prev };
            delete next[mKey];
            return next;
        });
    }, [update]);

    const resetAll = useCallback(() => {
        update(() => ({}));
    }, [update]);

    return {
        overrides,
        hydrated,
        setDefault,
        clearDefault,
        setMonthOverride,
        removeMonthOverride,
        resetMonth,
        resetAll,
    };
};
