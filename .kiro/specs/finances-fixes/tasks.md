# Implementation Plan

- [ ] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Finances Bugs: Hardcoded Data, Missing Fetches, Wrong Endpoints, Unauthenticated Calls
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms each bug exists
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate each bug exists before touching any production code
  - **Scoped PBT Approach**: Scope each property to the concrete failing case(s) to ensure reproducibility
  - Bug 1 — Overview hardcoded values: assert that the rendered Expenses card value equals `128900` regardless of what a mocked `GET /api/expenses` returns; assert `INFLOW`/`OUTFLOW` arrays are compile-time constants not derived from any API call
  - Bug 2 — Schedules missing payments fetch: mock `getPayments()` returning one paid payment and assert `payments.length === 0` in component state after mount (because `setPayments` is never called)
  - Bug 3 — Tenant client-side-only search: type a search term into the Tenant page search box; assert `GET /api/leases?search=<term>` is NEVER called — only the in-memory filter runs
  - Bug 4a — Automation wrong endpoint: click "Run Now" for Generate Schedules; capture the outgoing request and assert it targets `POST /api/payments/schedules` (not `/api/cron/schedules`)
  - Bug 4b — SSE unauthenticated: assert `new EventSource(...)` is constructed with no `Authorization` header — backend SSE route protected by `requireAuth` will reject it
  - Bug 4c — Refresh Status no-op: click the "Refresh Status" button; assert no API call is made (no `onClick` handler is attached)
  - Bug 5a — Reports expenses bar zero: render bar chart with mocked expense data for a past month `m`; assert the Expenses bar height renders as 0 because the backend `month` param is silently ignored
  - Bug 5b — KRA download unauthenticated: click "KRA Report"; assert `window.open` is called (not `axios.get`) — the resulting request carries no auth token
  - Run all exploration tests on UNFIXED code
  - **EXPECTED OUTCOME**: All 8 assertions FAIL (or expose the documented counterexamples) — this is correct and proves the bugs exist
  - Document every counterexample found (e.g. "expenses card renders $128.9K regardless of API mock"; "payments.length is 0 after mount"; "no search request fired"; etc.)
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.8, 1.9, 1.10, 1.12, 1.13_

- [ ] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Existing Finance Page Behaviours Must Survive All Fixes
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs and record actual outputs before writing assertions
  - Observe and record: `getPayments()` and `getRentSchedules()` ARE called on Overview page mount → Recent Transactions and Method Breakdown render correctly
  - Observe and record: Schedules page client-side `search` state filters table rows correctly on the loaded dataset
  - Observe and record: Clicking a status summary card on Schedules toggles `statusFilter` and the active card highlights
  - Observe and record: Selecting a tenant on the Tenant page loads financials (schedules, payments, ledger) and renders the Statement of Account table
  - Observe and record: Clicking "Send Reminders" on Automation page POSTs to `/api/cron/reminders/manual` and shows the result in the run log
  - Observe and record: Changing Property or Month filter on Reports page triggers all five callbacks — `fetchSummary`, `fetchPayments`, `fetchMom`, `fetchExpenses`, `fetchArrears`
  - Observe and record: `GET /api/expenses` with no date params returns all landlord-scoped expenses
  - Observe and record: `GET /api/leases` with no `search` param returns all leases for the authenticated landlord
  - Write property-based tests for backend endpoints: for any call to `GET /api/expenses` with no `startDate`/`endDate`, assert all landlord-scoped expenses are returned (Preservation Requirement 3.10)
  - Write property-based tests for backend endpoints: for any call to `GET /api/leases` with no `search` param, assert all landlord leases are returned (Preservation Requirement 3.11)
  - Write component-level preservation tests for each frontend page listed above
  - Verify ALL preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS on unfixed code (this confirms the baseline behaviour to protect)
  - Mark task complete when tests are written, run, and confirmed passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

