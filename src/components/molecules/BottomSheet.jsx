'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FunnelIcon, XIcon } from '@phosphor-icons/react';

export function BottomSheet({
    children,
    title = 'Filters',
    ariaLabel = 'Open filters',
    hasIndicator = false,
    TriggerIcon = FunnelIcon,
}) {
    const [open, setOpen] = useState(false);

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
                            className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">{title}</h2>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close">
                                    <XIcon size={24} />
                                </button>
                            </div>
                            {children}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
