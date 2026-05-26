"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "homepage_view_preference";
const DEFAULT_VIEW = "columns";
const VALID_VIEWS = ["columns", "list"];

const readStorage = () => {
    if (typeof window === "undefined") return DEFAULT_VIEW;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return VALID_VIEWS.includes(raw) ? raw : DEFAULT_VIEW;
    } catch {
        return DEFAULT_VIEW;
    }
};

const writeStorage = (value) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // ignore quota / serialization errors
    }
};

export const useViewPreference = () => {
    const [viewMode, setViewModeState] = useState(DEFAULT_VIEW);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setViewModeState(readStorage());
        setHydrated(true);
        const onStorage = (e) => {
            if (e.key === STORAGE_KEY) setViewModeState(readStorage());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const setViewMode = useCallback((value) => {
        const next = VALID_VIEWS.includes(value) ? value : DEFAULT_VIEW;
        setViewModeState(next);
        writeStorage(next);
    }, []);

    return { viewMode, setViewMode, hydrated };
};