- [ ] 3. Backend fix: Add date range filter to GET /api/expenses

  - [ ] 3.1 Extend the GET / handler in `backend/src/routes/expenses.ts` to read `startDate` and `endDate` query params
    - Destructure `startDate` and `endDate` from `req.query` alongside existing `propertyId` and `status`
    - When `startDate` is present, add `where.date = { gte: new Date(startDate as string) }` to the Prisma where clause
    - When `endDate` is present, merge `lte: new Date(endDate as string)` into `where.date`
    - Leave the existing `propertyId` and `status` filter logic entirely unchanged
    - When neither param is supplied the route returns all landlord-scoped expenses (Preservation Requirement 3.10)
    - _Bug_Condition: isBugCondition_5a — `backendIgnoresMonthParam === true` causing bar chart expenses to render at zero height_
    - _Expected_Behavior: GET /api/expenses?startDate=<ISO>&endDate=<ISO> returns only expenses whose `date` field falls within [startDate, endDate]_
    - _Preservation: No date params → full unfiltered landlord-scoped expense list returned (Requirement 3.10)_
    - _Requirements: 2.12, 2.14, 3.10_

  - [ ] 3.2 Verify bug condition exploration test now passes (bar chart expenses fix)
    - **Property 1: Expected Behavior** - GET /api/expenses Respects startDate/endDate
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 5a — do NOT write a new test
    - The exploration test asserts that mocked expense data for a past month is returned when correct date range params are supplied
    - **EXPECTED OUTCOME**: Test PASSES (confirms the backend now honours date range params)
    - _Requirements: 2.12_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - GET /api/expenses No-Param Behaviour Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for this endpoint
    - **EXPECTED OUTCOME**: Tests PASS — no-param calls still return all landlord expenses (no regressions)

- [ ] 4. Backend fix: Add search param to GET /api/leases

  - [ ] 4.1 Extend the GET / handler in `backend/src/routes/leases.ts` to accept a `search` query parameter
    - Read optional `search` from `req.query` at the top of the handler
    - Build the base `where` clause as `{ property: { landlordId: authReq.userId } }`
    - When `search` is a non-empty trimmed string, add a nested `tenants.some.tenant.OR` clause covering `name`, `email`, and `phone` (all using `{ contains: q }`)
    - When `search` is absent or empty, do not add the extra filter — all leases for the landlord are returned (Preservation Requirement 3.11)
    - _Bug_Condition: isBugCondition_3 — `backendSearchEndpointDoesNotExist === true` and `resultSet === inMemoryFilterOnly`_
    - _Expected_Behavior: GET /api/leases?search=<term> returns only leases whose tenant name, email, or phone contains the search term_
    - _Preservation: GET /api/leases with no search param continues to return all leases (Requirement 3.11)_
    - _Requirements: 2.6, 2.7, 3.11_

  - [ ] 4.2 Verify bug condition exploration test now passes (tenant search fix)
    - **Property 1: Expected Behavior** - GET /api/leases Returns DB Search Results
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 3
    - **EXPECTED OUTCOME**: Test PASSES — backend is now called with `?search=` and results from the DB are returned

  - [ ] 4.3 Verify preservation tests still pass
    - **Property 2: Preservation** - GET /api/leases No-Search Behaviour Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for this endpoint
    - **EXPECTED OUTCOME**: Tests PASS — no-search calls still return all landlord leases

- [ ] 5. Backend fix: Add POST /api/cron/schedules endpoint

  - [ ] 5.1 Add a `POST /schedules` handler to `backend/src/routes/cron.ts`
    - Record `const start = Date.now()` at handler entry
    - Call `await generateMonthlySchedules()` (already imported from `paymentService.ts`)
    - On success, write a `CronLog` record with `{ type: "schedules", status: "success", affected, duration: Date.now() - start }` and respond `res.json({ success: true, affected })`
    - On error, write a `CronLog` record with `{ type: "schedules", status: "failed", error: e.message }` and respond `res.status(500).json({ error: e.message })`
    - _Bug_Condition: isBugCondition_4a — `input.endpoint === "/api/payments/schedules"` which is GET-only, so `POST` returns 404_
    - _Expected_Behavior: POST /api/cron/schedules calls `generateMonthlySchedules()`, writes a CronLog, and returns `{ success: true, affected: N }`_
    - _Preservation: Existing POST /api/cron/late-fees and POST /api/cron/reminders handlers are untouched (Requirement 3.3, 3.4)_
    - _Requirements: 2.8, 3.3_

  - [ ] 5.2 Verify bug condition exploration test now passes (Generate Schedules endpoint fix)
    - **Property 1: Expected Behavior** - POST /api/cron/schedules Triggers generateMonthlySchedules
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 4a
    - **EXPECTED OUTCOME**: Test PASSES — `POST /api/cron/schedules` returns 200 and a CronLog record is created

  - [ ] 5.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Cron Endpoints Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for cron routes
    - **EXPECTED OUTCOME**: Tests PASS — late-fees, reminders, and manual-reminders routes continue to work

