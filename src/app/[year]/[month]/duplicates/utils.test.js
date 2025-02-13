import { getDuplicates } from './utils';

describe('getDuplicates', () => {
    it('should return an empty array when no expenses are provided', () => {
        const result = getDuplicates([]);
        expect(result).toEqual([]);
    });

    it('should return an empty array when there are no duplicates', () => {
        const expenses = [
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 }
        ];
        const result = getDuplicates(expenses);
        expect(result).toEqual([]);
    });

    it('should return duplicates when there are multiple identical expenses', () => {
        const expenses = [
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 }
        ];
        const result = getDuplicates(expenses);
        expect(result).toEqual([
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 }
        ]);
    });

    it('should handle multiple groups of duplicates', () => {
        const expenses = [
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 }
        ];
        const result = getDuplicates(expenses);
        expect(result).toEqual([
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Coffee', date: '2023-10-01', amount: 3.5 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 },
            { name: 'Lunch', date: '2023-10-01', amount: 12.0 }
        ]);
    });
});
