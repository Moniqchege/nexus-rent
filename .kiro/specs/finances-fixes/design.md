# Finances Fixes Bugfix Design

## Overview

The Finance section of Nexus Rent has five distinct areas where live backend data is either
never fetched, fetched via a wrong or missing endpoint, or where UI actions have no handler
wired. This design formalises each bug condition, documents the minimal targeted changes
required in both backend (Node/Express/Prisma/TypeScript) and frontend (Next.js App Router /
Axios), and defines the testing strategy that confirms the fixes work without regressing
existing behaviour.

The five fix areas are:

1. **Overview** – replace three hardcoded values (INFLOW/OUTFLOW, expenses, occupancy) with
   real API data.
2. **Schedules** – call `getPayments()` on mount and pass the result to `setPayments` so that
   status cards and totals are correct.
3. **Tenant** – add a `?search=` query-parameter to `GET /api/leases` so tenant search hits
   the database instead of only the in-memory list.
4. **Automation** – (a) add `POST /api/cron/schedules` endpoint; (b) replace unauthenticated
   `EventSource` with authenticated axios polling; (c) wire `onClick` to the "Refresh Status"
   button.
5. **Reports** – (a) add `startDate`/`endDate` filter to `GET /api/expenses`; (b) fix KRA
   download to use axios; (c) ensure expenses re-fetch on filter change; (d) unify summary
   card data sources.


---

## Glossary

- **Bug_Condition (C)**: The runtime condition that triggers defective behaviour —
  see individual `isBugCondition` pseudocode per area.
- **Property (P)**: The desired outcome when the bug condition holds (i.e. the fixed
  behaviour).
- **Preservation**: Existing functionality that must continue to work after each fix.
- **F** / **F′**: The original (broken) function / the fixed function.
- **`GET /api/dashboard/stats`**: The existing backend route in `dashboard.ts` that
  returns `revenueTrend`, `expenseByCategory`, occupancy data, `monthlyRevenue`, etc.
- **`GET /api/expenses`**: Backend route in `expenses.ts`. Currently accepts
  `propertyId` and `status` query params; will gain `startDate` / `endDate`.
- **`GET /api/cron/logs`**: New backend route to be added to `cron.ts`; returns recent
  `CronLog` records.
- **`POST /api/cron/schedules`**: New backend route to be added to `cron.ts`; triggers
  `generateMonthlySchedules()`.
- **`EventSource`**: Browser API that opens an SSE connection. Does not send
  `Authorization` headers or cookies cross-origin — the root cause of bug 1.9.
- **axios polling**: Periodic `setInterval`-based `api.get(...)` calls using the
  authenticated axios instance from `app/lib/api.ts`, used as the SSE replacement.
- **`isBugCondition(input)`**: Pseudocode function that returns `true` when a given
  input exhibits defective behaviour.
- **`expectedBehavior(result)`**: Pseudocode function that returns `true` when the
  result satisfies the correctness requirement.


---

## Bug Details

### Bug 1 — Finances/Overview: Hardcoded Cash-Flow and Expenses

#### Bug Condition

The bug manifests on every page load of `app/payments/overview/page.tsx`. The component
renders the cash-flow area chart and the Expenses metric card from compile-time constants
(`INFLOW`, `OUTFLOW`, `DAYS`, `expenses = 128900`) instead of fetching real data. The
property summary occupancy column is always `"—"` because it is derived only from the
`payments` array — which carries no unit-count information.

```
FUNCTION isBugCondition(input)
  INPUT: input of type OverviewPageLoad
  OUTPUT: boolean

  RETURN (cashFlowDataSource === "HARDCODED_CONSTANT")
      OR (expensesValue === 128900 AND backendNotCalled)
      OR (propertyRow.occupancy === "—" AND unitCountEndpointNotCalled)
END FUNCTION
```

**Examples:**

- Overview loads → Expenses card shows "$128.9K" regardless of actual spend.
- Overview loads → Cash-flow area chart shows Mon–Sun static values, not real daily
  payment movement.
- Overview loads → Property Summary "Occupancy" column shows `—` for every property.

---

### Bug 2 — Finances/Schedules: `setPayments` Never Called

#### Bug Condition

`schedules/page.tsx` declares `const [payments, setPayments] = useState<Payment[]>([])`
and calls `getRentSchedules()` on mount, but never calls `getPayments()`. The `payments`
array stays `[]` forever. Every function that joins schedules with payments —
`getDisplayStatus`, `counts`, `totals` — therefore always sees zero paid amounts,
producing wrong status-card counts and totals.