- [ ] 6. Backend fix: Add GET /api/cron/logs endpoint

  - [ ] 6.1 Add a `GET /logs` handler to `backend/src/routes/cron.ts`
    - Query `db.cronLog.findMany({ take: 20, orderBy: { createdAt: "desc" } })`
    - Respond with `res.json({ logs })`
    - This route is already protected by `router.use(requireAuth)` at the top of the file — no additional auth middleware is needed
    - _Bug_Condition: isBugCondition_4b/4c — `EventSource` connection unauthenticated AND `GET /api/cron/logs` does not exist, so "Refresh Status" and polling cannot retrieve CronLog records_
    - _Expected_Behavior: GET /api/cron/logs returns the 20 most-recent CronLog records in descending createdAt order_
    - _Preservation: SSE route `/api/cron/sse` is not removed — it is simply no longer used by the frontend after Fix 8b_
    - _Requirements: 2.9, 2.10_

  - [ ] 6.2 Verify bug condition exploration tests now pass (cron log retrieval)
    - **Property 1: Expected Behavior** - GET /api/cron/logs Returns Recent Log Records
    - **IMPORTANT**: Re-run the SAME exploration tests from task 1 for Bugs 4b and 4c
    - **EXPECTED OUTCOME**: Tests PASS — authenticated polling and Refresh Status button can now read CronLog records

  - [ ] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing SSE and Cron Routes Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for cron routes
    - **EXPECTED OUTCOME**: Tests PASS — no regressions on existing routes

- [ ] 7. Frontend fix: Wire real data in Overview page

  - [ ] 7.1 Remove hardcoded constants and add real API fetches in `frontend/app/payments/overview/page.tsx`
    - Remove the `INFLOW`, `OUTFLOW`, `DAYS` compile-time constant arrays and the `expenses = 128900` placeholder
    - Add `useState` for `stats` (dashboard stats shape), `expensesTotal` (number), and `cashFlowData` (inflow/outflow arrays derived from `stats.revenueTrend`)
    - Add a `useEffect` that calls `api.get("/api/dashboard/stats")` and `api.get("/api/expenses")` in parallel using `Promise.all`
    - Map `stats.revenueTrend` (monthly revenue array) to inflow-proxy data for the area chart, and populate outflow from `stats.expenseByCategory` totals or a reasonable derivation
    - Compute `expensesTotal` as the sum of all `expense.amount` values returned by `GET /api/expenses`
    - For Property Summary occupancy, read per-property data from `GET /api/dashboard/stats` (e.g. `stats.propertySummary` if available, else derive from `unitTypes.totalUnits`)
    - Keep the existing `loadPayments()` call untouched — it populates Recent Transactions and Method Breakdown (Preservation Requirement 3.8)
    - _Bug_Condition: isBugCondition_1 — `cashFlowDataSource === "HARDCODED_CONSTANT"` OR `expensesValue === 128900 AND backendNotCalled` OR `propertyRow.occupancy === "—" AND unitCountEndpointNotCalled`_
    - _Expected_Behavior: Expenses card value equals sum of expenses from `GET /api/expenses`; area chart reflects live revenue trend data; occupancy column populated from stats endpoint_
    - _Preservation: `getPayments()` and `getRentSchedules()` still called; Recent Transactions and Method Breakdown unchanged (Requirement 3.8)_
    - _Requirements: 2.1, 2.2, 2.3, 3.8_

  - [ ] 7.2 Verify bug condition exploration test now passes (Overview real data)
    - **Property 1: Expected Behavior** - Overview Renders Live API Data Not Constants
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 1
    - **EXPECTED OUTCOME**: Test PASSES — Expenses card shows live sum, chart uses API-derived arrays, occupancy populated

  - [ ] 7.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Overview Recent Transactions and Method Breakdown Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for the Overview page
    - **EXPECTED OUTCOME**: Tests PASS — `getPayments()` and `getRentSchedules()` still called; no regressions

