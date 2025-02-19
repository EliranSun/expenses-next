'use client';
import { useRouter } from 'next/navigation';
import { Categories } from '@/constants';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';

const buildPath = (path, newParams = {}) => {
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
    const accountOrFunctionality = pathname.split("/")[1];
    const year = pathname.split("/")[2];
    const month = pathname.split("/")[3];

    return (
        <div className='w-full flex flex-col text-sm cursor-pointer'>
            <NavbarRow>
                <NavbarItem
                    isSelected={pathname === '/'}
                    onClick={() => router.push(buildPath(`/`))}>🏠</NavbarItem>
                <NavbarItem
                    isSelected={accountOrFunctionality === 'add'}
                    onClick={() => router.push(buildPath(`/add`))}>➕</NavbarItem>
            </NavbarRow>
            <NavbarRow>
                <NavbarItem
                    isSelected={accountOrFunctionality === 'all'}
                    onClick={() => router.push(buildPath("/all"))}>
                    All
                </NavbarItem>
                <NavbarItem
                    isSelected={accountOrFunctionality === "private"}
                    className={`${accountOrFunctionality === "private" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(buildPath("/private"))}>
                    Private
                </NavbarItem>
                <NavbarItem
                    isSelected={accountOrFunctionality === "shared"}
                    className={`${accountOrFunctionality === "shared" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(buildPath("/shared"))}>
                    Shared
                </NavbarItem>
                <NavbarItem
                    isSelected={accountOrFunctionality === "wife"}
                    className={`${accountOrFunctionality === "wife" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(buildPath("/wife"))}>
                    Wife
                </NavbarItem>
            </NavbarRow>
            <NavbarRow>
                {Years.map((yearNumber) => (
                    <NavbarItem
                        key={yearNumber}
                        isSelected={year?.toLowerCase() === yearNumber.toLowerCase()}
                        onClick={() => router.push(buildPath(`/${accountOrFunctionality}/${yearNumber}`))}
                    >
                        {`20${yearNumber}`}
                    </NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Months.map((monthNumber) => (
                    <NavbarItem
                        key={monthNumber}
                        isSelected={month?.toLowerCase() === monthNumber.toLowerCase()}
                        onClick={() => router.push(buildPath(`/${accountOrFunctionality}/${year}/${monthNumber}`))}>
                        {monthNumber}
                    </NavbarItem>
                ))}
            </NavbarRow>
            <NavbarRow>
                {Object.entries(Categories).map(([key, value]) => (
                    <NavbarItem
                        key={key}
                        isSelected={categories.includes(key)}
                        className={`flex text-xs ${categories.includes(key) ? "bg-amber-500 text-white" : ""}`}
                        onClick={() => {
                            const categoryIndex = categories.indexOf(key);

                            if (categoryIndex > -1) {
                                categories.splice(categoryIndex, 1);
                            } else {
                                categories.push(key);
                            }

                            const newCategory = categories.length ? categories.join(",") : null;
                            const existingPath = `/${accountOrFunctionality}/${year}/${month}`;
                            router.push(buildPath(existingPath, { category: newCategory }));
                        }}>
                        {value.emoji}{value.name.slice(0, 2)}
                    </NavbarItem>
                ))}
            </NavbarRow>

        </div>
    );
};
