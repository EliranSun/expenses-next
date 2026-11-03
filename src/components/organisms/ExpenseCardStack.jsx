'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExpenseCard } from './ExpenseCard';
import { ToolbarSheet } from '../molecules/ToolbarSheet';

const SWIPE_OFFSET = 80;
const SWIPE_VELOCITY = 400;

const cardVariants = {
    // RTL: advancing reveals the next card from the left; the current card
    // slides off to the right.
    enter: (direction) => ({
        x: direction > 0 ? '-100%' : '100%',
    }),
    center: {
        x: 0,
    },
    exit: (direction) => ({
        x: direction > 0 ? '100%' : '-100%',
    }),
};

export function ExpenseCardStack({
    rows,
    updateCategory,
    updateNote,
    updateDate,
    deleteExpense,
    unmarkDuplicate,
    liveEdits,
    searchItems,
    onSearch,
    sortCriteria,
    setSortCriteria,
    account,
    setAccount,
    selectedCategories,
    setSelectedCategories,
}) {
    // Track the current card by id: editing a date re-sorts the rows, and the
    // card being edited must stay on screen. `index` is the fallback position
    // once the current row is removed.
    const [{ id: currentId, index, direction }, setState] = useState({ id: rows[0]?.id, index: 0, direction: 0 });

    const found = rows.findIndex((r) => r.id === currentId);
    const safeIndex = rows.length === 0 ? 0 : found !== -1 ? found : Math.min(index, rows.length - 1);

    const goTo = (nextIndex, nextDirection) =>
        setState({ id: rows[nextIndex].id, index: nextIndex, direction: nextDirection });

    const advance = () => {
        if (safeIndex < rows.length - 1) goTo(safeIndex + 1, 1);
    };
    const retreat = () => {
        if (safeIndex > 0) goTo(safeIndex - 1, -1);
    };

    const row = rows[safeIndex];

    // Pin whatever card is shown (first card, or the next one after a delete).
    useEffect(() => {
        if (row && (row.id !== currentId || safeIndex !== index)) {
            setState((prev) => ({ ...prev, id: row.id, index: safeIndex }));
        }
    }, [row?.id, safeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative w-full" style={{ height: '70dvh' }}>
            <div
                className="flex items-center justify-center pb-2 text-sm text-gray-600 font-mono"
                dir="ltr">
                {rows.length > 0 ? `${safeIndex + 1} / ${rows.length}` : '0 / 0'}
            </div>

            <div className="relative overflow-hidden h-[calc(100%-2rem)]">
                {row ? (
                    <AnimatePresence custom={direction} initial={false}>
                        <motion.div
                            key={row.id}
                            className="absolute inset-0"
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: 'spring', stiffness: 420, damping: 38, mass: 0.6 },
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_, info) => {
                                // RTL: swipe right advances to the next card,
                                // swipe left goes back to the previous one.
                                if (
                                    info.offset.x > SWIPE_OFFSET ||
                                    info.velocity.x > SWIPE_VELOCITY
                                ) {
                                    advance();
                                } else if (
                                    info.offset.x < -SWIPE_OFFSET ||
                                    info.velocity.x < -SWIPE_VELOCITY
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
                                unmarkDuplicate={unmarkDuplicate}
                                liveEdits={liveEdits}
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