- [ ] 8. Frontend fix: Schedules page — fetch payments on mount

  - [ ] 8.1 Add `getPayments()` call alongside `getRentSchedules()` in `frontend/app/payments/schedules/page.tsx`
    - Rename or replace `fetchSchedules` with `fetchData` that uses `Promise.all([getRentSchedules(), getPayments()])`
    - Call `setSchedules(schedulesData)` and `setPayments(paymentsData)` (the `setPayments` setter already exists but was never called)
    - Update the `useEffect` to call `fetchData()` instead of `fetchSchedules()`
    - Ensure the `useCallback` dependency array is correct so the function is stable
    - _Bug_Condition: isBugCondition_2 — `input.payments.length === 0 AND backendPaymentsEndpointExists AND fetchPaymentsWasNeverCalled`_
    - _Expected_Behavior: After mount, `payments` state contains real payment records; `getDisplayStatus`, `counts`, and `totals` produce correct values derived from actual payment allocations_
    - _Preservation: Client-side `search` state filter continues to work; status card click continues to toggle `statusFilter` (Requirements 3.1, 3.2, 3.3)_
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3_

  - [ ] 8.2 Verify bug condition exploration test now passes (Schedules payments fetch)
    - **Property 1: Expected Behavior** - Schedules Status Cards Reflect Real Payment Data
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 2
    - **EXPECTED OUTCOME**: Test PASSES — `payments.length > 0` after mount; Paid count card shows correct value

  - [ ] 8.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Schedules Search, Status Filter, and fetchData Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for the Schedules page
    - **EXPECTED OUTCOME**: Tests PASS — client-side search, status toggle, and post-action refresh all work

- [ ] 9. Frontend fix: Wire backend search in Tenant page

  - [ ] 9.1 Add debounced backend search to `frontend/app/payments/tenant/page.tsx`
    - Add `searchLeases` state (`Lease[]`, initially `[]`) separate from the existing `leases` state
    - Add a `useEffect` that depends on `search`; when `search.trim()` is non-empty, wait 300 ms then call `api.get("/api/leases", { params: { search } })` and populate `searchLeases` from `res.data.leases` (mapping `tenants[0].tenant` to a flat `tenant` field)
    - When `search.trim()` is empty, clear `searchLeases` and return the clearTimeout cleanup
    - In JSX, render `searchLeases` as the dropdown/autocomplete results when search is active; fall back to the pre-loaded `leases` list when search is empty (preserving initial-load sidebar behaviour)
    - Leave the tenant selection flow (`fetchTenantFinancials`, statement table, PDF generation) completely unchanged (Preservation Requirements 3.6, 3.7)
    - _Bug_Condition: isBugCondition_3 — `input.searchTerm.trim().length > 0 AND backendSearchEndpointDoesNotExist AND resultSet === inMemoryFilterOnly`_
    - _Expected_Behavior: Typing a search term calls `GET /api/leases?search=<term>` and renders DB results including tenants not in the initial fetch_
    - _Preservation: Selecting a tenant still loads financials; PDF generation still works; initial lease list still loads on mount (Requirements 3.6, 3.7)_
    - _Requirements: 2.6, 2.7, 3.6, 3.7_

  - [ ] 9.2 Verify bug condition exploration test now passes (Tenant backend search)
    - **Property 1: Expected Behavior** - Tenant Search Calls Backend with Search Param
    - **IMPORTANT**: Re-run the SAME exploration test from task 1 for Bug 3
    - **EXPECTED OUTCOME**: Test PASSES — `GET /api/leases?search=<term>` is called and results appear in the dropdown

  - [ ] 9.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Tenant Statement, PDF, and Initial Load Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for the Tenant page
    - **EXPECTED OUTCOME**: Tests PASS — statement table, PDF download, and initial lease load all work

