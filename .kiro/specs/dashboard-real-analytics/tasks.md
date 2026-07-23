# Implementation Plan: Dashboard Real Analytics

## Overview

Replace all hardcoded/placeholder data on the dashboard Overview page with live data. The plan proceeds in layers: backend endpoint first, then the Zustand store, then the dashboard page components (KPI cards, charts, lists), and finally property-based and integration tests.

---

## Tasks

- [x] 1. Create the backend dashboard stats route
  - [x] 1.1 Create `backend/src/routes/dashboard.ts` with a `GET /stats` handler
    - Add `requireAuth` middleware to the route
    - Run 6 Prisma queries inside `Promise.all`: property count, active lease count, monthly revenue, arrears, revenue trend (last 6 months), expense-by-category, recent payments, leases expiring soon
    - Scope every query with `where: { property: { landlordId: userId } }` or `where: { landlordId: userId }` to enforce tenant isolation
    - Return the `DashboardStats` response shape with all fields present; return zeros/empty arrays when no data exists
    - _Requirements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4_

  - [x] 1.2 Register the new route in `backend/src/index.ts`
    - Import `dashboardRoutes` from `./routes/dashboard.js`
    - Mount with `app.use("/api/dashboard", dashboardRoutes)`
    - _Requirements: REQ-1.1_

  - [ ]* 1.3 Write property test for stats response structural completeness
    - **Property 1: Stats response structural completeness**
    - Generate arbitrary landlord datasets (random counts of properties, leases, payments) and call the stats computation function
    - Assert all required keys are present with correct types (numbers are `number`, arrays are arrays)
    - Tag: `// Feature: dashboard-real-analytics, Property 1: stats response structural completeness`
    - **Validates: REQ-1.1, REQ-1.2, REQ-1.4**

  - [ ]* 1.4 Write property test for landlord data isolation
    - **Property 2: Landlord data isolation**
    - Generate two landlords each with separate property/payment sets; compute stats for each
    - Assert no cross-contamination: no shared IDs, amounts sum to per-landlord totals only
    - Tag: `// Feature: dashboard-real-analytics, Property 2: landlord data isolation`
    - **Validates: REQ-1.3**

- [x] 2. Create the frontend Zustand dashboard store
  - [x] 2.1 Create `frontend/app/store/dashboardStore.ts`
    - Define `DashboardStats` TypeScript interface matching the backend response shape (copy shared types if a shared types file exists)
    - Implement `useDashboardStore` with state fields `stats`, `loading`, `error` and a `fetchStats()` action
    - `fetchStats()` calls `GET /api/dashboard/stats` via the shared Axios `api` instance, wraps in `try/catch`, sets `loading` around the call
    - On error, set `error: "Could not load dashboard data. Please refresh."` and keep `loading: false`
    - Do NOT add `persist` middleware
    - Use nullish coalescing defaults so consumers never receive `undefined`
    - _Requirements: REQ-2.1, REQ-2.2, REQ-8.1, REQ-8.3_

  - [ ]* 2.2 Write property test for store state round-trip
    - **Property 3: Store state mirrors API response**
    - Generate random `DashboardStats` objects; mock `api.get` to return them; call `fetchStats()`
    - Assert `store.stats` deeply equals the generated object, `loading` is `false`, and `error` is `null`
    - Tag: `// Feature: dashboard-real-analytics, Property 3: store state mirrors API response`
    - **Validates: REQ-2.1**

- [x] 3. Implement KES formatting utilities
  - [x] 3.1 Add `formatKES` and `formatKESShort` helper functions
    - Create or extend `frontend/app/utils/format.ts` (or equivalent shared utils file)
    - `formatKES(n)`: returns `KES X,XXX` with comma-grouped thousands, no decimal places
    - `formatKESShort(n)`: returns `KES XK` for values ≥ 1,000, `KES X` for smaller values
    - Also add `formatDate(iso: string)` using `date-fns` `format(new Date(iso), 'dd MMM yyyy')`
    - _Requirements: REQ-3.3, REQ-3.4, REQ-4.4, REQ-6.2_

  - [ ]* 3.2 Write property test for KES amount formatting correctness
    - **Property 4: KES amount formatting correctness**
    - Generate random non-negative floats; apply `formatKES` and `formatKESShort`
    - Assert: output starts with `"KES "`, full format has no decimal places, short format applies `K` suffix iff value ≥ 1000
    - Tag: `// Feature: dashboard-real-analytics, Property 4: KES amount formatting correctness`
    - **Validates: REQ-3.3, REQ-3.4, REQ-4.4**

