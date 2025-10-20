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
  isVisible = true,
  round = false,
  icon,
  iconName = "",
  emoji = "",
  isPositive = false,
  isNegative = false,
}) => {
  if (!isVisible) return null;

  const percentage =
    outOf && outOf !== 0 ? Math.min((Math.abs(amount) / Math.abs(outOf)) * 100, 100) : 0;

  return (
    <div
      className={classNames(
        "flex items-center bg-white dark:bg-black grow p-4 md:p-6 rounded-xl shadow-md",
        {
          "flex-col": !icon,
          "justify-between": icon,
          "text-green-700": isPositive,
          "text-red-700": isNegative,
        }
      )}
    >
      {/* Icon / Emoji */}
      {icon && <span>{icon}</span>}
      {iconName && IconNames[iconName] && (
        <span>
          <Icon iconName={iconName} />
        </span>
      )}
      {emoji && <span>{emoji}</span>}

      {/* Content */}
      <div className="flex flex-col w-full text-center items-center">
        {label && (
          <span className="text-sm mb-2">
            {label} {additionalText}
          </span>
        )}

        {/* Amounts row */}
        <div className="flex justify-between w-full text-sm mb-1">
          <CurrencyAmount
            amount={Math.abs(amount)}
            short={round}
            isPositive={showColorIndication && amount > 0}
            isNegative={showColorIndication && amount < 0}
          />
          <CurrencyAmount amount={outOf} short={round} />
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
  <div
    style={{ width: `${percentage}%` }}
    className={classNames("h-full transition-all duration-300", {
      "bg-green-500 dark:bg-green-400": percentage < 100,
      "bg-red-500 dark:bg-red-400": percentage >= 100,
    })}
  />
</div

        {/* Optional percentage text */}
        <span className="text-xs mt-1 text-gray-500">
          {Number.isFinite(percentage) ? `${Math.round(percentage)}%` : "—"}
        </span>
      </div>
    </div>
  );
};

export default InfoDisplay;