```
FUNCTION isBugCondition(input)
  INPUT: input of type SchedulesPageState
  OUTPUT: boolean

  RETURN input.payments.length === 0
      AND backendPaymentsEndpointExists
      AND fetchPaymentsWasNeverCalled
END FUNCTION
```

**Examples:**

- A schedule fully paid via M-Pesa → status card shows it as "Overdue" (count +1 Overdue,
  Paid count stays 0).
- Partial payment of KES 5,000 on a KES 10,000 schedule → "Partial" count stays 0.


---

### Bug 3 — Finances/Tenant: Client-Side-Only Tenant Search

#### Bug Condition

`tenant/page.tsx` loads all leases once via `GET /api/leases` then filters the in-memory
`leases` array locally. No backend search call is ever made. The backend `GET /api/leases`
route in `leases.ts` has no `search` query-parameter support, so even if the frontend sent
one, the result would be unfiltered.

```
FUNCTION isBugCondition(input)
  INPUT: input of type TenantSearchQuery
  OUTPUT: boolean

  RETURN input.searchTerm.trim().length > 0
      AND backendSearchEndpointDoesNotExist
      AND resultSet === inMemoryFilterOnly
END FUNCTION
```

**Examples:**

- Landlord has 200 leases (paginated on another page); initial load returns first 50.
  Typing "Alice" finds no match even though Alice is tenant #180.
- Typing an email address fragment finds no match when that lease was not in the initial
  batch.

---

### Bug 4 — Finances/Automation: Three Wiring Defects

#### Bug Condition 4a — Wrong "Generate Schedules" Endpoint

`CRON_DEFS` in `automation/page.tsx` maps "Generate Schedules" to
`endpoint: "/api/payments/schedules"`. That route handles `GET` only (returns schedule
data) and has no `POST` handler, so pressing "Run Now" receives a 404 or unexpected JSON
response and `generateMonthlySchedules()` is never called.

```
FUNCTION isBugCondition_4a(input)
  INPUT: input of type RunNowClick
  OUTPUT: boolean

  RETURN input.cronKey === "schedules"
      AND input.endpoint === "/api/payments/schedules"
      AND HTTP_POST(input.endpoint).status !== 200
END FUNCTION
```

#### Bug Condition 4b — Unauthenticated SSE Connection

`automation/page.tsx` opens `new EventSource("/api/cron/sse")`. The backend `cron.ts`
SSE route is wrapped in `router.use(requireAuth)`, which reads the session token from
cookies or `Authorization` headers. `EventSource` sends neither by default when calling
a cross-origin URL (Next.js dev runs on port 3000, backend on a different port), so the
server returns 401 and no `CronLog` records ever reach the client.

```
FUNCTION isBugCondition_4b(input)
  INPUT: input of type SSEConnection
  OUTPUT: boolean

  RETURN input.connectionType === "EventSource"
      AND input.authHeaderPresent === false
      AND backendRequiresAuth === true
END FUNCTION
```

#### Bug Condition 4c — "Refresh Status" Button Has No onClick

The "Refresh Status" button is rendered in `automation/page.tsx` as a plain `<button>`
with no `onClick` prop. Clicking it does nothing.

```
FUNCTION isBugCondition_4c(input)
  INPUT: input of type ButtonClick
  OUTPUT: boolean

  RETURN input.buttonLabel === "Refresh Status"
      AND input.onClickHandler === undefined
END FUNCTION
```


---

### Bug 5 — Finances/Reports: Four Data Defects

#### Bug Condition 5a — Bar Graph Expenses Always Zero

`fetchExpensesForMonth` sends `params.month = m` to `GET /api/expenses`. The backend
route ignores any `month` parameter (it only reads `propertyId` and `status`), returns
all expenses, and then the frontend filters with `e.date.slice(0,7) === m`. For any past
month where no expenses were created that month in the initial dataset, this filter
returns zero items — making every Expenses bar render at zero height.

```
FUNCTION isBugCondition_5a(input)
  INPUT: input of type ExpenseBarRequest
  OUTPUT: boolean

  RETURN input.monthParam !== undefined
      AND backendIgnoresMonthParam
      AND filteredClientSide.length === 0
      AND actualExpensesExistForMonth(input.month) === true
END FUNCTION
```

#### Bug Condition 5b — KRA Download Is Unauthenticated

`handleExportCSV` calls `window.open('/api/payments/reports?...', '_blank')`. This
opens a raw browser tab with no session token, causing the backend to return 401.

