import { CurrencyAmount } from "../atoms/currency-amount";
import classNames from "classnames";

const InfoDisplay = ({
    label,
    amount,
    additionalText = "",
    showColorIndication = false,
    showPercentage = false,
    isVisible = true,
    round = false
}) => (
    <div className={classNames("flex flex-col items-center", {
        "hidden": !isVisible
    })}>
        <span className="">{label} {additionalText}</span>
        {showPercentage
            ? <span className="">{amount}%</span>
            : <CurrencyAmount
                amount={amount}
                short={round}
                isPositive={showColorIndication && amount > 0}
                isNegative={showColorIndication && amount < 0} />}
    </div>
);

export default InfoDisplay;