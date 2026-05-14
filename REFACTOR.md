# Refactor Plan

Execute phases in order. Tick boxes as you go. Each phase is self-contained
and shippable; don't start a phase until the previous one is merged and green.

Estimated total: ~6–8 dev days.

This plan was generated from an architectural audit that found concentrated
brittleness in a small (~2,225 LOC) codebase: a broken bulk-delete SQL query,
server actions that swallow errors, a 256-line god-component
(`src/components/organisms/table.jsx`), filter logic duplicated three times,
several fully dead hooks and files, hardcoded account numbers and budgets
committed to git, a fragile `DD/MM/YY` text date column, and effectively
zero mobile responsiveness. The codebase is staying on Next.js (no
TanStack / no BFF). TypeScript was deferred to a dedicated final phase so
we type the *final* shape of the code rather than a moving target.

---

## Phase 0 — Safety net (½ day)

Goal: cover the surfaces we're about to change so regressions are caught.

- [ ] Add a `test:ci` script to `package.json` that runs once (not `--watchAll`)
      for CI use.
- [ ] Test `src/utils/db.js` filter/mapping logic (date split, year/month
      filter, sort). Mock `neon()`; do not hit the real DB.
- [ ] Test the to-be-extracted filter logic (see Phase 4) — write the tests
      against the current behaviour in `table.jsx` so the extraction in
      Phase 4 is a no-op at the test level.
- [ ] Extend the existing `usePasteToRows` test
      (`src/features/PasteableExpensesTable/TextToExpensesTable.test.jsx`)
      with cases for the dedup logic.
- [ ] Confirm `npm test` (one-shot) passes and runs in <30s.

## Phase 1 — Delete dead code (½ day)

Grep-verified during the audit: nothing imports these.

- [ ] Delete `src/data.js` (223 LOC of stale mock transactions, zero imports).
- [ ] Delete `src/hooks/useSort.js` (only referenced from commented-out lines
      in `src/components/organisms/ExpensesTileData.jsx:3,9`).
- [ ] Delete `src/hooks/useKeyboardControl.js` (only referenced from a
      commented-out line in `src/components/organisms/table.jsx:122`).
- [ ] Delete `src/hooks/useFilteredExpenses.js` (exported, zero imports) —
      its replacement is written fresh in Phase 4.
- [ ] Remove the commented-out mock blocks at `src/utils/db.js:7–21` and
      `:82–84`.
- [ ] Remove `src/constants/expenses-mock.json` if no longer imported after
      the above.

## Phase 2 — Data layer correctness (1–1.5 days)

Fixes the silent failures and the broken SQL.

- [ ] **Fix bulk delete bug** at `src/utils/db.js:124`. Replace
      `WHERE id IN ($1)` with dynamic `$1,$2,…$N` placeholders, matching the
      pattern already used at `:38` and `:135`.
- [ ] **Wrap multi-row writes in a transaction.** `insertExpenses` and
      `updateExpenses` should either succeed or roll back as a unit.
- [ ] **Standardise server-action return shape** to
      `{ ok: true } | { ok: false, error: string }`. Update every action in
      `src/utils/db.js`: `insertExpenses`, `updateExpenses`, `updateCategory`,
      `updateNote`, `updateDate`, `deleteExpense`, `deleteExpenses`. Stop
      silently returning on missing input — return
      `{ ok: false, error: 'missing id' }`.
- [ ] **Propagate errors to UI.** In every caller
      (`src/components/atoms/table-row.jsx`,
      `src/features/PasteableExpensesTable/index.jsx`, etc.), `await` the
      action and show a toast or inline error on `!ok`. Today these calls are
      fire-and-forget — see `table-row.jsx:50,60,80`.
- [ ] **Add a `LIMIT`** (config default 1000) to `fetchExpenses` and
      `getUnhandledExpenses`. Add a `(account, date)` index in Postgres.
- [ ] **DB migration: convert `expenses.date` to a real `DATE` column.**
      One-off SQL migration script committed to `db/migrations/`. After this,
      delete the `DD/MM/YY` split logic at `db.js:46–56` and `:94–106` and
      the `20${year}` hack in `src/utils/index.js`. Move filtering by
      year/month into SQL (`WHERE date >= $1 AND date < $2`).

## Phase 3 — Get secrets/config out of git (½ day)