```
FUNCTION isBugCondition_5b(input)
  INPUT: input of type KRADownloadClick
  OUTPUT: boolean

  RETURN input.downloadMethod === "window.open"
      AND authTokenNotIncluded
      AND backendResponse.status === 401
END FUNCTION
```

#### Bug Condition 5c — Expenses Don't Re-fetch on Filter Change

`fetchExpenses` depends on `[propertyId, month]`, but the backend ignores `month`.
Changing the month filter triggers a re-fetch that returns all expenses regardless of
month, so the breakdown section never narrows to the selected period.

#### Bug Condition 5d — Inconsistent Summary Card Data Sources

The Net P&L card reads `pl` from the CSV-parsed `ReportSummary` (backed by the
`/api/payments/reports` CSV route). The Expenses card reads `realExpensesTotal` from the
live expenses list. These two values differ because the CSV route computes expenses via
`db.expense.aggregate` while the list route returns individual records. Net P&L = Revenue
− CSV-expenses, but the Expenses card shows the live-expenses sum, so the two are
incoherent.

```
FUNCTION isBugCondition_5d(input)
  INPUT: input of type SummaryCardsRender
  OUTPUT: boolean

  RETURN expensesCard.source !== plCard.expensesSource
      AND (revenue - expensesCard.value) !== plCard.value
END FUNCTION
```


---

## Expected Behavior

### Preservation Requirements

The following existing behaviours must remain fully intact after every fix:

- **3.1** The Schedules page client-side search (`search` state) continues to filter the
  visible table rows against the loaded dataset.
- **3.2** Clicking a status summary card on the Schedules page continues to toggle the
  active status filter.
- **3.3** A cron "Run Now" action continues to call `fetchData()` after the action
  completes to refresh schedule and payment state.
- **3.4** The "Send Reminders" button on the Automation page continues to POST to
  `/api/cron/reminders/manual` and display the result in the run log.
- **3.5** The Reports KRA download continues to include `propertyId` and `month` query
  parameters.
- **3.6** Selecting a tenant on the Tenant page continues to load that tenant's
  schedules, payments, and ledger and render the Statement of Account table.
- **3.7** The Tenant page "Download PDF" button continues to use `generateStatementPDF`.
- **3.8** The Overview page continues to call `getPayments()` and `getRentSchedules()`
  to populate Recent Transactions and Method Breakdown.
- **3.9** Changing the Property or Month filter on the Reports page continues to trigger
  all five fetch callbacks (`fetchSummary`, `fetchPayments`, `fetchMom`, `fetchExpenses`,
  `fetchArrears`).
- **3.10** `GET /api/expenses` continues to return all landlord-scoped expenses when no
  date params are provided.
- **3.11** `GET /api/leases` continues to return all leases for the authenticated landlord
  when no `search` param is provided.


---

## Hypothesized Root Cause

### Overview (Bug 1)

1. **Incomplete initial implementation**: The cash-flow chart was scaffolded with mock
   data as a placeholder; no ticket was ever raised to wire the real endpoint.
2. **Missing analytics endpoint extension**: `GET /api/dashboard/stats` already returns
   `revenueTrend` (monthly revenue array) and `expenseByCategory`, but the Overview page
   never calls it. Cash-flow (daily inflow/outflow) would require either extending this
   endpoint or adding a dedicated one.
3. **Missing unit data in property loop**: The property summary loop iterates over
   `payments`, which carry `propertyId` but not unit counts. The occupancy column is
   never populated because `unitType.totalUnits` is not fetched here.

### Schedules (Bug 2)

4. **Single `useEffect` / incomplete fetch**: `fetchSchedules` was implemented but the
   companion `getPayments()` call was never added. The `setPayments` setter was declared
   but left unused — a dead-code warning already visible in the type diagnostics.

### Tenant (Bug 3)

5. **No search parameter on the leases route**: `GET /api/leases` was designed to return
   all leases for a landlord without filtering. No `search` query param was ever added.
6. **Client-side filter assumed full dataset**: The frontend assumed `GET /api/leases`
   returns every lease, so a local `.filter()` was considered sufficient.

### Automation (Bug 4)

7. **Wrong endpoint key**: `CRON_DEFS` was set up with `endpoint: "/api/payments/schedules"`
   for "Generate Schedules", confusing the data-read route with the cron-trigger endpoint.
   The cron trigger endpoint (`POST /api/cron/schedules`) was never created.
8. **EventSource cannot carry auth**: The developer used the browser-native `EventSource`
   API which does not support custom headers. The backend SSE route is auth-protected via
   `router.use(requireAuth)`, so every SSE connection is rejected with 401.
