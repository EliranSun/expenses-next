import { buildTree, bucketSmall, layoutLevel, pathStep, resolvePath } from './treemapLayout';

const items = [
    { id: 'a', name: 'SUPERMARKET', amount: 100, category: 'groceries' },
    { id: 'b', name: 'SUPERMARKET', amount: 60, category: 'groceries' },
    { id: 'c', name: 'MARKET', amount: 40, category: 'groceries' },
    { id: 'd', name: 'NETFLIX', amount: 50, category: 'subscriptions' },
    { id: 'e', name: 'REFUND', amount: -20, category: 'subscriptions' },
    { id: 'f', name: 'SALARY', amount: 1000, category: 'income' },
];

describe('buildTree', () => {
    it('nests category > merchant > transaction and skips refunds', () => {
        const { tree, skipped } = buildTree(items, 'expenses', 'root');

        expect(skipped).toBe(1);
        expect(tree.value).toBe(250);
        expect(tree.children.map((c) => [c.id, c.value])).toEqual([
            ['cat:groceries', 200],
            ['cat:subscriptions', 50],
        ]);
        const [supermarket, market] = tree.children[0].children;
        expect(supermarket).toMatchObject({ kind: 'merchant', value: 160 });
        expect(supermarket.children).toHaveLength(2);
        expect(market).toMatchObject({ kind: 'item', id: 'item:c' });
    });

    it('skips the category level when there is only one (income)', () => {
        const { tree } = buildTree(items, 'income', 'root');
        expect(tree.children.map((c) => c.id)).toEqual(['item:f']);
    });
});

describe('bucketSmall', () => {
    const parent = {
        id: 'p',
        value: 1000,
        children: [
            { id: 'big', value: 900 },
            { id: 's1', value: 60 },
            { id: 's2', value: 30 },
            { id: 's3', value: 10 },
        ],
    };

    it('folds tiles below the minimum area into one branch of the same total', () => {
        // 10,000 px² → s1 = 600, s2 = 300, s3 = 100; threshold 700.
        const result = bucketSmall(parent, 10000, 700);
        expect(result.map((n) => n.id)).toEqual(['big', 'group:p:s1']);
        expect(result[1]).toMatchObject({ kind: 'group', value: 100, memberIds: ['s1', 's2', 's3'] });
    });

    it('leaves a lone small tile alone', () => {
        expect(bucketSmall(parent, 10000, 250).map((n) => n.id)).toEqual(['big', 's1', 's2', 's3']);
        expect(bucketSmall(parent, 10000, 350).map((n) => n.id)).toEqual(['big', 's1', 'group:p:s2']);
    });
});

describe('layoutLevel', () => {
    it('gives each tile an area proportional to its value', () => {
        const tiles = layoutLevel([{ id: 'x', value: 3 }, { id: 'y', value: 1 }], 400, 100);
        const area = Object.fromEntries(tiles.map((t) => [t.node.id, t.w * t.h]));
        expect(area.x + area.y).toBe(40000);
        expect(area.x / area.y).toBeCloseTo(3, 1);
    });
});

describe('resolvePath', () => {
    it('follows ids and rebuilds groups from their member ids', () => {
        const { tree } = buildTree(items, 'expenses', 'root');
        const groceries = tree.children[0];
        const group = bucketSmall(groceries, 1000, 300).find((n) => n.kind === 'group');
        // Only MARKET (40/200 of 1000 = 200px²) is small, so no group forms.
        expect(group).toBeUndefined();

        const steps = [pathStep(groceries), { id: 'group:x', memberIds: ['name:groceries:SUPERMARKET', 'item:c'] }];
        const trail = resolvePath(tree, steps);
        expect(trail.map((n) => n.id)).toEqual(['root', 'cat:groceries', 'group:x']);
        expect(trail[2].value).toBe(200);
    });

    it('stops at the deepest step that still exists', () => {
        const { tree } = buildTree(items, 'expenses', 'root');
        const trail = resolvePath(tree, [{ id: 'cat:groceries' }, { id: 'name:groceries:GONE' }]);
        expect(trail.map((n) => n.id)).toEqual(['root', 'cat:groceries']);
    });
});
