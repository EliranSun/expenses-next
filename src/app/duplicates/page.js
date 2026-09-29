import { findDuplicateGroups, deleteExpenses, dismissDuplicateGroup } from '@/utils/db';
import { MainNavBar } from '@/components/molecules/MainNavBar';
import { DuplicateGroupList } from '@/components/organisms/DuplicateGroupList';
import keys from '@/app/he.json';

export const dynamic = 'force-dynamic';

export default async function Duplicates() {
    const groups = await findDuplicateGroups();

    return (
        <div className="p-4">
            <MainNavBar />
            <h1 className="text-2xl font-bold text-center my-4">
                {keys.duplicates_title} ({groups.length})
            </h1>
            <p className="text-sm text-gray-500 text-center mb-4">
                {keys.duplicates_subtitle}
            </p>
            <DuplicateGroupList
                groups={groups}
                deleteExpenses={deleteExpenses}
                dismissDuplicateGroup={dismissDuplicateGroup}
            />
        </div>
    );
}
