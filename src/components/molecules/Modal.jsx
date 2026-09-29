'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

export function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="modal"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}>
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col"
                        initial={{ scale: 0.95, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 8 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        onClick={(event) => event.stopPropagation()}>
                        <div className="px-4 pt-4 pb-2 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold">{title}</h2>
                            <button type="button" onClick={onClose} aria-label="Close">
                                <XIcon size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
