'use client';
import keys from "@/app/he.json";

const Categories = {
    income: { name: "הכנסה", emoji: "💰", color: "#FFD700" },
    house: { name: "בית", emoji: "🏠", color: "#FF6347" },
    vacation: { name: "חופשה", emoji: "🌴", color: "#32CD32" },
    subscriptions: { name: "מינויים", emoji: "📺", color: "#1E90FF" },
    fees: { name: "עמלות", emoji: "💸", color: "#FF4500" },
    animals: { name: "חיות", emoji: "🐶", color: "#8B4513" },
    groceries: { name: "מצרכים", emoji: "🛒", color: "#FFDAB9" },
    transportation: { name: "תחבצ", emoji: "🚗", color: "#4682B4" },
    workout: { name: "כושר", emoji: "🏋️‍♂️", color: "#FF69B4" },
    self: { name: "עצמי", emoji: "👤", color: "#9370DB" },
    gifts: { name: "מתנות/תרומות", emoji: "🎁", color: "#FF1493" },
    wedding: { name: "חתונה", emoji: "💍", color: "#DAA520" },
    savings: { name: "חסכונות", emoji: "💰", color: "#B8860B" },
    car: { name: "רכב", emoji: "🚗", color: "#2E8B57" },
    restaurants: { name: "מסעדות/קפה", emoji: "🍴", color: "#FF8C00" }
};

export const CategoriesDropdown = ({ value }) => {
    return (
        <select value={value}>
            <option value="">---</option>
            {Object.entries(keys.categories).map(([key, value]) => (
                <option
                    key={key}
                    value={key}>
                    {Categories[key].emoji} {value}
                </option>
            ))}
        </select>
    );
};