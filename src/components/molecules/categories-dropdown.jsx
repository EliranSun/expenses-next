'use client';
import keys from "@/app/he.json";
import { Categories } from "@/constants";

export const CategoriesDropdown = ({ value = "", onChange }) => {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">-</option>
            {Object.entries(keys.categories).sort((a, b) => a[1].localeCompare(b[1])).map(([key, value]) => (
                <option
                    key={key}
                    value={key}>
                    {Categories[key].emoji} {value}
                </option>
            ))}
        </select>
    );
};