9. **Button rendered without handler**: The "Refresh Status" button HTML was added to the
   UI without an `onClick` prop; the handler function was never written.

### Reports (Bug 5)

10. **Backend route never implemented month filter**: `GET /api/expenses` was built to
    filter by `propertyId` and `status` only. The `month` param sent by the frontend is
    silently ignored, so the client-side filter `e.date.slice(0,7) === m` on past months
    returns nothing because the returned list happens to be all-time expenses.
11. **`window.open` bypasses auth layer**: The developer used `window.open` for convenience
    (triggering a file download), unaware that the backend report route requires an
    authenticated session.
12. **Dual data sources for summary cards**: Revenue and Net P&L come from the CSV report
    route; Expenses comes from the live list route. They are computed independently and
    can diverge.


---

## Correctness Properties

Property 1: Bug Condition — Overview Loads Real Data

_For any_ page load of `OverviewPage` where the authenticated user has at least one
property, the fixed component SHALL fetch cash-flow data and expenses totals from the
backend, and the rendered metric cards and area chart SHALL reflect live database values
rather than compile-time constants.

**Validates: Requirements 2.1, 2.2, 2.3**

---

Property 2: Preservation — Overview Existing Sections Unchanged

_For any_ page load of `OverviewPage`, the fixed component SHALL continue to call
`getPayments()` and `getRentSchedules()` and use their results to populate Recent
Transactions and Method Breakdown exactly as before.

**Validates: Requirements 3.8**

---

Property 3: Bug Condition — Schedules Status Cards Reflect Real Payments

_For any_ page load of `SchedulesPage` where the authenticated landlord has payment
records in the database, the fixed component SHALL call both `getRentSchedules()` and
`getPayments()`, populate both state arrays, and the status summary cards (Paid, Overdue,
Partial, Scheduled) SHALL display counts and totals derived from the real payment
allocation data.

**Validates: Requirements 2.4, 2.5**

---

Property 4: Preservation — Schedules Client-Side Filter and Status Toggle Unchanged

_For any_ input where the bug condition does NOT hold (i.e. search and status-filter
interactions), the fixed component SHALL produce the same filtered table rows and active
card highlighting as the original component.

**Validates: Requirements 3.1, 3.2**

---

Property 5: Bug Condition — Tenant Search Hits the Database

_For any_ search query string typed into the Tenant page search box, the fixed component
SHALL call `GET /api/leases?search=<query>` and display results sourced from the database,
including tenants not present in the initial lease fetch.

**Validates: Requirements 2.6, 2.7**

---

Property 6: Preservation — Tenant Statement and PDF Unchanged

_For any_ selected tenant after search, the fixed component SHALL continue to load
financials via the existing `fetchTenantFinancials` function and continue to offer PDF
generation via `generateStatementPDF`.

**Validates: Requirements 3.6, 3.7**

---

Property 7: Bug Condition — "Generate Schedules" Run Now Triggers Correct Endpoint

_For any_ click of "Run Now" for the "Generate Schedules" cron entry, the fixed component
SHALL POST to `POST /api/cron/schedules`, which SHALL invoke `generateMonthlySchedules()`,
and SHALL return a 200 response that updates the Last Run column.

**Validates: Requirements 2.8**

---

Property 8: Bug Condition — Cron Log Status Updates Arrive via Authenticated Polling

_For any_ authenticated session on the Automation page, the fixed component SHALL receive
`CronLog` records via an authenticated axios polling mechanism, and the Last Run column
SHALL update with the correct timestamp after a successful cron run.

**Validates: Requirements 2.9**

---

Property 9: Bug Condition — "Refresh Status" Button Fetches Cron Logs

_For any_ click of the "Refresh Status" button, the fixed component SHALL call
`GET /api/cron/logs` and update the `cronLogs` state with the latest records.

**Validates: Requirements 2.10**

---

Property 10: Preservation — Send Reminders Behaviour Unchanged

_For any_ click of the "Send Reminders" button, the fixed component SHALL continue to
POST to `/api/cron/reminders/manual` and display the result in the run log.

**Validates: Requirements 3.4**

---

Property 11: Bug Condition — Expenses Bars Render with Correct Heights

_For any_ month `m` where expenses exist in the database, the fixed bar graph SHALL
render the Expenses bar for `m` with a non-zero height proportional to the actual expense
total for that month, by fetching expenses with `startDate`/`endDate` range parameters
that the backend now honours.

**Validates: Requirements 2.12**

---

Property 12: Bug Condition — KRA Download Uses Authenticated Axios

