import { AccountName } from "@/constants/account";

const PILL_COLORS = {
    private: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
    shared: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
};

export const AccountPill = ({ account }) => {
    const accountName = AccountName[account];
    if (!accountName) return null;

    return (
        <span
            title={account}
            className={`text-xs font-normal rounded-full px-2 py-0.5 shrink-0 ${PILL_COLORS[accountName.name] ?? ""}`}>
            {accountName.translation}
        </span>
    );
};
