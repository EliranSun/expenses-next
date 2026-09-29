'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { CaretLeftIcon } from '@phosphor-icons/react';
import keys from '@/app/he.json';
import { ExpenseRow, formatCurrency } from './ExpenseRow';
import { buildTree, bucketSmall, layoutLevel, pathStep, resolvePath } from './treemapLayout';

// Below these areas (px²) a tile can't hold a label, so it joins an "N more"
// branch instead of being drawn as a sliver.
const TILE_MIN_AREA = 48 * 32;
const INNER_MIN_AREA = 14 * 14;
// A branch tile shows its own children only when there's room around its chip.
const NEST_MIN_W = 56;
const NEST_MIN_H = 48;

const MODES = [
    { id: 'expenses', label: keys.expenses },
    { id: 'income', label: keys.income },
];

const compactCurrency = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('he-IL', { style: 'percent', maximumFractionDigits: 1 });

const countLeaves = (node) =>
    node.children ? node.children.reduce((sum, child) => sum + countLeaves(child), 0) : 1;

const nodeLabel = (node) =>
    node.kind === 'group' ? keys.treemap_more.replace('{count}', countLeaves(node)) : node.label;

// Bigger tiles get a stronger tint so rank reads at a glance. --tm-base is the
// page background, so the same mix works in light and dark mode.
const tint = (node, rank, strength = 1) => {
    const pct = Math.round(Math.max(14, 42 - rank * 4) * strength);
    return { backgroundColor: `color-mix(in srgb, ${node.color} ${pct}%, var(--tm-base))` };
};

const box = ({ x, y, w, h }) => ({ insetInlineStart: x, top: y, width: w, height: h });

function useSize(ref) {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ width: Math.floor(width), height: Math.floor(height) });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return size;
}

function TileLabel({ node, w, h, focusValue }) {
    if (w < 36 || h < 18) return null;
    const showAmount = h >= 34;
    const showShare = h >= 50 && w >= 72;
    return (
        <div className="absolute inset-0 p-1.5 flex flex-col overflow-hidden text-start leading-tight">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {node.emoji && <span className="me-1">{node.emoji}</span>}
                {nodeLabel(node)}
            </span>
            {showAmount && (
                <span className="text-[11px] tabular-nums text-gray-700 dark:text-gray-300 truncate">
                    {w < 90 ? compactCurrency.format(node.value) : formatCurrency(node.value)}
                </span>
            )}
            {showShare && (
                <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 truncate">
                    {percent.format(node.value / focusValue)}
                </span>
            )}
        </div>
    );
}

// A child of the focused node. Branches big enough show their own children
// (unlabelled unless roomy) under a name chip; the rest are a single tile.
function Tile({ tile, rank, focusValue, selectedId, onOpen, onSelect, onHover }) {
    const { node, w, h } = tile;
    const nested = node.children && w >= NEST_MIN_W && h >= NEST_MIN_H;

    const inner = useMemo(() => {
        if (!nested) return [];
        return layoutLevel(bucketSmall(node, w * h, INNER_MIN_AREA), w, h, 1);
    }, [nested, node, w, h]);

    const activate = (target, via) => (event) => {
        event.stopPropagation();
        if (target.children) onOpen(via ? [via, target] : [target]);
        else onSelect(target);
    };

    const ariaLabel = `${nodeLabel(node)}, ${formatCurrency(node.value)}`;

    if (!nested) {
        return (
            <button
                type="button"
                aria-label={ariaLabel}
                title={ariaLabel}
                onClick={activate(node)}
                onMouseEnter={() => onHover(node)}
                style={{ ...box(tile), ...tint(node, rank) }}
                className={classNames(
                    'absolute rounded-md overflow-hidden hover:brightness-95 dark:hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500',
                    {
                        'bg-[image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(0,0,0,0.05)_6px_12px)]': node.kind === 'group',
                        'ring-2 ring-inset ring-blue-500': node.id === selectedId,
                    },
                )}>
                <TileLabel node={node} w={w} h={h} focusValue={focusValue} />
            </button>
        );
    }

    return (
        <div
            style={{ ...box(tile), ...tint(node, rank, 0.6) }}
            onMouseEnter={() => onHover(node)}
            className="absolute rounded-md overflow-hidden">
            {inner.map((sub, subRank) => {
                const label = `${nodeLabel(sub.node)}, ${formatCurrency(sub.node.value)}`;
                const roomy = sub.w >= 72 && sub.h >= 52;
                return (
                    <button
                        key={sub.node.id}
                        type="button"
                        tabIndex={-1}
                        aria-label={label}
                        title={label}
                        onClick={activate(sub.node, node)}
                        onMouseEnter={(event) => {
                            event.stopPropagation();
                            onHover(sub.node);
                        }}
                        style={{ ...box(sub), ...tint(sub.node, rank + subRank) }}
                        className={classNames(
                            'absolute overflow-hidden hover:brightness-95 dark:hover:brightness-125',
                            { 'ring-2 ring-inset ring-blue-500': sub.node.id === selectedId },
                        )}>
                        {roomy && (
                            <span className="absolute bottom-1 inset-x-1.5 text-[11px] leading-tight text-gray-800 dark:text-gray-200 truncate text-start">
                                {nodeLabel(sub.node)}
                            </span>
                        )}
                    </button>
                );
            })}
            <button
                type="button"
                aria-label={ariaLabel}
                title={ariaLabel}
                onClick={activate(node)}
                onMouseEnter={() => onHover(node)}
                className="absolute top-1 start-1 max-w-[calc(100%-0.5rem)] flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/85 dark:bg-gray-900/85 shadow-sm text-xs leading-tight hover:bg-white dark:hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                {node.emoji && <span>{node.emoji}</span>}
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{nodeLabel(node)}</span>
                {w >= 120 && (
                    <span className="tabular-nums text-gray-600 dark:text-gray-400 shrink-0">
                        {compactCurrency.format(node.value)}
                    </span>
                )}
            </button>
        </div>
    );
}

