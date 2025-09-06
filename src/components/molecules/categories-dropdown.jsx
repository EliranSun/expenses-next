'use client';
import keys from "@/app/he.json";
import { Categories } from "@/constants";

export const CategoriesDropdown = ({ value = "", onCategoryChange }) => {
    return (
        <div className={value
            ? "w-full border border-gray-300 rounded-xl p-2"
            : "grid grid-cols-4 gap-2 w-full bg-white rounded-xl p-2"}>
            {Object
                .entries(keys.categories)
                .filter(([key]) => value === "" ? true : value === key)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([key, value]) => (
                    <button
                        key={key}
                        className="dark:bg-neutral-800 hover:bg-amber-500 hover:text-white
                        text-right p-1"
                        onClick={() => onCategoryChange(key)}>
                        {Categories[key].emoji} {value.slice(0, 10)}
                    </button>
                ))}
        </div>
    );
};