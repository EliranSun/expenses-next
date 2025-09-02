'use client';

import { useMemo } from "react";

export const CurrencyAmount = ({ amount = 100, isPositive = false, isNegative = false, short = false }) => {
    const currencyAmount = useMemo(() => {
        return Math.round(amount).toLocaleString('he-IL', {
            compactDisplay: short ? 'short' : 'long',
            notation: short ? 'compact' : 'standard',
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }, [amount]);

    return (
        <span
            data-testid="currency-amount"
            className={`font-mono ${isPositive
                ? "text-green-500"
                : isNegative
                    ? "text-red-500"
                    : ""}`}>
            {currencyAmount}
        </span>
    );
};
