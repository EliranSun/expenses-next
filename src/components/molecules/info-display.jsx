import { CurrencyAmount } from "../atoms/currency-amount";

const InfoDisplay = ({ label, amount, additionalText = "" }) => (
    <div className="flex flex-col items-center gap-2 text-xs shadow-md">
        <span>{label} {additionalText}</span>
        <CurrencyAmount amount={amount} />
    </div>
);

export default InfoDisplay;