- [x] 4. Rewrite the dashboard KPI stat cards
  - [x] 4.1 Update `frontend/app/dashboard/page.tsx` to wire the store
    - Add `useEffect` that calls `useDashboardStore.fetchStats()` on mount
    - Destructure `stats`, `loading`, `error` from the store
    - Render an inline error banner at the top when `error` is set: "Could not load dashboard data. Please refresh."
    - _Requirements: REQ-2.3, REQ-8.1_

  - [x] 4.2 Replace hardcoded KPI cards with live data
    - **Total Properties** card → `stats?.totalProperties ?? 0`
    - **Occupancy Rate** card → `stats?.occupancyRate` formatted as `"87.5%"` (one decimal place)
    - **Monthly Revenue** card → `formatKES(stats?.monthlyRevenue ?? 0)`
    - **Total Arrears** card → replaces the "AI Growth Index" placeholder → `formatKES(stats?.totalArrears ?? 0)` with sub-label "outstanding"
    - Remove fabricated percentage growth sub-text; replace with neutral labels ("this month", "outstanding")
    - Show pulse skeleton placeholders while `loading` is true
    - _Requirements: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5, REQ-3.6_

- [x] 5. Implement Recharts Revenue Trend line chart
  - [x] 5.1 Replace the SVG placeholder with a Recharts `LineChart`
    - Install `recharts` if not already present (`npm install recharts`)
    - Use `ResponsiveContainer` + `LineChart` bound to `stats?.revenueTrend ?? []`
    - X-axis: abbreviated month names from `RevenueTrendItem.month`
    - Y-axis: `tickFormatter={formatKESShort}`
    - `Tooltip` shows full `formatKES` amount on hover
    - Show a skeleton placeholder occupying the chart area while `loading` is true
    - _Requirements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6_

- [x] 6. Implement Recharts Expense Breakdown donut chart
  - [x] 6.1 Replace the SVG placeholder with a Recharts `PieChart`
    - Use `PieChart` with `innerRadius` set for donut style, bound to `stats?.expenseByCategory ?? []`
    - Each slice labeled with its `category` name
    - Render a `Legend` below the chart showing category → color mapping
    - When `expenseByCategory` is empty, show "No expenses recorded yet." message instead of the chart
    - Show a skeleton placeholder while `loading` is true
    - _Requirements: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5_

- [x] 7. Implement Recent Payments section
  - [x] 7.1 Add the Recent Payments list to the dashboard
    - Add a "Recent Payments" section below the charts
    - Render up to 5 rows from `stats?.recentPayments ?? []`
    - Each row: tenant name, property title, `formatKES(amount)`, payment method, `formatDate(paidAt)`
    - Include a "View all" link navigating to `/payments`
    - When array is empty, show "No payments yet."
    - Show skeleton rows while `loading` is true
    - _Requirements: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5_

  - [ ]* 7.2 Write property test for payment row rendering completeness
    - **Property 5: Payment row rendering completeness**
    - Generate random `RecentPayment` objects; shallow-render the payment row component
    - Assert tenant name, property title, formatted amount, method, and formatted date are all present in the output
    - Tag: `// Feature: dashboard-real-analytics, Property 5: payment row rendering completeness`
    - **Validates: REQ-6.2**

- [x] 8. Implement Leases Expiring Soon section
  - [x] 8.1 Add the Leases Expiring Soon section to the dashboard
    - Conditionally render a section only when `stats?.leasesExpiringSoon?.length > 0`
    - Each entry shows: property title, tenant name(s) (joined), expiry date (`formatDate`)
    - Each entry links to `/leases`
    - Show a skeleton placeholder while `loading` is true and data not yet loaded
    - _Requirements: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5_

  - [ ]* 8.2 Write property test for leases expiring soon visibility
    - **Property 6: Leases expiring soon section visibility**
    - Generate arrays of `ExpiringLease` with lengths 0 through N; render the dashboard
    - Assert section is present in the DOM iff `length > 0`
    - Tag: `// Feature: dashboard-real-analytics, Property 6: leases expiring soon visibility`
    - **Validates: REQ-7.1, REQ-7.4**

- [ ] 9. Component robustness and error handling
  - [ ]* 9.1 Write property test for component robustness
    - **Property 7: Component renders without throwing for any valid stats shape**
    - Generate arbitrary valid `DashboardStats` objects (including all-zeros, all-empty-arrays edge cases); render the dashboard page wrapped in an error boundary
    - Assert no exceptions are thrown and the error boundary is never triggered
    - Tag: `// Feature: dashboard-real-analytics, Property 7: component renders without throwing`
    - **Validates: REQ-8.2**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The design specifies TypeScript throughout; all implementation must use TypeScript
- The `recharts` package should be added as a dependency if not already installed
- `fast-check` must be added as a dev dependency for property-based tests (compatible with Jest/Vitest)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- All monetary values from the backend are numbers — format only on the frontend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "6.1"] },
    { "id": 4, "tasks": ["7.1", "8.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "9.1"] }
  ]
}
```