- [ ] 10. Frontend fix: Fix Automation page (endpoint, polling, refresh button)

  - [ ] 10.1 Fix "Generate Schedules" endpoint key in `frontend/app/payments/automation/page.tsx`
    - In `CRON_DEFS` (or equivalent config), change the `schedules` entry from `endpoint: "/api/payments/schedules"` to `endpoint: "/api/cron/schedules"`
    - This is the only change needed for Bug 4a — do not alter any other `CRON_DEFS` entries
    - _Bug_Condition: isBugCondition_4a — `input.endpoint === "/api/payments/schedules"` and `HTTP_POST(input.endpoint).status !== 200`_
    - _Expected_Behavior: "Run Now" for Generate Schedules POSTs to `/api/cron/schedules` and receives a 200 response_
    - _Preservation: "Send Reminders" endpoint `/api/cron/reminders/manual` is unchanged (Requirement 3.4)_
    - _Requirements: 2.8, 3.3, 3.4_

  - [ ] 10.2 Replace unauthenticated EventSource with authenticated axios polling
    - Remove the `new EventSource("/api/cron/sse")` `useEffect` block entirely
    - Extract a `fetchCronLogs` async function: call `api.get("/api/cron/logs")` and call `setCronLogs(res.data?.logs ?? [])`
    - Add a `useEffect` that calls `fetchCronLogs()` immediately on mount, then sets `setInterval(fetchCronLogs, 10_000)` and returns the `clearInterval` cleanup
    - _Bug_Condition: isBugCondition_4b — `input.connectionType === "EventSource" AND input.authHeaderPresent === false AND backendRequiresAuth === true`_
    - _Expected_Behavior: CronLog records arrive via authenticated axios polling every 10 s; Last Run column updates after a successful run_
    - _Preservation: The existing run-log state and UI that shows manual reminder results is unchanged (Requirement 3.4)_
    - _Requirements: 2.9, 3.4_

  - [ ] 10.3 Wire onClick to the "Refresh Status" button
    - Attach `onClick={fetchCronLogs}` to the "Refresh Status" `<button>` element (using the same function extracted in step 10.2)
    - No other change to the button's appearance or position is needed
    - _Bug_Condition: isBugCondition_4c — `input.buttonLabel === "Refresh Status" AND input.onClickHandler === undefined`_
    - _Expected_Behavior: Clicking "Refresh Status" calls `GET /api/cron/logs` and updates `cronLogs` state_
    - _Preservation: Button continues to be rendered in the same location in the UI_
    - _Requirements: 2.10_

  - [ ] 10.4 Verify all three Automation bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Automation Wiring: Correct Endpoint, Authenticated Polling, Refresh Button
    - **IMPORTANT**: Re-run the SAME exploration tests from task 1 for Bugs 4a, 4b, 4c
    - **EXPECTED OUTCOME**: All three tests PASS

  - [ ] 10.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Send Reminders and Run Log Unchanged
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for the Automation page
    - **EXPECTED OUTCOME**: Tests PASS — "Send Reminders" still POSTs correctly; run log still displays results

