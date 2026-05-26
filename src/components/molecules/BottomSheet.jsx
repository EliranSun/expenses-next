'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { FunnelIcon, XIcon } from '@phosphor-icons/react';

const SNAP_FULL = '0%';
const SNAP_HALF = '50%';
const SNAP_CLOSED = '100%';

export function BottomSheet({
    children,
    title = 'Filters',
    ariaLabel = 'Open filters',
    hasIndicator = false,
    TriggerIcon = FunnelIcon,
}) {
    const [open, setOpen] = useState(false);
    const [snap, setSnap] = useState('half');
    const dragControls = useDragControls();

    useEffect(() => {
        if (open) setSnap('half');
    }, [open]);

    const targetY = !open ? SNAP_CLOSED : snap === 'full' ? SNAP_FULL : SNAP_HALF;

    const handleDragEnd = (_event, info) => {
        const { offset, velocity } = info;
        const swipedUp = offset.y < -60 || velocity.y < -500;
        const swipedDown = offset.y > 60 || velocity.y > 500;

        if (snap === 'half') {
            if (swipedUp) setSnap('full');
            else if (swipedDown) setOpen(false);
        } else {
            if (swipedDown) setSnap('half');
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={ariaLabel}
                className="fixed bottom-6 right-6 z-30 bg-blue-500 text-white rounded-full p-4 shadow-lg">
                <TriggerIcon size={24} weight="bold" />
                {hasIndicator && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            key="backdrop"
                            className="fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            key="sheet"
                            className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl flex flex-col shadow-2xl"
                            style={{ height: '100dvh' }}
                            initial={{ y: SNAP_CLOSED }}
                            animate={{ y: targetY }}
                            exit={{ y: SNAP_CLOSED }}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}>
                            <div
                                onPointerDown={(event) => dragControls.start(event)}
                                style={{ touchAction: 'none' }}
                                className="pt-3 pb-2 cursor-grab active:cursor-grabbing select-none">
                                <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-300" />
                            </div>
                            <div className="px-4 pb-2 flex justify-between items-center shrink-0">
                                <h2 className="text-lg font-bold">{title}</h2>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close">
                                    <XIcon size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
                                {children}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
