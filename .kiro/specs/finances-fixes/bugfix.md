# Bugfix Requirements Document

## Introduction

The Finance section of the Nexus Rent application contains multiple areas where the UI either displays hardcoded/static data instead of live backend data, or where user-initiated actions (search, cron triggers, report filters, refresh) fail to reach or correctly use backend endpoints. This document captures the defective behavior in each sub-section — Overview, Schedules, Tenant, Automation, and Reports — along with the expected correct behavior and the regression boundaries that must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

**Finances / Overview**

1.1 WHEN the Overview page loads THEN the system displays hardcoded cash-flow inflow and outflow arrays (`INFLOW`, `OUTFLOW`, `DAYS`) instead of fetching real cash-flow data from the backend.

1.2 WHEN the Overview page loads THEN the system displays a hardcoded `expenses` value of `128900` instead of computing total expenses from the backend `GET /api/expenses` endpoint.

1.3 WHEN the Overview page loads THEN the system derives "Property Summary" occupancy values from local payment records rather than from a dedicated analytics endpoint, producing incomplete occupancy data.

**Finances / Schedules**

1.4 WHEN the Schedules page loads THEN the status summary cards (Overdue, Partial, Scheduled, Paid) show counts and totals derived solely from the `schedules` array without joining the `payments` state, because `setPayments` is never called and the `payments` state remains empty, causing `getDisplayStatus` and `totals` calculations to always produce incorrect values.

1.5 WHEN the Schedules page loads THEN the system fetches `getRentSchedules` but never fetches the corresponding payments list, so the `payments` array used in `getPaymentState` is always `[]`, making partial/paid detection unreliable.

**Finances / Tenant**

1.6 WHEN a user types in the tenant search box THEN the system filters only the already-loaded `leases` array in memory and cannot find tenants that are not yet present in the initial lease fetch, because there is no backend search endpoint call wired to the input.

1.7 WHEN the initial lease list is large or paginated on the backend THEN the system returns incomplete search results because the client-side filter operates on a potentially truncated local dataset.

**Finances / Automation**

1.8 WHEN a user clicks "Run Now" for the "Generate Schedules" cron entry THEN the system sends a `POST` request to `/api/payments/schedules`, which is a `GET`-only route that returns schedule data, not a cron trigger; the request therefore receives an HTTP 404 or unexpected response and the cron action does not execute.

1.9 WHEN a user clicks "Run Now" for any cron entry and it succeeds THEN the system shows `"Never run"` in the Last Run column because the SSE stream (`/api/cron/sse`) is opened without authentication headers and the EventSource API does not send cookies by default to a different-origin endpoint, so no `CronLog` records are received by the client.

1.10 WHEN a user clicks the "Refresh Status" button THEN the system does nothing because the button has no `onClick` handler attached to it.

**Finances / Reports**

1.11 WHEN the Reports page loads THEN the summary cards (Revenue, Arrears, Expenses, Net Profit) show `0K` briefly and then populate via the CSV-parsing pipeline (`GET /api/payments/reports`), but the Revenue value is derived from that CSV while the Expenses and Net Profit values diverge — Expenses is recomputed from `realExpensesTotal` (the live expenses list) while the P&L card still uses the CSV-parsed `pl` value — causing inconsistent card values.

1.12 WHEN the bar graph renders THEN the Revenue bars display correctly but the Expenses bars always render at zero height for all months because `fetchExpensesForMonth` sends a `month` query parameter that the `GET /api/expenses` backend route does not recognise (the route filters by `propertyId` and `status` but has no `month` filter), so the returned expense list is always the full unfiltered list and the subsequent `filter((e) => e.date.slice(0, 7) === m)` inside `fetchExpensesForMonth` returns zero items for past months that happen not to match.

1.13 WHEN a user clicks the "KRA Report" button THEN the system opens `/api/payments/reports` in a new browser tab with query parameters built from `window.location` instead of using the axios instance, so the request is missing the authentication cookie/token and the backend returns a 401 Unauthorized response.

1.14 WHEN a user changes the Property or Month filter THEN expenses shown in the Expenses breakdown section do not update to reflect the new filter because `fetchExpenses` sends the `month` parameter but the `GET /api/expenses` route ignores it, returning all expenses regardless of the selected period.

---

### Expected Behavior (Correct)

**Finances / Overview**

2.1 WHEN the Overview page loads THEN the system SHALL fetch real cash-flow data from the backend and render the inflow/outflow area chart from live data.

2.2 WHEN the Overview page loads THEN the system SHALL fetch total expenses from `GET /api/expenses` (scoped to the authenticated landlord) and display the computed sum in the Expenses metric card.