- [ ] Move `src/constants/budget.js` (real budget numbers, account codes
      `3361`, `9325`, `170-489748`, `754-320766`) into a `budgets` table in
      Postgres, fetched server-side. Provide a one-off seed script.
- [ ] Move account-number → logical-account mapping
      (`src/constants/account.js`) into env or DB.
- [ ] Confirm `Categories` (with emoji + Hebrew labels) is acceptable to
      keep in git as it's display config, not data — otherwise also move
      to DB.

## Phase 4 — Slim `table.jsx` and de-duplicate filtering (1 day)

`src/components/organisms/table.jsx` is currently 256 LOC and owns filter
state, sort state, budget calc, edit callbacks, and rendering. Filter logic
is duplicated in three places (`table.jsx`,
`src/features/PasteableExpensesTable/usePasteToRows.js`, and the dead
`useFilteredExpenses.js`).

- [ ] Create `src/hooks/useExpensesView.js` exporting
      `{ rows, filters, setFilters, sort, setSort }`. It owns: account
      filter, category-set filter, sort criterion + direction.
- [ ] Refactor `src/components/organisms/table.jsx` to consume the hook;
      remove inline `useState` for filter/sort.
- [ ] Refactor `src/features/PasteableExpensesTable/usePasteToRows.js` to
      reuse the same filter helper for its dedup pass.
- [ ] Extract a single `formatCurrency` to `src/utils/format.js` and replace
      the 3+ inline `Intl.NumberFormat` instantiations
      (`src/features/PlainSearchableTable/index.jsx:34`,
      `src/components/organisms/table.jsx:23`,
      `src/app/money/Currency.jsx`).
- [ ] Lift budget calculation out of `table.jsx` into `src/utils/budget.js`
      (now reading from DB after Phase 3).
- [ ] Scope the `usePasteToRows` paste listener to the table container, not
      `document` (`usePasteToRows.js:55`). Memoise `pasteFilterLogic` in the
      caller so the listener doesn't re-attach every render.
- [ ] Rename files to one casing convention. Pick **kebab-case** (matches the
      majority) and rename `MainNavBar.jsx`, `ExpensesTileData.jsx`,
      `SortButtons.jsx`, `Currency.jsx`. Update imports.

## Phase 5 — Mobile redesign (2–3 days, the big one)

Current state: no viewport meta tag, ~5 responsive utilities across the
whole codebase, fixed-width columns, table layouts that need horizontal
scroll on phones, inconsistent RTL handling, touch targets <44px, no nav
collapse. Treat this phase as a mini-project.

### 5a — Foundations (do first, ~½ day)

