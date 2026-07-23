# Requirements: Dashboard Real Analytics

## Overview

Replace all hardcoded/placeholder data on the main dashboard (Overview) with live data fetched from the backend. The dashboard serves the landlord role and aggregates metrics across all their properties.

---

## Requirements

### REQ-1: Backend Dashboard Stats Endpoint

**User Story:** As a landlord, I want a single API call that returns all the aggregated stats I need for the dashboard, so the frontend loads efficiently.

#### Acceptance Criteria

1. A `GET /api/dashboard/stats` endpoint exists, requires auth, and returns a JSON object with the following fields:
   - `totalProperties`: total number of properties owned by the landlord
   - `activeLeases`: number of leases with status `active`
   - `occupancyRate`: percentage (float, 0–100) of properties that have at least one active lease
   - `monthlyRevenue`: sum of paid payments for the current calendar month
   - `totalArrears`: sum of amounts from `RentSchedule` rows with status `overdue` or `scheduled` and `dueDate` in the past, scoped to the landlord's properties
   - `revenueTrend`: array of `{ month: string, revenue: number }` for the last 6 calendar months (including current)
   - `expenseByCategory`: array of `{ category: string, total: number }` aggregated from all expenses across the landlord's properties
   - `recentPayments`: last 5 paid payments, each with `{ id, tenantName, propertyTitle, amount, paidAt, method }`
   - `leasesExpiringSoon`: leases ending within the next 30 days, each with `{ id, propertyTitle, tenantNames: string[], endDate }`

2. All monetary values are returned as numbers (not strings).
3. The endpoint is scoped strictly to the authenticated landlord — no other landlord's data leaks.
4. The endpoint returns 200 with all fields present even when counts are zero (empty arrays, zero values).

---

### REQ-2: Frontend Dashboard Store Slice

**User Story:** As a developer, I want a dedicated Zustand store (or store slice) for dashboard data so it can be fetched once on mount and shared across dashboard components.

#### Acceptance Criteria

1. A `useDashboardStore` (or equivalent) exists with:
   - State fields matching the shape returned by `GET /api/dashboard/stats`
   - A `loading: boolean` field
   - A `fetchStats(): Promise<void>` action that calls `GET /api/dashboard/stats` and populates state
2. The store does **not** use `persist` (dashboard data should always be fresh).
3. The dashboard page calls `fetchStats()` on component mount via `useEffect`.

---

### REQ-3: KPI Stat Cards — Live Data

**User Story:** As a landlord, I want the four top stat cards to show my actual property portfolio metrics.

#### Acceptance Criteria

1. **Total Properties** card shows the real `totalProperties` count.
2. **Occupancy Rate** card shows the real `occupancyRate` formatted as a percentage (e.g., `87.5%`).
3. **Monthly Revenue** card shows the real `monthlyRevenue` formatted as `KES X,XXX` (Kenyan Shilling with comma separators).
4. **Total Arrears** card replaces the "AI Growth Index" placeholder and shows the real `totalArrears` formatted as `KES X,XXX`.
5. The change/sub-text line under each card is removed or replaced with a neutral label (e.g., "this month", "outstanding") — no fabricated percentage growth.
6. While `loading` is true, each card shows a skeleton/pulse placeholder instead of stale or zero values.

---

### REQ-4: Revenue Trend Line Chart — Live Data

**User Story:** As a landlord, I want to see my actual monthly revenue over the last 6 months so I can spot trends.

#### Acceptance Criteria

1. The SVG placeholder line chart is replaced with a Recharts `LineChart` component.
2. It renders the `revenueTrend` array from the store (6 data points).
3. X-axis labels show abbreviated month names (e.g., "Jan", "Feb").
4. Y-axis values are formatted as `KES` amounts with K-suffix for thousands (e.g., `KES 5K`).
5. Tooltip shows the full amount on hover.
6. While loading, a skeleton placeholder occupies the chart area.

---

### REQ-5: Expense Breakdown Chart — Live Data

**User Story:** As a landlord, I want to see how my expenses break down by category so I can manage costs.

#### Acceptance Criteria

1. The SVG placeholder pie/donut chart is replaced with a Recharts `PieChart` (donut style) showing `expenseByCategory`.
2. Each slice is labeled with its category name.
3. A legend below the chart shows category → color mapping.
4. If there are no expenses, the chart shows an empty-state message: "No expenses recorded yet."
5. While loading, a skeleton placeholder occupies the chart area.

---

### REQ-6: Recent Payments List

**User Story:** As a landlord, I want to see the most recent payments at a glance on the dashboard.

#### Acceptance Criteria

1. A new "Recent Payments" section is added to the dashboard below the charts.
2. It shows up to 5 rows, each displaying: tenant name, property title, amount (formatted as `KES X,XXX`), payment method, and date (formatted as `DD MMM YYYY`).
3. Each row has a "View all" link that navigates to `/payments`.
4. If there are no payments, the section shows: "No payments yet."
5. While loading, skeleton rows are displayed.

---

### REQ-7: Leases Expiring Soon Alert

**User Story:** As a landlord, I want to be alerted when leases are about to expire so I can take action.

#### Acceptance Criteria

1. A new "Leases Expiring Soon" section is added to the dashboard (can be a compact list or alert cards).
2. It shows leases ending within 30 days, displaying: property title, tenant name(s), and the expiry date.
3. Each entry has a link to the leases page (`/leases`).
4. If no leases are expiring soon, the section is hidden entirely (don't show empty state for this one — absence of a warning is good news).
5. While loading, a skeleton placeholder is shown only if data hasn't loaded yet.

---

### REQ-8: Error Handling

**User Story:** As a landlord, I want the dashboard to degrade gracefully if the API fails, so I'm not stuck on a broken screen.

#### Acceptance Criteria

1. If `fetchStats()` fails, an inline error message is displayed at the top of the dashboard: "Could not load dashboard data. Please refresh."
2. Individual chart/card sections do not throw — they show a neutral fallback (zero values or empty-state messages) if their data subset is missing.
3. No unhandled promise rejections or console errors from network failures.
