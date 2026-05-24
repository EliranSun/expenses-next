'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Categories } from '@/constants';
import classNames from 'classnames';

const buildSearchParams = (currentParams, newParams = {}) => {
    const query = new URLSearchParams(currentParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
            query.delete(key);
        } else {
            query.set(key, value);
        }
    });
    return query.toString();
};

const Years = ['22', '23', '24', '25', '26', '27', '28'];
const Months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const Accounts = ['all', 'private', 'shared', 'wife'];

const FilterGroup = ({ label, children }) => (
    <div className="flex items-center gap-2 flex-wrap">
        {label && (
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 w-16 shrink-0">
                {label}
            </span>
        )}
        <div className="flex gap-1 flex-wrap">{children}</div>
    </div>
);

const Pill = ({ isSelected, onClick, children, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={classNames(
            'px-3 py-1 rounded-full text-sm transition-colors cursor-pointer',
            'border',
            {
                'bg-amber-500 text-white border-amber-500': isSelected,
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-amber-400': !isSelected,
            },
            className,
        )}>
        {children}
    </button>
);

export const Navbar = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const account = searchParams.get('account') || '';
    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';
    const categories = searchParams.get('category') ? searchParams.get('category').split(',') : [];

    const updateSearchParams = (newParams) => {
        const next = buildSearchParams(searchParams, newParams);
        router.push(`${pathname}?${next}`);
    };

    return (
        <div className="flex flex-col gap-3">
            <FilterGroup label="Account">
                {Accounts.map((accountName) => (
                    <Pill
                        key={accountName}
                        isSelected={account === accountName}
                        onClick={() =>
                            updateSearchParams({ account: account === accountName ? null : accountName })
                        }>
                        {accountName.charAt(0).toUpperCase() + accountName.slice(1)}
                    </Pill>
                ))}
            </FilterGroup>

            <FilterGroup label="Year">
                {Years.map((yearNumber) => (
                    <Pill
                        key={yearNumber}
                        isSelected={year === yearNumber}
                        onClick={() =>
                            updateSearchParams({ year: year === yearNumber ? null : yearNumber })
                        }>
                        20{yearNumber}
                    </Pill>
                ))}
            </FilterGroup>

            <FilterGroup label="Month">
                {Months.map((monthNumber) => (
                    <Pill
                        key={monthNumber}
                        isSelected={month === monthNumber}
                        onClick={() =>
                            updateSearchParams({ month: month === monthNumber ? null : monthNumber })
                        }>
                        {monthNumber}
                    </Pill>
                ))}
            </FilterGroup>

            <FilterGroup label="Category">
                {Object.entries(Categories).map(([key, value]) => (
                    <Pill
                        key={key}
                        isSelected={categories.includes(key)}
                        className="flex items-center gap-1"
                        onClick={() => {
                            const list = [...categories];
                            const idx = list.indexOf(key);
                            if (idx > -1) list.splice(idx, 1);
                            else list.push(key);
                            updateSearchParams({ category: list.length ? list.join(',') : null });
                        }}>
                        <span>{value.emoji}</span>
                        <span className="hidden sm:inline">{value.name}</span>
                    </Pill>
                ))}
            </FilterGroup>
        </div>
    );
};
