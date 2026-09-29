import { redirect } from 'next/navigation';

// איפה הכסף is now the budget view of the home page. Keep old links working.
export default async function MoneyPage({ searchParams }) {
    const { year, month, account } = await searchParams;
    const today = new Date();
    const query = new URLSearchParams({
        year: year ?? String(today.getFullYear() % 100).padStart(2, '0'),
        month: String(month ?? today.getMonth() + 1).padStart(2, '0'),
        view: 'budget',
    });
    if (account) query.set('account', account);
    redirect(`/?${query}`);
}
