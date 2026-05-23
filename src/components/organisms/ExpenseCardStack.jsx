'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExpenseCard } from './ExpenseCard';
import { ToolbarSheet } from '../molecules/ToolbarSheet';

const SWIPE_OFFSET = 80;
const SWIPE_VELOCITY = 400;

const cardVariants = {
    enter: (direction) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction) => ({
        x: direction > 0 ? '-100%' : '100%',
        opacity: 0,
    }),
};

export function ExpenseCardStack({
    rows,
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense,
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
    account,
    setAccount,
    selectedCategories,
    setSelectedCategories,
}) {
    const [[index, direction], setState] = useState([0, 0]);

    const safeIndex = rows.length === 0 ? 0 : Math.min(index, rows.length - 1);

    useEffect(() => {
        if (index > rows.length - 1) {
            setState([Math.max(rows.length - 1, 0), 0]);
        }
    }, [rows.length, index]);

    const advance = () => {
        if (safeIndex < rows.length - 1) setState([safeIndex + 1, 1]);
    };
    const retreat = () => {
        if (safeIndex > 0) setState([safeIndex - 1, -1]);
    };

    const row = rows[safeIndex];

    return (
        <div className="relative w-full" style={{ height: '75dvh' }}>
            <div
                className="flex items-center justify-center pb-2 text-sm text-gray-600 font-mono"
                dir="ltr">
                {rows.length > 0 ? `${safeIndex + 1} / ${rows.length}` : '0 / 0'}
            </div>

            <div className="relative overflow-hidden h-[calc(100%-2rem)]">
                {row ? (
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={row.id}
                            className="absolute inset-0"
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 320, damping: 32 },
                                opacity: { duration: 0.2 },
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_, info) => {
                                if (
                                    info.offset.x < -SWIPE_OFFSET ||
                                    info.velocity.x < -SWIPE_VELOCITY
                                ) {
                                    advance();
                                } else if (
                                    info.offset.x > SWIPE_OFFSET ||
                                    info.velocity.x > SWIPE_VELOCITY
                                ) {
                                    retreat();
                                }
                            }}>
                            <ExpenseCard
                                rowData={row}
                                updateCategory={updateCategory}
                                updateNote={updateNote}
                                updateDate={updateDate}
                                deleteExpense={deleteExpense}
                                onCategorySelected={advance}
                            />
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500" dir="rtl">
                        אין הוצאות לסיווג
                    </div>
                )}
            </div>

            <ToolbarSheet
                searchItems={searchItems}
                onSearch={onSearch}
                sortCriteria={sortCriteria}
                setSortCriteria={setSortCriteria}
                account={account}
                setAccount={setAccount}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
            />
        </div>
    );
}
