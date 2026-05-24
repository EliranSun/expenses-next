import { findSuspiciousExpenses, deleteExpense } from '@/utils/db';
import { MainNavBar } from '@/components/molecules/MainNavBar';
import { SuspiciousRowList } from '@/components/organisms/SuspiciousRowList';

export const dynamic = 'force-dynamic';

export default async function Admin() {
    const rows = await findSuspiciousExpenses();

    return (
        <div className="p-4">
            <MainNavBar />
            <h1 dir="rtl" className="text-2xl font-bold text-center my-4">
                Suspicious rows ({rows.length})
            </h1>
            <p dir="rtl" className="text-sm text-gray-500 text-center mb-4">
                Rows with NULL/blank/&quot;null&quot; values in required fields. Review and delete bad data.
            </p>
            <SuspiciousRowList rows={rows} deleteExpense={deleteExpense} />
        </div>
    );
}
