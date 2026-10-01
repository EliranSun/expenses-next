/**
 * @jest-environment node
 */
import { GET } from './route';
import { searchExpenses } from '../../../utils/db';

jest.mock('../../../utils/db', () => ({ searchExpenses: jest.fn() }));

describe('GET /api/search', () => {
    it('passes q and limit through and disables HTTP caching', async () => {
        searchExpenses.mockResolvedValueOnce([{ id: '1' }]);

        const res = await GET(new Request('http://x/api/search?q=shuf&limit=20'));

        expect(searchExpenses).toHaveBeenCalledWith('shuf', { limit: '20' });
        expect(res.status).toBe(200);
        expect(res.headers.get('Cache-Control')).toBe('private, no-store');
        expect(await res.json()).toEqual([{ id: '1' }]);
    });

    it('returns 500 when the query fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        searchExpenses.mockRejectedValueOnce(new Error('boom'));

        const res = await GET(new Request('http://x/api/search?q=shuf'));

        expect(res.status).toBe(500);
    });
});
