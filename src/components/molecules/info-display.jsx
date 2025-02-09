import { CurrencyAmount } from "../atoms/currency-amount";

const InfoDisplay = ({ label, amount, additionalText = "", showColorIndication = false }) => (
    <div className="flex flex-col items-center gap-2 shadow-md">
        <span className="text-[10px] md:text-sm">{label} {additionalText}</span>
        <CurrencyAmount
            amount={amount}
            isPositive={showColorIndication && amount > 0}
            isNegative={showColorIndication && amount < 0} />
    </div>
);

export default InfoDisplay;