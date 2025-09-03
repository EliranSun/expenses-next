import { CurrencyAmount } from "../atoms/currency-amount";
import classNames from "classnames";

const InfoDisplay = ({
    label,
    amount,
    additionalText = "",
    showColorIndication = false,
    percentage,
    isVisible = true,
    round = false,
    icon
}) => (
    <div className={classNames("flex items-center", {
        "bg-white p-8 rounded-xl shadow-md": true,
        "hidden": !isVisible,
        "flex-col": !icon,
        "justify-between": icon
    })}>
        {icon && <span>{icon}</span>}
        <div className="flex flex-col items-center justify-center text-center w-full">
            <span className="text-sm">{label} {additionalText}</span>
            <div className="flex items-center gap-2">
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

export default InfoDisplay;