- [ ] 11. Frontend fix: Fix Reports page (date filters, KRA download, unified cards)

  - [ ] 11.1 Update `fetchExpensesForMonth` and `fetchExpenses` to use startDate/endDate params in `frontend/app/payments/reports/page.tsx`
    - In `fetchExpensesForMonth(m, pid)`: derive `startDate = new Date(year, mo-1, 1).toISOString()` and `endDate = new Date(year, mo, 0, 23, 59, 59).toISOString()`; pass them as `params.startDate` / `params.endDate` to `api.get("/api/expenses")`; remove the `month` param
    - In `fetchExpenses()`: apply the same `startDate`/`endDate` derivation from the current `month` filter; update the `useCallback` dependency array to `[propertyId, month]` (already correct — just ensure the params match the new backend interface)
    - Remove any client-side `filter((e) => e.date.slice(0,7) === m)` that was masking results
    - _Bug_Condition: isBugCondition_5a — `backendIgnoresMonthParam === true AND filteredClientSide.length === 0 AND actualExpensesExistForMonth === true`_
    - _Bug_Condition: isBugCondition_5c — `fetchExpenses` sends `month` param that backend ignores; changing filter returns unfiltered list_
    - _Expected_Behavior: Expenses bar for month `m` renders with non-zero height when expense records exist for that month; Expenses breakdown updates on filter change_
    - _Preservation: All five fetch callbacks still fire on filter change (Requirement 3.9)_
    - _Requirements: 2.12, 2.14, 3.9_

  - [ ] 11.2 Fix KRA Report download to use authenticated axios
    - Replace the `window.open('/api/payments/reports?...', '_blank')` call with an `api.get("/api/payments/reports", { params, responseType: "blob" })` call
    - Create a temporary object URL from the blob and trigger a download via a programmatic `<a>` click
    - Include `propertyId` and `month` in the params (Preservation Requirement 3.5)
    - Revoke the object URL after the click
    - _Bug_Condition: isBugCondition_5b — `input.downloadMethod === "window.open" AND authTokenNotIncluded AND backendResponse.status === 401`_
    - _Expected_Behavior: Clicking "KRA Report" triggers an authenticated download; backend returns the CSV with status 200_
    - _Preservation: `propertyId` and `month` query params are still included in the download request (Requirement 3.5)_
    - _Requirements: 2.13, 3.5_

  - [ ] 11.3 Unify summary card data sources
    - Derive `expensesDisplay` from `realExpensesTotal` (the live expenses fetch) — already in use for the Expenses card
    - Replace the Net P&L card's `pl` value (from CSV-parsed `ReportSummary`) with `revenue - expensesDisplay` so both cards share the same expenses source
    - Ensure `revenue` and `arrears` continue to come from `fetchSummary` (CSV route) — only the P&L derivation changes
    - _Bug_Condition: isBugCondition_5d — `expensesCard.source !== plCard.expensesSource AND (revenue - expensesCard.value) !== plCard.value`_
    - _Expected_Behavior: `Net P&L card value === Revenue card value − Expenses card value` for all filter combinations_
    - _Preservation: Revenue and Arrears cards still sourced from CSV route; `fetchSummary` still called on filter change (Requirement 3.9)_
    - _Requirements: 2.11, 3.9_

  - [ ] 11.4 Verify all four Reports bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Reports: Expenses Bars Non-Zero, KRA Authenticated, Cards Coherent, Filter Re-fetches
    - **IMPORTANT**: Re-run the SAME exploration tests from task 1 for Bugs 5a, 5b, 5c (subsumed by 5a after fix), 5d
    - **EXPECTED OUTCOME**: All four tests PASS

  - [ ] 11.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Reports Filter Triggers All Five Fetches; KRA Includes Correct Params
    - **IMPORTANT**: Re-run the SAME preservation tests from task 2 for the Reports page
    - **EXPECTED OUTCOME**: Tests PASS — all five fetch callbacks still fire; KRA download still includes `propertyId` and `month`

- [ ] 12. Checkpoint — Ensure all tests pass
  - Re-run the full test suite (unit + component + integration) to confirm every exploration test now passes (bugs fixed) and every preservation test still passes (no regressions)
  - Confirm backend unit tests pass: `GET /api/expenses` with date range returns scoped results; `GET /api/leases?search=` returns filtered results; `POST /api/cron/schedules` creates a CronLog and returns 200; `GET /api/cron/logs` returns 20 most-recent records in descending order
  - Confirm property-based tests pass: expenses date filter invariant; leases search containment invariant; summary card coherence (`plDisplay === revenue − expensesDisplay`); schedules counts completeness (`paid + overdue + partial + scheduled === schedules.length`)
  - Confirm integration flows pass end-to-end: expense for month M → Reports bar for M non-zero; paid payment → Schedules Paid count ≥ 1; tenant created → appears in Tenant search; "Run Now" Generate Schedules → CronLog record exists; "Refresh Status" → Last Run column updated; "KRA Report" → CSV downloaded without 401
  - Ensure all tests pass; ask the user if any questions arise
