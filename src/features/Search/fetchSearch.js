export async function fetchSearch(term, { limit, signal } = {}) {
    const params = new URLSearchParams({ q: term });
    if (limit) params.set('limit', String(limit));
    const res = await fetch(`/api/search?${params}`, { signal });
    if (!res.ok) throw new Error(`search failed: ${res.status}`);
    return res.json();
}
