# Component Architecture

## Diagram

```mermaid
graph TD
  %% Root
  RootLayout["🏗️ RootLayout\n(layout.js)"]

  %% Pages
  HomePage["📄 Home Page\n(/page.js)"]
  AddPage["📄 Add Page\n(/add/page.js)"]
  MoneyPage["📄 Money Page\n(/money/page.js)"]
  DuplicatesPage["📄 Duplicates Page\n(/duplicates/page.js)"]
  CategoriesPage["📄 Categories Page\n(/categories/page.js)"]
  CategoryAnalytics["CategoryAnalytics\n(client, recharts)"]
  CategoryRange["categoryRange.js\n(utils)"]

  %% Features
  ExpensesExplorer["ExpensesExplorer\n(feature)"]
  PasteableExpensesTable["PasteableExpensesTable\n(feature)"]

  %% Organisms
  Table["Table\n(organism)"]
  ExpensesTileData["ExpensesTileData\n(organism)"]
  SortButtons["SortButtons\n(organism)"]

  %% Molecules
  MainNavBar["MainNavBar\n(molecule)"]
  NavBar["NavBar / Filters\n(molecule)"]
  InfoDisplay["InfoDisplay\n(molecule)"]
  CategoriesDropdown["CategoriesDropdown\n(molecule)"]
  SortableTableHeader["SortableTableHeader\n(molecule)"]

  %% Atoms
  TableRow["TableRow\n(atom)"]
  CurrencyAmount["CurrencyAmount\n(atom)"]
  Currency["Currency\n(atom)"]
  Search["Search\n(feature)"]

  %% Hooks
  usePasteToRows["usePasteToRows\n(hook)"]
  useFilteredExpenses["useFilteredExpenses\n(hook)"]
  useKeyboardControl["useKeyboardControl\n(hook)"]
  useSort["useSort\n(hook)"]

  %% Utils / Constants
  DB["db.js\n(server utils)"]
  Utils["utils/index.js"]
  Categories["Categories\n(constant)"]
  AccountConst["Account / AccountName\n(constant)"]
  Budget["budget.js\n(constant)"]

  %% --- Page tree ---
  RootLayout --> HomePage
  RootLayout --> AddPage
  RootLayout --> MoneyPage
  RootLayout --> DuplicatesPage
  RootLayout --> CategoriesPage

  HomePage --> MainNavBar
  HomePage --> ExpensesExplorer
  MoneyPage -. redirects .-> HomePage

  AddPage --> MainNavBar
  AddPage --> PasteableExpensesTable

  ExpensesExplorer --> ListView["ListView / ColumnsView"]
  ExpensesExplorer --> CalendarView["CalendarView"]
  ExpensesExplorer --> BudgetView["BudgetView"]
  BudgetView --> InfoDisplay
  BudgetView --> ExpensesTileData
  BudgetView --> Currency
  BudgetView --> Budget

  DuplicatesPage --> MainNavBar
  DuplicatesPage --> DuplicateGroupList["DuplicateGroupList\n(organism)"]
  DuplicatesPage --> DB

  CategoriesPage --> MainNavBar
  CategoriesPage --> CategoryAnalytics
  CategoriesPage --> DB
  CategoriesPage --> CategoryRange
  CategoryAnalytics --> CategoryRange
  ExpensesExplorer -. category link .-> CategoriesPage
  ExpensesTileData -. category link .-> CategoriesPage

  %% --- Feature → Organism ---
  PasteableExpensesTable --> Table
  PasteableExpensesTable --> usePasteToRows

  %% --- Organism internals ---
  Table --> Search
  Table --> SortableTableHeader
  Table --> TableRow
  Table --> InfoDisplay
  Table --> SortButtons
  Table --> useFilteredExpenses
  Table --> useKeyboardControl

  ExpensesTileData --> InfoDisplay
  ExpensesTileData --> Categories

  %% --- Molecule internals ---
  InfoDisplay --> CurrencyAmount
  TableRow --> CategoriesDropdown
  TableRow --> CurrencyAmount
  TableRow --> AccountConst

  CategoriesDropdown --> Categories

  %% --- Hook deps ---
  usePasteToRows --> Utils

  %% --- Server data deps ---
  HomePage --> DB
  AddPage --> DB


  %% --- Styles ---
  style RootLayout fill:#1e1e2e,color:#cdd6f4
  style HomePage fill:#313244,color:#cdd6f4
  style AddPage fill:#313244,color:#cdd6f4
  style MoneyPage fill:#313244,color:#cdd6f4
  style ExpensesExplorer fill:#45475a,color:#cdd6f4
  style PasteableExpensesTable fill:#45475a,color:#cdd6f4
  style Table fill:#585b70,color:#cdd6f4
  style ExpensesTileData fill:#585b70,color:#cdd6f4
  style SortButtons fill:#585b70,color:#cdd6f4
  style MainNavBar fill:#6c7086,color:#cdd6f4
  style NavBar fill:#6c7086,color:#cdd6f4
  style InfoDisplay fill:#6c7086,color:#cdd6f4
  style CategoriesDropdown fill:#6c7086,color:#cdd6f4
  style SortableTableHeader fill:#6c7086,color:#cdd6f4
  style TableRow fill:#7f849c,color:#cdd6f4
  style CurrencyAmount fill:#7f849c,color:#cdd6f4
  style Currency fill:#7f849c,color:#cdd6f4
  style Search fill:#7f849c,color:#cdd6f4
  style usePasteToRows fill:#89b4fa,color:#1e1e2e
  style useFilteredExpenses fill:#89b4fa,color:#1e1e2e
  style useKeyboardControl fill:#89b4fa,color:#1e1e2e
  style useSort fill:#89b4fa,color:#1e1e2e
  style DB fill:#a6e3a1,color:#1e1e2e
  style Utils fill:#f9e2af,color:#1e1e2e
  style Categories fill:#f9e2af,color:#1e1e2e
  style AccountConst fill:#f9e2af,color:#1e1e2e
  style Budget fill:#f9e2af,color:#1e1e2e
```

