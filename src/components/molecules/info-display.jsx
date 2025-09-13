'use client';

import { CurrencyAmount } from "../atoms/currency-amount";
import classNames from "classnames";
import { CoinsIcon, ShoppingCartIcon, TrendUpIcon, TrendDownIcon } from "@phosphor-icons/react";

const IconNames = {
    coins: CoinsIcon,
    shoppingCart: ShoppingCartIcon,
    trendUp: TrendUpIcon,
    trendDown: TrendDownIcon
};

const Icon = ({ iconName }) => {
    const IconComponent = IconNames[iconName];
    return <IconComponent size={32} />;
};

const InfoDisplay = ({
    label,
    amount,
    outOf,
    additionalText = "",
    showColorIndication = false,
    percentage,
    isVisible = true,
    round = false,
    icon,
    iconName = "",
    emoji = "",
    isPositive = false,
    isNegative = false
}) => {
    return (
        <div className={classNames("flex items-center", {
            "bg-white grow p-2 md:p-8 rounded-xl shadow-md": true,
            "hidden": !isVisible,
            "flex-col": !icon,
            "justify-between": icon,
            "text-green-700": isPositive,
            "text-red-700": isNegative
        })}>
            {icon && <span>{icon}</span>}
            {iconName && IconNames[iconName] && <span><Icon iconName={iconName} /></span>}
            {emoji && <span>{emoji}</span>}
            <div className="flex flex-col items-center justify-center text-center w-full">
                <span className="text-sm">{label} {additionalText}</span>
                <div className="flex items-center gap-2">
                                            {outOf ? <span> / {outOf}</span> : null}
                    <CurrencyAmount
                        amount={amount}
                        short={round}
                        isPositive={showColorIndication && amount > 0}
                        isNegative={showColorIndication && amount < 0} />

                    {percentage &&
                        !isNaN(percentage) &&
                        percentage !== Infinity &&
                        percentage !== -Infinity &&
                        <span className="text-sm">({percentage}%)</span>}
                </div>
            </div>
        </div >
    );
}

export default InfoDisplay;