_For any_ click of the "KRA Report" button, the fixed component SHALL trigger a download
via the authenticated axios instance (or equivalent), and the backend SHALL return the
CSV file (not a 401 response).

**Validates: Requirements 2.13**

---

Property 13: Bug Condition — Expenses Re-fetch on Filter Change

_For any_ change to the Property or Month filter, the fixed component SHALL re-fetch
expenses with the updated `startDate`/`endDate` (or `month`) parameters, and the
Expenses breakdown section SHALL display only expenses matching the current filter.

**Validates: Requirements 2.14**

---

Property 14: Bug Condition — Summary Cards Are Coherent

_For any_ filter combination (property + month), the fixed component SHALL derive
Expenses and Net P&L from the same source dataset so that `Net P&L === Revenue − Expenses`
holds for the rendered card values.

**Validates: Requirements 2.11**

---

Property 15: Preservation — Reports Filter Triggers All Fetch Callbacks

_For any_ change to Property or Month filter on the Reports page, the fixed component
SHALL continue to call all five fetch callbacks (`fetchSummary`, `fetchPayments`,
`fetchMom`, `fetchExpenses`, `fetchArrears`).

**Validates: Requirements 3.9**


---

## Fix Implementation

### Fix 1 — Backend: Extend `GET /api/expenses` with Date Range Filter

**File:** `backend/src/routes/expenses.ts`

**Change:** Read `startDate` and `endDate` query parameters (ISO-8601 date strings) in
the `GET /` handler and add them to the Prisma `where` clause when present.

```typescript
// In the GET / handler, after reading propertyId and status:
const { propertyId, status, startDate, endDate } = req.query;

if (startDate) where.date = { ...(where.date ?? {}), gte: new Date(startDate as string) };
if (endDate)   where.date = { ...(where.date ?? {}), lte: new Date(endDate as string) };
```

Existing behaviour when neither param is supplied is unchanged (returns all expenses for
the landlord).

---

### Fix 2 — Backend: Add `GET /api/leases` Search Parameter

**File:** `backend/src/routes/leases.ts`

**Change:** Read the optional `search` query param in the `GET /` handler and add a
Prisma `where` clause that searches across tenant name, email, and phone via nested
`LeaseTenant → tenant` relation.

```typescript
// In GET / handler:
const { search } = req.query;

const where: any = { property: { landlordId: authReq.userId } };

if (search && typeof search === "string" && search.trim()) {
  const q = search.trim();
  where.tenants = {
    some: {
      tenant: {
        OR: [
          { name:  { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
    },
  };
}
```

---

### Fix 3 — Backend: Add `POST /api/cron/schedules` Endpoint

**File:** `backend/src/routes/cron.ts`

**Change:** Add a new POST handler that calls `generateMonthlySchedules()` (already
imported from `paymentService.ts`) and writes a `CronLog` entry.

```typescript
router.post("/schedules", async (req, res) => {
  const start = Date.now();
  try {
    const affected = await generateMonthlySchedules();
    await db.cronLog.create({
      data: { type: "schedules", status: "success", affected, duration: Date.now() - start },
    });
    res.json({ success: true, affected });
  } catch (e: any) {
    await db.cronLog.create({
      data: { type: "schedules", status: "failed", error: e.message },
    });
    res.status(500).json({ error: e.message });
  }
});
```

---

### Fix 4 — Backend: Add `GET /api/cron/logs` Endpoint

**File:** `backend/src/routes/cron.ts`

**Change:** Add a new GET handler that returns the most recent `CronLog` records.

```typescript
router.get("/logs", async (req, res) => {
  const logs = await db.cronLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  res.json({ logs });
});
```


---

### Fix 5 — Frontend: Overview — Wire Real Cash-Flow and Expenses

**File:** `frontend/app/payments/overview/page.tsx`

**Changes:**

1. Remove `INFLOW`, `OUTFLOW`, `DAYS` constants and the `expenses = 128900` placeholder.
2. Add `useEffect` that calls `GET /api/dashboard/stats` (authenticated axios). Map
   `stats.revenueTrend` to chart data (monthly revenue as inflow proxy). Add a separate
   call to `GET /api/expenses` to sum all expenses and populate the Expenses card.
3. For occupancy, call `GET /api/dashboard/stats` and read `occupancyRate`,
   `totalProperties`, and the per-property data needed for the Property Summary table.
   Alternatively extend `GET /api/dashboard/stats` with a `propertySummary` array if
   per-property occupancy is required.

