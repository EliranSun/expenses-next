'use client';
import { useRouter } from 'next/navigation';
import { Categories } from '@/constants';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import classNames from 'classnames';

const buildSearchParams = (currentParams, newParams = {}) => {
    // Create a new URLSearchParams object from the current params
    const query = new URLSearchParams(currentParams.toString());

    // Update with new parameters
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

const NavbarRow = ({ children, cols }) => {
    return (
        <ul className={classNames("gap-1 bg-gray-100 rounded-md m-1 w-full", {
            "md:flex flex-wrap": !cols,
            "md:grid": cols > 0,
            "md:grid-cols-12": cols === 12 || !cols,
            "md:grid-cols-4": cols === 4,
            "md:grid-cols-6": cols === 6,
            "md:grid-cols-8": cols === 8,
            "md:grid-cols-7": cols === 7,
            "md:grid-cols-9": cols === 9,
            "md:grid-cols-10": cols === 10,
            "md:grid-cols-11": cols === 11,
        })}>
            {children}
        </ul>
    );
};

const NavbarItem = ({ children, isSelected, className, ...rest }) => {
    return (
        <li {...rest} className={`hover:bg-amber-500 hover:text-white p-2
            ${isSelected ? "bg-amber-500 text-white rounded-md" : ""} ${className}`}>{children}</li>
    );
};

export const Navbar = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Get all parameters from search params
    const account = searchParams.get("account") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const categories = searchParams.get("category") ? searchParams.get("category").split(",") : [];

    // Function to update search params and navigate
    const updateSearchParams = (newParams) => {
        const newSearchParams = buildSearchParams(searchParams, newParams);
        router.push(`${pathname}?${newSearchParams}`);
    };

    return (
        <div className='flex md:flex-col text-sm cursor-pointer'>
            <NavbarRow cols={4}>
                {Accounts.map((accountName) => (
                    <NavbarItem
                        key={accountName}
                        isSelected={account === accountName}
                        onClick={() => updateSearchParams({ account: accountName })}>
                        {accountName.charAt(0).toUpperCase() + accountName.slice(1)}
                    </NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Years.map((yearNumber) => (
                    <NavbarItem
                        key={yearNumber}
                        isSelected={year === yearNumber}
                        onClick={() => updateSearchParams({ year: yearNumber })}>
                        {`20${yearNumber}`}
                    </NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Months.map((monthNumber) => (
                    <NavbarItem
                        key={monthNumber}
                        isSelected={month === monthNumber}
                        onClick={() => updateSearchParams({ month: monthNumber })}>
                        {monthNumber}
                    </NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow cols={4}>
                {Object.entries(Categories).map(([key, value]) => (
                    <NavbarItem
                        key={key}
                        className="flex flex-col items-center justify-center"
                        isSelected={categories.includes(key)}
                        onClick={() => {
                            const categoryList = [...categories];
                            const categoryIndex = categoryList.indexOf(key);

                            if (categoryIndex > -1) {
                                categoryList.splice(categoryIndex, 1);
                            } else {
                                categoryList.push(key);
                            }

                            const newCategory = categoryList.length ? categoryList.join(",") : null;
                            updateSearchParams({ category: newCategory });
                        }}>
                        {value.emoji}
                        <span className='text-sm'>{value.name.slice(0, 6)}</span>
                    </NavbarItem>
                ))}
            </NavbarRow>
        </div>
    );
};
