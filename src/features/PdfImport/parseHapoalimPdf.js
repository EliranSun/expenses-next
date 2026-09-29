// Parses the text layer of a Bank Hapoalim "ניהול תקציב" (PFM) PDF print into
// the same row shape the paste flow produces.
//
// Each transaction is one visual line: name | date | account | [נטרל] | amount ₪.
// Long names wrap onto a line just above and/or below the date line, and the
// column x-offsets shift between pages, so rows are anchored on the date token.

const DATE = /^\d{2}\/\d{2}\/\d{2}$/;
const ACCOUNT = /^(\d{4}|\d{3}-\d{6})$/;
// Refunds are printed with a trailing minus ("19.25-"), sometimes as a separate "-".
const AMOUNT = /^-?[\d,]+\.\d{2}-?$/;
const ACTION = 'נטרל';

const SAME_LINE = 2;
const NAME_WRAP_DISTANCE = 12;
const NAME_COLUMN_MARGIN = 20;

const isRowToken = (str) =>
    DATE.test(str) || ACCOUNT.test(str) || AMOUNT.test(str) || str === ACTION || str === '₪';

const parseAmount = (str, minus) => {
    const value = Number(str.replace(/[,-]/g, ''));
    return minus || str.includes('-') ? -value : value;
};

const normalizeName = (name) =>
    name
        .replace(/\s*"\s*/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

function parsePage(items) {
    const anchors = items
        .filter((item) => DATE.test(item.str))
        .map((date) => {
            const line = items.filter((i) => Math.abs(i.y - date.y) < SAME_LINE && i.x < date.x);
            const account = line.find((i) => ACCOUNT.test(i.str));
            const amount = line.find((i) => AMOUNT.test(i.str));
            const minus = amount && account && line.some(
                (i) => i.str === '-' && i.x > amount.x && i.x < account.x
            );
            return { date, account, amount, minus, nameParts: [] };
        })
        .filter((anchor) => anchor.account && anchor.amount);

    if (anchors.length === 0) return [];

    const nameColumnX = Math.min(...anchors.map((a) => a.date.x)) + NAME_COLUMN_MARGIN;

    items
        .filter((item) => item.x > nameColumnX && !isRowToken(item.str))
        .forEach((item) => {
            let closest = null;
            let closestDistance = NAME_WRAP_DISTANCE;
            anchors.forEach((anchor) => {
                const distance = Math.abs(anchor.date.y - item.y);
                if (distance < closestDistance) {
                    closest = anchor;
                    closestDistance = distance;
                }
            });
            closest?.nameParts.push(item);
        });

    return anchors
        .map((anchor) => {
            const name = anchor.nameParts
                // Top-to-bottom, then right-to-left within a line.
                .sort((a, b) => (Math.abs(a.y - b.y) >= SAME_LINE ? b.y - a.y : b.x - a.x))
                .map((part) => part.str)
                .join(' ');

            return {
                name: normalizeName(name),
                date: anchor.date.str,
                account: anchor.account.str,
                action: '',
                amount: parseAmount(anchor.amount.str, anchor.minus),
            };
        })
        .filter((row) => row.name);
}

export function parseHapoalimPages(pages = []) {
    return pages.flatMap((page) =>
        parsePage((page.items ?? []).filter((item) => item.str && item.str.trim()))
    );
}

export function rowsToTsv(rows = []) {
    return rows
        .map((row) => [row.name, row.date, row.account, row.action, row.amount].join('\t'))
        .join('\n');
}