```typescript
// New fetch on mount (in addition to existing loadPayments call):
const [stats, setStats] = useState<DashboardStats | null>(null);
const [expensesTotal, setExpensesTotal] = useState(0);

useEffect(() => {
  api.get("/api/dashboard/stats").then(res => setStats(res.data));
  api.get("/api/expenses").then(res => {
    const items: Expense[] = res.data?.expenses ?? [];
    setExpensesTotal(items.reduce((s, e) => s + e.amount, 0));
  });
}, []);

// Replace hardcoded values:
// expenses  → expensesTotal
// INFLOW/OUTFLOW → stats.revenueTrend mapped to chart-compatible arrays
```

---

### Fix 6 — Frontend: Schedules — Fetch Payments on Mount

**File:** `frontend/app/payments/schedules/page.tsx`

**Change:** Add `getPayments()` alongside `getRentSchedules()` inside `fetchSchedules`
(or a companion `useEffect`) and call `setPayments(data)`.

```typescript
const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [schedulesData, paymentsData] = await Promise.all([
      getRentSchedules(),
      getPayments(),            // ← was missing
    ]);
    setSchedules(schedulesData);
    setPayments(paymentsData);  // ← was never called
  } catch (err: any) {
    setError(err?.message || "Failed to load schedules");
  } finally {
    setLoading(false);
  }
}, []);
```

---

### Fix 7 — Frontend: Tenant — Backend Search on Input Change

**File:** `frontend/app/payments/tenant/page.tsx`

**Changes:**

1. Add a `useEffect` (debounced, ~300 ms) that fires whenever `search` changes and is
   non-empty. It calls `GET /api/leases?search=<term>` and sets a separate
   `searchLeases` state.
2. Render `searchLeases` in the dropdown instead of the in-memory filtered result.
3. When `search` is empty, fall back to the pre-loaded `leases` list for the tenant card
   sidebar (preserving the existing initial-load behaviour).

```typescript
const [searchLeases, setSearchLeases] = useState<Lease[]>([]);

useEffect(() => {
  if (!search.trim()) { setSearchLeases([]); return; }
  const timer = setTimeout(() => {
    api.get("/api/leases", { params: { search } }).then(res => {
      const raw = res.data?.leases ?? [];
      setSearchLeases(raw.map((l: any) => ({ ...l, tenant: l.tenants?.[0]?.tenant ?? null })));
    });
  }, 300);
  return () => clearTimeout(timer);
}, [search]);

// In JSX: use searchLeases when search is active, otherwise show nothing
const searchResults = search.trim() ? searchLeases : [];
```


---

### Fix 8 — Frontend: Automation — Three Wiring Fixes

**File:** `frontend/app/payments/automation/page.tsx`

#### 8a — Fix "Generate Schedules" Endpoint

Change `CRON_DEFS` entry for `schedules` from:
```typescript
endpoint: "/api/payments/schedules",
```
to:
```typescript
endpoint: "/api/cron/schedules",
```

#### 8b — Replace EventSource with Authenticated Axios Polling

Remove the `EventSource` `useEffect` block entirely. Replace with:

```typescript
// Poll every 10 seconds using authenticated axios
useEffect(() => {
  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/cron/logs");
      setCronLogs(res.data?.logs ?? []);
    } catch { /* silent fail — non-critical */ }
  };

  fetchLogs(); // initial fetch
  const interval = setInterval(fetchLogs, 10_000);
  return () => clearInterval(interval);
}, []);
```

#### 8c — Wire "Refresh Status" Button onClick

Add an `onClick` prop to the Refresh Status button that calls the same `fetchLogs`
function (extracted from the polling interval callback):

```typescript
const fetchCronLogs = useCallback(async () => {
  const res = await api.get("/api/cron/logs");
  setCronLogs(res.data?.logs ?? []);
}, []);

// In JSX:
<button onClick={fetchCronLogs}>
  <span className="material-symbols-outlined">refresh</span>
  Refresh Status
</button>
```

---

### Fix 9 — Frontend: Reports — Four Data Fixes

**File:** `frontend/app/payments/reports/page.tsx`

#### 9a — Pass `startDate`/`endDate` to `GET /api/expenses`

Update `fetchExpensesForMonth` to pass ISO date range params instead of `month`:

```typescript
const fetchExpensesForMonth = useCallback(async (m: string, pid: string): Promise<number> => {
  const [year, mo] = m.split("-").map(Number);
  const startDate = new Date(year, mo - 1, 1).toISOString();
  const endDate   = new Date(year, mo, 0, 23, 59, 59).toISOString();
  const params: Record<string, string> = { startDate, endDate };
  if (pid !== "all") params.propertyId = pid;
  const res = await api.get("/api/expenses", { params });
  return (res.data?.expenses ?? []).reduce((s: number, e: Expense) => s + e.amount, 0);
}, []);
```

