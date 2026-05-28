"use client";

import { useEffect, useRef } from "react";
import { useMotionValue } from "framer-motion";

// Keeps a floating action button at a default CSS position while letting the
// user drag it anywhere on screen, persisting the offset so it survives
// navigation and reloads.
export function useDraggableFab(storageKey) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const constraintsRef = useRef(null);

    useEffect(() => {
        try {
            const saved = JSON.parse(window.localStorage.getItem(storageKey));
            if (saved) {
                x.set(saved.x ?? 0);
                y.set(saved.y ?? 0);
            }
        } catch {
            // ignore malformed or unavailable storage
        }
    }, [storageKey, x, y]);

    const handleDragEnd = () => {
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify({ x: x.get(), y: y.get() }),
            );
        } catch {
            // ignore unavailable storage
        }
    };

    const dragProps = {
        drag: true,
        dragMomentum: false,
        dragElastic: 0.12,
        dragConstraints: constraintsRef,
        onDragEnd: handleDragEnd,
        style: { x, y, touchAction: "none" },
    };

    return { constraintsRef, dragProps };
}
