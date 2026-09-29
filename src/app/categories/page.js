import { MainNavBar } from "@/components/molecules/MainNavBar";
import { Accounts } from "@/constants/account";
import { fetchCategoryMonthlyTotals } from "@/utils/db";
import { parseRange } from "@/utils/categoryRange";
import { CategoryAnalytics } from "./CategoryAnalytics";

export default async function CategoriesPage({ searchParams }) {
    const { category, from, to, account, chart } = await searchParams;
    const range = parseRange({ from, to });
    const selected = category ? category.split(",").filter(Boolean) : [];

    // Same guard as fetchExpenses: an account with no numbers has no rows.
    const accounts = account ? Accounts[account] : undefined;
    const rows = account && !accounts?.length
        ? []
        : await fetchCategoryMonthlyTotals({ startDate: range.startDate, endDate: range.endDate, accounts });

    return (
        <div className="p-4 max-w-screen-2xl mx-auto" dir="rtl">
            <MainNavBar />
            <CategoryAnalytics
                rows={rows}
                selected={selected}
                from={range.from}
                to={range.to}
                account={account ?? ""}
                chart={chart ?? ""} />
        </div>
    );
}