function Breadcrumbs({ trail, onJump }) {
    return (
        <nav aria-label={keys.treemap_path} className="flex items-center gap-1 flex-wrap min-w-0 text-sm">
            {trail.map((node, index) => {
                const isLast = index === trail.length - 1;
                return (
                    <span key={node.id} className="flex items-center gap-1 min-w-0">
                        {index > 0 && <CaretLeftIcon size={12} className="shrink-0 text-gray-400" />}
                        {isLast ? (
                            <span aria-current="page" className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                {node.emoji && <span className="me-1">{node.emoji}</span>}
                                {nodeLabel(node)}
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onJump(index)}
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                                {node.emoji && <span className="me-1">{node.emoji}</span>}
                                {nodeLabel(node)}
                            </button>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

// Zoomable treemap: tile area is always proportional to amount. Items too small
// to label are folded into an "N more" tile of the same total area; tapping any
// branch zooms in so its children fill the map at their true relative sizes.
export function TreemapView({ items, onHide, onEdit }) {
    const [mode, setMode] = useState('expenses');
    const [steps, setSteps] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const mapRef = useRef(null);
    const { width, height } = useSize(mapRef);

    const { tree, skipped } = useMemo(
        () => buildTree(items, mode, mode === 'income' ? keys.income : keys.expenses),
        [items, mode],
    );

    // Hovered nodes belong to the previous tree once a row is hidden or edited.
    useEffect(() => setHovered(null), [tree]);

    const trail = useMemo(() => resolvePath(tree, steps), [tree, steps]);
    const focus = trail[trail.length - 1];

    const tiles = useMemo(
        () => layoutLevel(bucketSmall(focus, width * height, TILE_MIN_AREA), width, height, 2),
        [focus, width, height],
    );

    const selectedItem = useMemo(
        () => items.find((item) => `item:${item.id}` === selectedId) ?? null,
        [items, selectedId],
    );

    const zoomTo = (nodes) => {
        setSteps(trail.slice(1).map(pathStep).concat(nodes.map(pathStep)));
        setHovered(null);
    };

    const jump = (index) => {
        setSteps((prev) => prev.slice(0, index));
        setHovered(null);
    };

    const switchMode = (next) => {
        setMode(next);
        setSteps([]);
        setHovered(null);
        setSelectedId(null);
    };

    const info = hovered ?? focus;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
                <div role="group" aria-label={keys.view_treemap} className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                    {MODES.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={mode === id}
                            onClick={() => switchMode(id)}
                            className={classNames('px-3 py-1 rounded-md transition-colors', {
                                'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm font-bold': mode === id,
                                'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': mode !== id,
                            })}>
                            {label}
                        </button>
                    ))}
                </div>
                <Breadcrumbs trail={trail} onJump={jump} />
            </div>

            <div
                ref={mapRef}
                onMouseLeave={() => setHovered(null)}
                className="relative w-full h-[60vh] min-h-[320px] max-h-[640px] [--tm-base:#ffffff] dark:[--tm-base:#111827] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {tree.children.length === 0 ? (
                    <p className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {keys.no_data}
                    </p>
                ) : (
                    <motion.div
                        key={`${mode}:${focus.id}`}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0">
                        {tiles.map((tile, rank) => (
                            <Tile
                                key={tile.node.id}
                                tile={tile}
                                rank={rank}
                                focusValue={focus.value}
                                selectedId={selectedId}
                                onOpen={zoomTo}
                                onSelect={(node) => setSelectedId(node.id)}
                                onHover={setHovered}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap text-sm min-h-[1.5rem]" aria-live="polite">
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-full">
                    {info.emoji && <span className="me-1">{info.emoji}</span>}
                    {nodeLabel(info)}
                </span>
                <span className="tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(info.value)}</span>
                {info !== focus && focus.value > 0 && (
                    <span className="tabular-nums text-gray-500 dark:text-gray-400">
                        {percent.format(info.value / focus.value)}
                    </span>
                )}
                {info.children && (
                    <span className="text-gray-500 dark:text-gray-400">
                        {countLeaves(info)} {keys.transactions}
                    </span>
                )}
                {skipped > 0 && info === focus && trail.length === 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        · {keys.treemap_refunds_hidden.replace('{count}', skipped)}
                    </span>
                )}
            </div>

            {selectedItem && (
                <ul className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                    <ExpenseRow item={selectedItem} onHide={onHide} onEdit={onEdit} />
                </ul>
            )}
        </div>
    );
}
