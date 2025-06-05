'use client';
import keys from "@/app/he.json";
import { Categories } from "@/constants";

export const CategoriesDropdown = ({ value = "", onCategoryChange }) => {
    return (
        <div className="flex flex-row-reverse flex-wrap gap-2 w-full text-right items-end justify-end">
            {Object
                .entries(keys.categories)
                .filter(([key, category]) => value === "" ? true : value === key)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([key, value]) => (
                    <button
                        key={key}
                        className="dark:bg-neutral-800 hover:bg-amber-500 hover:text-white p-1"
                        onClick={() => onCategoryChange(key)}>
                        {Categories[key].emoji} {value}
                    </button>
                ))}
        </div>
    );
};