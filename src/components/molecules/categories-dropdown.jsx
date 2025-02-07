'use client';
import keys from "@/app/he.json";
import { Categories } from "@/constants";

export const CategoriesDropdown = ({ value = "", onChange }) => {
    return (
        <select
            className="bg-transparent"
            value={value}
            onChange={(e) => onChange(e.target.value)}>
            <option value="" className="dark:bg-neutral-800">
                -
            </option>
            {Object.entries(keys.categories).sort((a, b) => a[1].localeCompare(b[1])).map(([key, value]) => (
                <option
                    key={key}
                    className="dark:bg-neutral-800"
                    value={key}>
                    {Categories[key].emoji} {value}
                </option>
            ))}
        </select>
    );
};