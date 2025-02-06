'use client';

import { useMemo } from "react";

export const CurrencyAmount = ({ amount = 100 }) => {
    const currencyAmount = useMemo(() => {
        return Math.round(amount).toLocaleString('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }, [amount]);

    return <span>{currencyAmount}</span>;
};
