'use client';
import { useRouter } from 'next/navigation';
import { Categories } from '@/constants';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
// Utility function to preserve and update query parameters
const preserveQueryParams = (path, newParams = {}) => {
    const query = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
            query.delete(key);
        } else {
            query.set(key, value);
        }
    });
    return `${path}?${query.toString()}`;
};

const Years = ['22', '23', '24', '25', '26'];
const Months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const NavbarRow = ({ children }) => {
    return (
        <ul className="flex flex-wrap gap-0 md:grid md:grid-cols-12
        w-full border-b border-gray-400">
            {children}
        </ul>
    );
};

const NavbarItem = ({ children, isSelected, ...rest }) => {
    return (
        <li {...rest} className={`hover:bg-amber-500 hover:text-white 
            ${isSelected ? "bg-amber-500 text-white" : ""}`}>{children}</li>
    );
};

export const Navbar = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const categories = searchParams.get("category") ? searchParams.get("category").split(",") : [];
    const account = searchParams.get("account");
    const year = pathname.split("/")[1];
    const month = pathname.split("/")[2];

    console.log({ pathname, year, month });

    return (
        <div className='flex flex-col text-sm cursor-pointer'>
            <NavbarRow>
                <NavbarItem
                    isSelected={pathname === '/'}
                    onClick={() => router.push(preserveQueryParams(`/`))}>ALL</NavbarItem>
                <NavbarItem
                    isSelected={year.toLowerCase() === 'add'}
                    onClick={() => router.push(preserveQueryParams(`/add`))}>ADD</NavbarItem>
            </NavbarRow>
            <NavbarRow>
                {Years.map((y) => (
                    <NavbarItem
                        key={y}
                        isSelected={year.toLowerCase() === y.toLowerCase()}
                        onClick={() => router.push(preserveQueryParams(`/${y}`))}
                    >{`20${y}`}</NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Months.map((m) => (
                    <NavbarItem
                        key={m}
                        isSelected={month?.toLowerCase() === m.toLowerCase()}
                        onClick={() => router.push(preserveQueryParams(`/${year}/${m}`))}
                    >{m}</NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Object.entries(Categories).map(([key, value]) => (
                    <NavbarItem
                        key={key}
                        onClick={() => {
                            const categoryIndex = categories.indexOf(key);

                            if (categoryIndex > -1) {
                                categories.splice(categoryIndex, 1);
                            } else {
                                categories.push(key);
                            }

                            const newCategory = categories.length ? categories.join(",") : null;
                            router.push(preserveQueryParams(`/${year}/${month}`, { category: newCategory }));
                        }}
                        className={`flex text-xs ${categories.includes(key) ? "bg-amber-500 text-white" : ""}`}>
                        {value.name}
                    </NavbarItem>
                ))}
            </NavbarRow>

            <NavbarRow>
                <NavbarItem
                    className={`${account === "all" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: null }))}>
                    All
                </NavbarItem>
                <NavbarItem
                    className={`${account === "private" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "private" }))}>
                    Private
                </NavbarItem>
                <NavbarItem
                    className={`${account === "shared" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "shared" }))}>
                    Shared
                </NavbarItem>
                <NavbarItem
                    className={`${account === "wife" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "wife" }))}>
                    Wife
                </NavbarItem>
            </NavbarRow>
        </div>
    );
};
