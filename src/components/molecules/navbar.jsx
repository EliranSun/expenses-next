'use client';
import { useRouter } from 'next/navigation';
import { Categories } from '@/constants';
import { useSearchParams } from 'next/navigation';

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
        <ul className="flex flex-wrap gap-2 md:grid md:grid-cols-12 md:gap-4 
        w-full border-2 border-b border-gray-400 py-1">
            {children}
        </ul>
    );
};

export const Navbar = ({ year, month }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categories = searchParams.get("category") ? searchParams.get("category").split(",") : [];
    const account = searchParams.get("account");

    return (
        <div className='flex flex-col text-sm cursor-pointer'>
            <NavbarRow>
                {Years.map((y) => (
                    <li
                        key={y}
                        onClick={() => router.push(preserveQueryParams(`/${y}/${month}`))}

                        className={(y === year ? "bg-amber-500 text-white" : "")}>{`20${y}`}</li>
                ))}
            </NavbarRow>

            <NavbarRow>
                {Months.map((m) => (
                    <li
                        key={m}
                        onClick={() => router.push(preserveQueryParams(`/${year}/${m}`))}
                        className={(m === month ? "bg-amber-500 text-white" : "")}>{m}</li>
                ))}
            </NavbarRow>

            <NavbarRow>
                {Object.entries(Categories).map(([key, value]) => (
                    <li
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
                        className={`flex text-xs px-1 ${categories.includes(key) ? "bg-amber-500 text-white" : ""}`}>
                        {value.emoji} {value.name}
                    </li>
                ))}
            </NavbarRow>

            <NavbarRow>
                <li
                    className={`${account === "all" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: null }))}>
                    All
                </li>
                <li
                    className={`${account === "private" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "private" }))}>
                    Private
                </li>
                <li
                    className={`${account === "shared" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "shared" }))}>
                    Shared
                </li>
                <li
                    className={`${account === "wife" ? "bg-amber-500 text-white" : ""}`}
                    onClick={() => router.push(preserveQueryParams(`/${year}/${month}`, { account: "wife" }))}>
                    Wife
                </li>
            </NavbarRow>
        </div>
    );
};
