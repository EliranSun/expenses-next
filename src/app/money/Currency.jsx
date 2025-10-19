const { default: classNames } = require("classnames");


export const Currency = ({ amount, label, col = false }) => {
    return (
        <div className={classNames("flex gap-2", {
            "flex-col": col
        })}>
            <span><b>{label}</b></span>
            <span>
                {Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(Math.abs(Math.round(amount / 10) * 10))}
            </span>
        </div>
    );
};