Similarly update `fetchExpenses` to send `startDate`/`endDate`:

```typescript
const fetchExpenses = useCallback(async () => {
  const [year, mo] = month.split("-").map(Number);
  const startDate = new Date(year, mo - 1, 1).toISOString();
  const endDate   = new Date(year, mo, 0, 23, 59, 59).toISOString();
  const params: Record<string, string> = { startDate, endDate };
  if (propertyId !== "all") params.propertyId = propertyId;
  const res = await api.get("/api/expenses", { params });
  setExpenses(res.data?.expenses ?? []);
}, [propertyId, month]);
```

#### 9b — Fix KRA Download to Use Authenticated Axios

Replace `window.open(...)` with:

```typescript
const handleExportCSV = async () => {
  const params: Record<string, string> = { month };
  if (propertyId !== "all") params.propertyId = propertyId;
  const res = await api.get("/api/payments/reports", {
    params,
    responseType: "blob",
  });
  const url  = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `report-${propertyId}-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
```

#### 9c — Filter Wiring (already correct after 9a)

Once `fetchExpenses` uses `startDate`/`endDate`, its `useCallback` dependency on
`[propertyId, month]` ensures it re-fires whenever the filter changes. No additional
wiring change is needed.

#### 9d — Unify Summary Card Data Sources

Replace the Net P&L card's `pl` value (from CSV) with `revenue - realExpensesTotal`
(both derived from the live API calls), and remove the dependency on the parsed CSV
for Expenses. Update `fetchSummary` to continue driving Revenue and Arrears from the
CSV route, but override `expenses` and `pl` in the derived state:

```typescript
// Derived values — single source of truth:
const revenue         = summary?.revenue  ?? 0;
const arrears         = arrearsBySchedule;          // from schedules fetch
const expensesDisplay = realExpensesTotal;           // from live expenses fetch
const plDisplay       = revenue - expensesDisplay;  // coherent with expenses card
```


---

## Testing Strategy

### Validation Approach

The strategy follows the bug-condition methodology:

1. **Exploratory** — run tests against UNFIXED code to confirm the bug and root cause.
2. **Fix checking** — run the same tests against FIXED code to assert the correct
   behaviour holds for all inputs where `isBugCondition` was true.
3. **Preservation checking** — verify that for all inputs where `isBugCondition` was
   false, `F(input) === F′(input)`.

---

### Exploratory Bug Condition Checking

**Goal:** Produce concrete counterexamples that prove each bug before the fix.

**Test Plan:**

1. **Overview — hardcoded data**: Assert that the rendered Expenses value equals 128900
   regardless of what `GET /api/expenses` returns. _(Will fail after fix.)_
2. **Schedules — empty payments**: Load the page, mock `getPayments` to return one paid
   payment, and assert that the Paid count card is 0. _(Will pass on unfixed code.)_
3. **Tenant — missing backend search**: Type a tenant name not in the first 10 leases;
   assert that the backend route is never called with `?search=`. _(Will pass on unfixed
   code.)_
4. **Automation — wrong endpoint**: Click "Run Now" for Generate Schedules; capture the
   outgoing HTTP request and assert it targets `/api/payments/schedules`. _(Will pass on
   unfixed code but the endpoint returns unexpected data.)_
5. **Automation — SSE no auth**: Open the SSE connection and assert no `Authorization`
   header is sent. _(Will pass on unfixed code.)_
6. **Automation — Refresh Status no-op**: Click Refresh Status and assert no API call
   is made. _(Will pass on unfixed code.)_
7. **Reports — expenses bar zero**: Render the bar chart with one historical month of
   expense data; assert the Expenses bar height renders as 0. _(Will pass on unfixed
   code.)_
8. **Reports — KRA 401**: Click KRA Report and assert the response status is 401 (or
   that `window.open` is called). _(Will pass on unfixed code.)_

**Expected Counterexamples:**

- `expenses = 128900` rendered regardless of backend response.
- `payments.length === 0` in Schedules state after mount, even when the DB has payments.
- No `GET /api/leases?search=` request fired on tenant search input.
- `POST /api/payments/schedules` targeted instead of `/api/cron/schedules`.
- No `Authorization` header on SSE connection → backend 401.
- Zero Expenses bar height despite expense records existing.

---

### Fix Checking

```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Per-area assertions:**

