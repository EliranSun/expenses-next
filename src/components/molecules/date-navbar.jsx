'use client';
import { useRouter } from 'next/navigation';
import { Categories } from '@/constants';

export const DateNavbar = ({ year, month, category }) => {
    const router = useRouter();
    return (
        <>

            <ul className="grid grid-cols-12 gap-4 w-10/12 border-b border-gray-200">
                {['24', '25', '26'].map((y) => (
                    <li
                        key={y}
                        onClick={() => router.push(`/${y}/${month}`)}
                        className={(y === year ? "bg-amber-500 text-white" : "")}>{`20${y}`}</li>
                ))}
            </ul>



            <ul className="grid grid-cols-12 gap-4 w-10/12 border-b border-gray-200">
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                    <li
                        key={m}
                        onClick={() => router.push(`/${year}/${m}`)}
                        className={(m === month ? "bg-amber-500 text-white" : "")}>{m}</li>
                ))}
            </ul>
            <ul className="flex items-center gap-4 w-10/12 border-b border-gray-200">
                {Object.entries(Categories).map(([key, value]) => (
                    <li
                        key={key}
                        onClick={() => router.push(`/${year}/${month}/${key}`)}
                        className={(key === category ? "bg-amber-500 text-white" : "")}>{value.emoji}</li>
                ))}
            </ul>
        </>

    );
};