- [ ] Add viewport meta to `src/app/layout.js`:
      `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
      Without this, every other change is invisible on phones.
- [ ] Decide on **one** direction strategy. The data is Hebrew. Recommend
      setting `<html dir="rtl" lang="he">` in `layout.js` and removing the
      per-component `dir="rtl"` overrides at `src/app/money/page.js:112` and
      `src/components/atoms/table-row.jsx:18`.
- [ ] Confirm Tailwind's default breakpoints (`sm:`, `md:`, `lg:`) are
      sufficient in `tailwind.config.mjs`.
- [ ] Establish a base type scale: `text-base` on mobile, scale up with
      `md:text-lg`. Replace `text-xs`/`text-sm` body usages with
      `text-sm md:text-base`.

### 5b — Layout & navigation (~1 day)

- [ ] `src/components/molecules/navbar.jsx` +
      `src/components/molecules/MainNavBar.jsx`: collapse the always-visible
      filter rows into a drawer/sheet on mobile (`md:hidden` + a hamburger
      button). On desktop, keep current layout.
- [ ] Increase all nav buttons to `min-h-11 min-w-11` (44px) and add visible
      focus rings (`focus-visible:ring-2`).
- [ ] Remove `h-[80vh] overflow-auto` from
      `src/components/organisms/table.jsx:190` on mobile — let the page
      scroll naturally; keep the constraint only at `md:` and up.
- [ ] In `table.jsx:156–157`, flip the layout from `md:flex-row-reverse`
      with `md:w-1/3` to a **mobile-first** stack:
      `flex-col gap-4 md:flex-row md:flex-row-reverse`.

### 5c — Table → cards on mobile (~1 day)

The current `<table>` with fixed `w-24` / `w-40` columns will never fit a
phone. Render two layouts driven by Tailwind:

- [ ] On `<md`, render each row as a card: name + amount on top row, date
      + category chip below, note expandable. Use the existing data shape —
      no data changes needed.
- [ ] On `md+`, keep the current tabular layout.
- [ ] Replace fixed widths (`w-24`, `w-40` in
      `src/components/atoms/table-row.jsx:31,44`) with fluid widths or
      `min-w-0` + flex.
- [ ] Make category filter buttons
      (`src/components/organisms/table.jsx:218–233`) wrap with `flex-wrap`
      instead of `overflow-x-auto`.
- [ ] Same for `src/features/PlainSearchableTable/index.jsx:76,80` —
      replace `overflow-x-auto` + `min-w-32` with a responsive grid:
      `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3`.

### 5d — Inputs & touch (~½ day)

- [ ] Increase all inputs (note input in `table-row.jsx:54`, category
      dropdown in `src/components/molecules/categories-dropdown.jsx`) to
      `min-h-11` and `text-base` (prevents iOS zoom-on-focus).
- [ ] The clipboard paste flow in `usePasteToRows` is desktop-only. Add a
      visible "Paste" button for mobile that reads
      `navigator.clipboard.readText()`.
- [ ] Audit `hover:` styles and add matching `active:` /
      `focus-visible:` variants so touch users see feedback.

### 5e — Verification (~½ day)

- [ ] Test on real iOS Safari and real Android Chrome — not just devtools.
- [ ] Lighthouse mobile score ≥ 90 on Performance and ≥ 95 on
      Accessibility for `/`, `/add`, `/money`.
- [ ] Walk through every flow on a 360px-wide viewport: read list, filter
      by category, edit a row, paste new rows, navigate months.

---

## Phase 6 — TypeScript sweep (1 day)

The codebase is ~2.2k LOC across ~30 files and `typescript ^5` is already
declared as a peer dep in `package.json:39`. Doing this last means we type
the *final* shape of the code (post-cleanup, post-mobile), not the moving
target. Order matters: types follow the lowest-level modules upward so each
file is typed when its imports already are.

- [ ] Add `tsconfig.json` with `strict: true`, `jsx: "preserve"`,
      `moduleResolution: "bundler"`, `paths: { "@/*": ["./src/*"] }`. Next.js
      15 auto-detects this and adds `next-env.d.ts` on first build.
- [ ] Install `@types/react`, `@types/react-dom`, `@types/node`,
      `@types/lodash`. Remove the `typescript` peer-dep declaration and add
      it as a real `devDependency`.
- [ ] Define `src/types/expense.ts` with `Expense`, `ExpenseInput`,
      `Account`, `Category`, `Budget`, plus the
      `ActionResult<T> = { ok: true; data?: T } | { ok: false; error: string }`
      shape introduced in Phase 2.
- [ ] Convert in dependency order (each step is a separate commit so
      bisect stays useful):
  1. `src/utils/*.js` → `.ts`
  2. `src/constants/*.js` → `.ts`
  3. `src/hooks/*.js` → `.ts` (including the new `useExpensesView`
     from Phase 4)
  4. `src/components/atoms/*.jsx` → `.tsx`
  5. `src/components/molecules/*.tsx`
  6. `src/components/organisms/*.tsx`
  7. `src/features/**/*.tsx`
  8. `src/app/**/page.jsx` → `page.tsx`, `layout.tsx`
- [ ] After each batch: `tsc --noEmit` clean, `npm run build` succeeds,
      tests still pass.
- [ ] Replace `jsconfig.json` with the new `tsconfig.json` and delete
      `jsconfig.json`.
- [ ] Forbid `any` in CI: add `"@typescript-eslint/no-explicit-any": "error"`
      to `eslint.config.mjs`. Allow `unknown` for genuinely dynamic
      boundaries (paste handler input, DB row results before mapping).
- [ ] Type the Neon client wrapper: every function in `db.ts` declares its
      return type explicitly (`Promise<ActionResult<Expense[]>>` etc.) — this
      catches any silent error-swallowing the audit missed.

---

## Done criteria

- All checkboxes ticked.
- `npm test` green, `npm run lint` clean, `npm run build` succeeds,
  `tsc --noEmit` clean.
- No real account numbers in `git log -p`.
- On a 360px phone in portrait, every page is usable without horizontal
  scroll.
- Zero `.js` / `.jsx` files remain under `src/`.