## Layers

| Layer | Components |
|---|---|
| **Pages** | `RootLayout`, `Home`, `Add`, `Money` |
| **Features** | `ExpensesExplorer`, `PasteableExpensesTable` |
| **Organisms** | `Table`, `ExpensesTileData`, `SortButtons` |
| **Molecules** | `MainNavBar`, `NavBar`, `InfoDisplay`, `CategoriesDropdown`, `SortableTableHeader` |
| **Atoms** | `TableRow`, `CurrencyAmount`, `Currency`, `Search` |
| **Hooks** | `useFilteredExpenses`, `usePasteToRows`, `useKeyboardControl`, `useSort` |
| **Server/Utils** | `db.js`, `utils/index.js`, `Categories`, `Account`, `Budget` |

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.js` | Dashboard — one filtered period of expenses shown as `view=list\|columns\|calendar\|budget` (view is client-side, persisted to URL + localStorage). Search, account/year/month/category filters and tap-to-hide apply to every view |
| `/add` | `src/app/add/page.js` | Paste-to-add unhandled expenses |
| `/money` | `src/app/money/page.js` | Redirects to `/?view=budget` (keeps `year`/`month`/`account`) |
| `/categories` | `src/app/categories/page.js` | Category totals over time: line/bar/stacked charts, date range + account filters. Params: `category`, `from`/`to` (`YYYY-MM`), `account`, `chart`. Category links elsewhere build URLs with `categoryHref` (`src/utils/categoryRange.js`) |

## Components

### Atoms

- **`CurrencyAmount`** (`src/components/atoms/currency-amount.jsx`) — Formatted currency display with optional positive/negative color coding
- **`TableRow`** (`src/components/atoms/table-row.jsx`) — Single expense row with inline category/note editing and delete

### Molecules

- **`MainNavBar`** (`src/components/molecules/MainNavBar.jsx`) — Top navigation between pages
- **`NavBar`** (`src/components/molecules/navbar.jsx`) — URL-driven filter bar (account, year, month, category)
- **`InfoDisplay`** (`src/components/molecules/info-display.jsx`) — Labeled metric tile with progress bar and percentage
- **`CategoriesDropdown`** (`src/components/molecules/categories-dropdown.jsx`) — Category picker grid using Hebrew locale labels
- **`SortableTableHeader`** (`src/components/molecules/sortable-table-header.jsx`) — Table column header with sort toggle

### Organisms

- **`Table`** (`src/components/organisms/table.jsx`) — Full expense table with search, sort, filter, and per-account/category totals
- **`ExpensesTileData`** (`src/components/organisms/ExpensesTileData.jsx`) — Grid of category spend tiles (actual vs. budgeted)
- **`SortButtons`** (`src/components/organisms/SortButtons.jsx`) — Amount/date sort controls

### Features

- **`ExpensesExplorer`** (`src/features/ExpensesExplorer/index.jsx`) — Home page shell: owns search results, hidden rows, sort, view and the edit sheet, and derives one `visibleItems` list that every view renders:
  - `ListView` / `ColumnsView` — expenses grouped by category
  - `CalendarView` — month grid with per-day totals and heat shading; tap a day to list it. Year-only shows 12 mini heat maps
  - `BudgetView` — actual vs. budget for the month (`groupExpensesByMonth` + `getBudgetForMonth`)
  - `ViewSwitcher`, `MonthStepper` (prev/next month, keeps other params), `ExpenseRow`
- **`PasteableExpensesTable`** (`src/features/PasteableExpensesTable/index.jsx`) — Table that accepts clipboard paste input and deduplicates against existing expenses
- **`Search`** (`src/features/Search/index.jsx`) — Real-time text search with amount fuzzy matching (±5%)

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useFilteredExpenses` | `src/hooks/useFilteredExpenses.js` | Filter rows by account/category, sort, compute totals |
| `usePasteToRows` | `src/features/PasteableExpensesTable/usePasteToRows.js` | Parse clipboard paste into expense rows, deduplicate |
| `useKeyboardControl` | `src/hooks/useKeyboardControl.js` | Arrow-key navigation through table inputs |
| `useSort` | `src/hooks/useSort.js` | Sort criteria and category selection state |

## Data Flow

```
Server (db.js / Neon PostgreSQL)
        │
        ▼
   Page (Server Component)
        │  props
        ▼
  Feature Component
        │  props
        ▼
   Table Organism  ◄──── URL Search Params (account, year, month, category, sort, search)
        │
        ▼
    TableRow Atom  ──► inline update callbacks ──► db.js (server action)
```

## Constants

| File | Contents |
|---|---|
| `src/constants/index.js` | `Categories` — name (Hebrew), emoji, hex color per category |
| `src/constants/account.js` | `PrivateAccounts`, `SharedAccounts`, `AccountName` id→name map |
| `src/constants/budget.js` | Monthly budget limits per year/account/category |

## External Dependencies

| Package | Usage |
|---|---|
| Next.js 15 | App Router, server components, server actions |
| Tailwind CSS | Styling |
| `@phosphor-icons/react` | Icons |
| `classnames` | Conditional class merging |
| `lodash` | `orderBy`, `keyBy` |
| `date-fns` | Date formatting |
| `@neondatabase/serverless` | PostgreSQL (Neon) client |
