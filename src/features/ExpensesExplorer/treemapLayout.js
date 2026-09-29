import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { groupBy } from 'lodash';
import { Categories } from '@/constants';

const NEUTRAL = '#9CA3AF';

const sumValues = (nodes) => nodes.reduce((sum, node) => sum + node.value, 0);

const byValueDesc = (a, b) => b.value - a.value;

const leafNode = (item, color) => ({
    id: `item:${item.id}`,
    kind: 'item',
    label: item.name,
    value: item.amount,
    color,
    item,
});

// Several charges from the same merchant become one branch so repeat spending
// reads as one block; zooming in splits it back into transactions.
const merchantNodes = (categoryKey, items, color) =>
    Object.entries(groupBy(items, 'name')).map(([name, charges]) => {
        if (charges.length === 1) return leafNode(charges[0], color);
        const children = charges.map((item) => leafNode(item, color)).sort(byValueDesc);
        return {
            id: `name:${categoryKey}:${name}`,
            kind: 'merchant',
            label: name,
            value: sumValues(children),
            color,
            children,
        };
    }).sort(byValueDesc);

// root -> category -> merchant -> transaction. Only positive amounts can be
// drawn as area, so refunds are left out and counted for the caption.
export const buildTree = (items, mode, rootLabel) => {
    const wantIncome = mode === 'income';
    const inMode = items.filter((item) => (item.category === 'income') === wantIncome);
    const drawable = inMode.filter((item) => item.amount > 0);

    const categories = Object.entries(groupBy(drawable, 'category')).map(([key, categoryItems]) => {
        const meta = Categories[key];
        const color = meta?.color ?? NEUTRAL;
        const children = merchantNodes(key, categoryItems, color);
        return {
            id: `cat:${key}`,
            kind: 'category',
            label: meta?.name || key,
            emoji: meta?.emoji,
            value: sumValues(children),
            color,
            children,
        };
    }).sort(byValueDesc);

    // A single category (income usually is) adds a level with nothing to compare.
    const children = categories.length === 1 ? categories[0].children : categories;

    return {
        tree: { id: 'root', kind: 'root', label: rootLabel, value: sumValues(children), children },
        skipped: inMode.length - drawable.length,
    };
};

const groupNode = (parent, members) => ({
    id: `group:${parent.id}:${members[0].id}`,
    kind: 'group',
    label: '',
    value: sumValues(members),
    color: NEUTRAL,
    memberIds: members.map((member) => member.id),
    children: members,
});

// Children whose true-size tile would be under `minArea` px² are folded into
// one "N more" branch. The branch keeps their combined area, so nothing is
// scaled up to fit, and zooming into it lays them out again at a readable size.
export const bucketSmall = (parent, area, minArea) => {
    const children = [...(parent.children ?? [])].sort(byValueDesc);
    if (!parent.value || area <= 0) return children;
    const tooSmall = (node) => (node.value / parent.value) * area < minArea;
    const cut = children.findIndex(tooSmall);
    if (cut === -1 || children.length - cut < 2) return children;
    return [...children.slice(0, cut), groupNode(parent, children.slice(cut))];
};

// Squarified layout of one level of nodes in a width x height box. Areas stay
// proportional to value; only the gaps between tiles are taken off.
export const layoutLevel = (nodes, width, height, gap = 0) => {
    if (!nodes.length || width <= 0 || height <= 0) return [];
    const wrapper = { children: nodes };
    const root = hierarchy(wrapper, (d) => (d === wrapper ? d.children : null))
        .sum((d) => (d === wrapper ? 0 : d.value))
        .sort(byValueDesc);
    treemap().tile(treemapSquarify).size([width, height]).paddingInner(gap).round(true)(root);
    return (root.children ?? []).map(({ data, x0, y0, x1, y1 }) => ({
        node: data,
        x: x0,
        y: y0,
        w: x1 - x0,
        h: y1 - y0,
    }));
};

// The zoom path is stored as ids so it survives the tree being rebuilt (search,
// hiding a row, a resize regrouping small tiles). Steps that no longer resolve
// are dropped, which zooms out to the deepest node that still exists.
export const resolvePath = (tree, steps) => {
    const nodes = [tree];
    for (const step of steps) {
        const current = nodes[nodes.length - 1];
        const children = current.children ?? [];
        let next = children.find((child) => child.id === step.id);
        if (!next && step.memberIds) {
            const wanted = new Set(step.memberIds);
            const members = children.filter((child) => wanted.has(child.id)).sort(byValueDesc);
            if (members.length) next = { ...groupNode(current, members), id: step.id };
        }
        if (!next?.children) break;
        nodes.push(next);
    }
    return nodes;
};

export const pathStep = (node) =>
    node.memberIds ? { id: node.id, memberIds: node.memberIds } : { id: node.id };
