import { useSyncExternalStore } from "react";

const QUERY = "(prefers-color-scheme: dark)";

const subscribe = (callback) => {
    const media = window.matchMedia(QUERY);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
};

// Tailwind's dark: variant follows the OS setting, so charts (whose SVG colors
// can't use dark: classes) read the same media query.
export const usePrefersDark = () => useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
);