2.3 WHEN the Overview page loads THEN the system SHALL derive Property Summary occupancy from the same analytics data used by the dashboard stats endpoint, reflecting actual unit counts.

**Finances / Schedules**

2.4 WHEN the Schedules page loads THEN the system SHALL fetch both rent schedules and payments in parallel, populating both the `schedules` and `payments` state, so that `getDisplayStatus` and `totals` calculations use real payment data.

2.5 WHEN data is loaded THEN the status summary cards (Paid, Overdue, Partial, Scheduled) SHALL display counts and outstanding totals that accurately reflect the join between schedules and their associated payment allocations.

**Finances / Tenant**

2.6 WHEN a user types in the tenant search box THEN the system SHALL call a backend search endpoint (e.g., `GET /api/leases?search=<query>` or `GET /api/users?role=tenant&search=<query>`) and display results from the database, not only from the in-memory list.

2.7 WHEN search results are returned from the backend THEN the system SHALL display the matching tenant name and property, allowing the user to select a tenant and load their financials.

**Finances / Automation**

2.8 WHEN a user clicks "Run Now" for "Generate Schedules" THEN the system SHALL POST to a dedicated cron endpoint (e.g., `POST /api/cron/schedules`) that triggers `generateMonthlySchedules()`, and SHALL receive a success response that updates the Last Run column.

2.9 WHEN a cron "Run Now" action succeeds THEN the system SHALL display the time of the last run in the corresponding row, sourced from the `CronLog` records returned by the SSE stream or a status-refresh fetch.

2.10 WHEN a user clicks "Refresh Status" THEN the system SHALL fetch the latest cron log entries from the backend (e.g., `GET /api/cron/logs`) and update the Last Run column for each cron type.

**Finances / Reports**

2.11 WHEN the Reports summary cards render THEN the system SHALL source Revenue, Arrears, Expenses, and Net P&L from a single consistent dataset so that all four cards are coherent; Expenses SHALL be the sum from the live expenses list filtered to the selected month/property, and Net P&L SHALL equal Revenue minus that same Expenses figure.

2.12 WHEN the bar graph renders THEN the system SHALL display both Revenue and Expenses bars with non-zero heights for each month where data exists, by adding `month`-range filtering support to `GET /api/expenses` (via `startDate`/`endDate` or a `month` parameter) or by filtering the full expenses list on the backend before returning it.

2.13 WHEN a user clicks "KRA Report" THEN the system SHALL download the CSV through the authenticated axios instance (or a backend route that sets the correct `Content-Disposition` header and is called with the auth token), not by opening an unauthenticated browser URL.

2.14 WHEN a user changes the Property or Month filter THEN the system SHALL re-fetch expenses from the backend filtered by the selected property and month range, and the Expenses breakdown section SHALL update to show only expenses matching the current filter selection.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Schedules page search input is used THEN the system SHALL CONTINUE TO filter the visible rows in the table using the existing client-side logic against the loaded dataset.

3.2 WHEN a user clicks a status summary card on the Schedules page THEN the system SHALL CONTINUE TO toggle the active status filter and re-filter the table accordingly.

3.3 WHEN a cron "Run Now" action is triggered THEN the system SHALL CONTINUE TO call `fetchData()` after the action completes to refresh schedule and payment state.

3.4 WHEN the "Send Reminders" button on the Automation page is clicked THEN the system SHALL CONTINUE TO POST to `/api/cron/reminders/manual` and display the result in the run log.

3.5 WHEN the Reports page exports via the "KRA Report" button THEN the system SHALL CONTINUE TO include `propertyId` and `month` query parameters in the download request.

3.6 WHEN a user selects a tenant on the Tenant page THEN the system SHALL CONTINUE TO load that tenant's schedules, payments, and ledger and render the Statement of Account table.

3.7 WHEN the Tenant page generates a PDF statement THEN the system SHALL CONTINUE TO use the existing `generateStatementPDF` function with the selected lease and financials data.

3.8 WHEN the Overview page loads payments and schedules via `getPayments()` and `getRentSchedules()` THEN the system SHALL CONTINUE TO use those results to populate the Recent Transactions list and the Method Breakdown section.

3.9 WHEN a user changes the Property or Month filter on the Reports page THEN the system SHALL CONTINUE TO trigger `fetchSummary`, `fetchPayments`, `fetchMom`, `fetchExpenses`, and `fetchArrears` for the new filter values.

3.10 WHEN the `GET /api/expenses` endpoint is updated to support month filtering THEN the system SHALL CONTINUE TO return all landlord-scoped expenses unfiltered when no month parameter is provided.
