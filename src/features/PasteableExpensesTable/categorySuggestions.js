import { Categories } from '@/constants';

// Bank exports print the same merchant with different spacing, punctuation and
// word order (wrapped PDF lines), so compare names by their sorted words.
export const nameKey = (name = '') =>
    name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .sort()
        .join(' ');

export const isSameName = (a, b) => a === b || nameKey(a) === nameKey(b);

export function buildCategoryIndex(history = []) {
    const index = new Map();
    history.forEach(({ name, category, count = 1, lastDate = '' }) => {
        if (!name || !Categories[category]) return;
        const key = nameKey(name);
        if (!key) return;
        const byCategory = index.get(key) ?? new Map();
        const prev = byCategory.get(category) ?? { count: 0, lastDate: '' };
        byCategory.set(category, {
            count: prev.count + Number(count),
            lastDate: lastDate > prev.lastDate ? lastDate : prev.lastDate,
        });
        index.set(key, byCategory);
    });
    return index;
}

// Returns the category used for most past expenses with this name, only when
// it covers the majority of them (so e.g. BIT transfers stay manual).
export function suggestCategory(name, index) {
    const byCategory = index.get(nameKey(name));
    if (!byCategory) return null;

    let total = 0;
    let best = null;
    byCategory.forEach((stats, category) => {
        total += stats.count;
        if (!best || stats.count > best.count || (stats.count === best.count && stats.lastDate > best.lastDate)) {
            best = { category, ...stats };
        }
    });

    return best.count / total > 0.5 ? best.category : null;
}

export function applyCategorySuggestions(rows, history) {
    const index = buildCategoryIndex(history);
    if (index.size === 0) return rows;
    return rows.map((row) => {
        if (row.category) return row;
        const category = suggestCategory(row.name, index);
        return category ? { ...row, category, autoCategory: true } : row;
    });
}
