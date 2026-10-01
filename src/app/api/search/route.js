import { NextResponse } from 'next/server';
import { searchExpenses } from '@/utils/db';

export const dynamic = 'force-dynamic';

// Results change with every edit, so nothing caches them over HTTP; the
// client keeps its own short-lived cache instead.
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const limit = searchParams.get('limit') ?? undefined;
    try {
        const rows = await searchExpenses(q, { limit });
        return NextResponse.json(rows, { headers: NO_STORE });
    } catch (error) {
        console.error('search failed:', error);
        return NextResponse.json({ error: 'search failed' }, { status: 500, headers: NO_STORE });
    }
}