- **Overview**: Mock `GET /api/dashboard/stats` and `GET /api/expenses`; assert rendered
  Expenses card value equals the mocked sum (not 128900), and area chart data arrays
  match mocked `revenueTrend`.
- **Schedules**: Mock `getPayments()` returning one paid payment; assert Paid count
  card = 1 and Paid total = payment amount.
- **Tenant**: Type a search term; assert `GET /api/leases?search=<term>` is called and
  dropdown renders results from the mocked backend response.
- **Automation — schedules endpoint**: Click "Run Now" for Generate Schedules; assert
  `POST /api/cron/schedules` is called (not `/api/payments/schedules`).
- **Automation — polling auth**: Assert that axios polling sends requests to
  `/api/cron/logs` with the auth token in headers (no `EventSource` constructed).
- **Automation — Refresh Status**: Click Refresh Status; assert `GET /api/cron/logs`
  is called and `cronLogs` state is updated.
- **Reports — expenses bar**: Mock expenses endpoint returning data for month `m`; assert
  the bar height for `m` is non-zero.
- **Reports — KRA download**: Click KRA Report; assert `axios.get` is called (not
  `window.open`) and the response blob triggers a download.
- **Reports — coherence**: Assert `plDisplay === revenue - expensesDisplay` for any
  mocked revenue and expenses values.

---

### Preservation Checking

```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) === fixedFunction(input)
END FOR
```

**Test Cases:**

1. **Overview — Recent Transactions**: Verify `getPayments()` and `getRentSchedules()`
   are still called; Recent Transactions list renders the same items before and after
   the fix.
2. **Schedules — search and status filter**: Verify that typing in the search box still
   filters table rows client-side, and that clicking a status card still sets
   `statusFilter`.
3. **Tenant — statement table**: Verify that selecting a tenant still loads financials
   and the ledger table renders correctly.
4. **Automation — Send Reminders**: Verify `POST /api/cron/reminders/manual` is still
   called when "Send Reminders" is clicked.
5. **Reports — filter triggers all fetches**: Verify that changing `propertyId` or
   `month` still triggers `fetchSummary`, `fetchPayments`, `fetchMom`, `fetchExpenses`,
   and `fetchArrears`.
6. **`GET /api/expenses` no-param**: Verify that calling the endpoint with no date params
   still returns all landlord-scoped expenses.
7. **`GET /api/leases` no-search**: Verify that calling `GET /api/leases` with no
   `search` param still returns all leases for the landlord.

---

### Unit Tests

- `GET /api/expenses` with `startDate`/`endDate` returns only expenses within the range.
- `GET /api/expenses` without date params returns all expenses (preservation).
- `GET /api/leases?search=alice` returns only leases whose tenant name/email/phone
  contains "alice" (case-insensitive).
- `GET /api/leases` without search returns all leases (preservation).
- `POST /api/cron/schedules` calls `generateMonthlySchedules()`, writes a `CronLog`
  record, and returns `{ success: true, affected: N }`.
- `GET /api/cron/logs` returns the N most-recent `CronLog` records in descending order.

---

### Property-Based Tests

- **Expenses date filter**: Generate random `startDate`/`endDate` pairs; for all returned
  expenses assert `startDate ≤ expense.date ≤ endDate`.
- **Leases search**: Generate random search strings; for all returned leases assert that
  at least one of tenant.name, tenant.email, tenant.phone contains the search string
  (case-insensitive).
- **Summary card coherence**: Generate arbitrary `revenue` and `expensesTotal` values;
  assert `plDisplay === revenue − expensesDisplay` holds for all inputs.
- **Schedules status counts**: Generate random sets of schedules and payments; assert
  `counts.paid + counts.overdue + counts.partial + counts.scheduled === schedules.length`
  after the fix (was violated before because payments were always empty).

---

### Integration Tests

- Full flow: create an expense for month M, open Reports, select month M, assert the
  Expenses bar for M is non-zero.
- Full flow: create a paid payment for a schedule, open Schedules page, assert the Paid
  count card shows ≥ 1.
- Full flow: create a tenant in the DB, type their name in the Tenant page search box,
  assert they appear in the dropdown even if they weren't in the initial lease list.
- Full flow: click "Run Now" → Generate Schedules → assert a `CronLog` record of type
  `"schedules"` with status `"success"` exists in the DB.
- Full flow: click "Refresh Status" after the above → assert the Last Run column for
  "Generate Schedules" shows a recent timestamp.
- Full flow: click "KRA Report" → assert a CSV file is downloaded (Content-Disposition
  header present, no 401 error).
