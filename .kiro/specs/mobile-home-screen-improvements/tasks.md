# Implementation Plan: Mobile Home Screen Improvements

## Overview

Five targeted fixes to `mobile/app/(tabs)/home.tsx` and the supporting backend/API layers.
Pure utility functions are extracted first for testability, then wired into the screen component.
Backend endpoints are updated to support tenant-scoped lease fetching and non-tenant contact queries.

---

## Tasks

- [x] 1. Extract pure utility functions into a testable module
  - Create `mobile/lib/homeUtils.ts` with the following exported functions:
    - `selectActiveLease(leases: any[]): any | null` — returns the active lease with the latest `startDate`, or `null`
    - `computeNextDue(startDate: Date, billingCycle: string, today: Date): Date` — monthly, weekly, and fallback logic
    - `computeOccupancyMonths(originalStartDate: Date, today: Date): number` — complete calendar months, non-negative
    - `formatOccupancy(months: number): string` — formats as `"< 1 mo"`, `"X mo"`, or `"X yr Y mo"`
    - `occupancyLabel(months: number): string` — returns `"New"`, `"↑ Active"`, or `"↑ Loyal"`
    - `computeOnTimeRate(schedules: { status: string }[]): number | null` — `null` when no settled entries, else rounded rate
    - `formatRate(rate: number | null): string` — `"100%"` for `null`, `rate.toFixed(1)%` otherwise
    - `rateLabel(rate: number | null): string` — `"↑ Perfect"`, `"↑ Great"`, or `"↓ Improve"`
    - `filterNonTenantContacts(contacts: any[]): any[]` — case-insensitive exclude of `"Tenant"` role
    - `buildPayRentParams(lease: any, userId: number, schedules: any[], nextDue: Date): Record<string, string>` — assembles all `/pay/method` params
    - `findRootLease(leases: any[], activeLease: any): any` — walks `renewedFromId` chain to find root lease
  - _Requirements: 1.1, 1.2, 1.5, 1.6, 2.2, 3.2, 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Property-based and unit tests for utility functions
  - [ ]* 2.1 Write property test for `selectActiveLease` (Property 1)
    - **Property 1: Active Lease Rent Amount Selection**
    - **Validates: Requirements 1.1, 1.2**
    - Install `fast-check` as a dev dependency in `mobile/` if not already present
    - Create `mobile/lib/__tests__/homeUtils.test.ts`
    - Test: for any array of leases with any mix of `"active"` / `"ended"` statuses, `selectActiveLease` returns the active lease with the latest `startDate`, or `null` if none active
  - [ ]* 2.2 Write property test for monthly `computeNextDue` (Property 2)
    - **Property 2: Monthly Next-Due Date**
    - **Validates: Requirements 1.5**
    - Test: result is strictly after `today`, same day-of-month as `startDate` (adjusted for overflow), and is the nearest such future date
  - [ ]* 2.3 Write property test for weekly `computeNextDue` (Property 3)
    - **Property 3: Weekly Next-Due Date**
    - **Validates: Requirements 1.6**
    - Test: result is strictly after `today`, same day-of-week as `startDate`, and is 1–7 days after `today`
  - [ ]* 2.4 Write property test for `filterNonTenantContacts` (Property 5)
    - **Property 5: Contacts Non-Tenant Filter**
    - **Validates: Requirements 3.2, 3.4**
    - Test: for any array of contacts, no output contact has `role.name.toLowerCase() === "tenant"`
  - [ ]* 2.5 Write property test for `computeOccupancyMonths` (Property 6)
    - **Property 6: Occupancy Duration Computation**
    - **Validates: Requirements 4.1**
    - Test: result is always non-negative for any `today >= startDate`; result is 0 when `today < startDate`
  - [ ]* 2.6 Write property test for `formatOccupancy` and `occupancyLabel` (Property 7)
    - **Property 7: Occupancy Display Formatting and Label**
    - **Validates: Requirements 4.2, 4.3, 4.5**
    - Test: for any `months >= 0`, format and label match the three tier rules exactly
  - [ ]* 2.7 Write property test for `computeOnTimeRate` (Property 8)
    - **Property 8: On-Time Payment Rate Calculation**
    - **Validates: Requirements 5.1, 5.2**
    - Test: for any non-negative `paidCount` and `overdueCount`, result is `null` when both are 0, otherwise equals `Math.round((paidCount / (paidCount + overdueCount)) * 1000) / 10`
  - [ ]* 2.8 Write property test for `rateLabel` (Property 9)
    - **Property 9: On-Time Payment Rate Label**
    - **Validates: Requirements 5.3, 5.4, 5.5**
    - Test: every `rate` value (including `null`) maps to exactly one label tier; all three tiers are reachable
  - [ ]* 2.9 Write property test for `buildPayRentParams` (Property 4)
    - **Property 4: Pay Rent Navigation Parameters**
    - **Validates: Requirements 2.1, 2.2**
    - Test: for any active lease and schedule array, params fields match expected derivation rules, and `scheduleId` is `"0"` when no `"scheduled"` entry exists

- [x] 3. Checkpoint — run all utility tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add `GET /api/leases/mine` tenant-scoped backend endpoint
  - In `backend/src/routes/leases.ts`, add the route **before** `GET /:id` to avoid route shadowing:
    ```typescript
    router.get('/mine', requireAuth, async (req, res) => { ... });
    ```
  - Query `db.leaseTenant.findMany` where `tenantId = authReq.userId`
  - Include nested `lease.property` (id, title, location), `lease.tenants` (tenantId), and `lease.renewedFromId`
  - Return `{ leases }` (array of lease objects mapped from `leaseTenants`)
  - Handle errors with `res.status(500).json({ error: 'Failed to fetch leases' })`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Update `GET /api/users/contacts` backend query to include Landlords
  - In `backend/src/routes/users.ts`, find the `GET /contacts` route
  - Replace the hard-coded `role: { name: { in: ['Caretaker', 'Property Manager'] } }` filter with:
    ```typescript
    role: { name: { not: { equals: 'Tenant', mode: 'insensitive' } } }
    ```
  - This allows Landlords to appear in the contacts response alongside Caretakers and Property Managers
  - _Requirements: 3.4_

- [x] 6. Add `getMyLeases` method to the mobile API client
  - In `mobile/lib/api.ts`, add the method to the `api` object:
    ```typescript
    async getMyLeases(token: string): Promise<{ leases: any[] }> { ... }
    ```
  - `GET ${API_BASE}/api/leases/mine` with `Authorization: Bearer ${token}` header
  - Throw on non-OK response: `throw new Error(\`HTTP ${response.status}\`)`
  - Return `response.json()`
  - _Requirements: 1.1_

- [x] 7. Checkpoint — verify backend endpoint and API client manually (or with integration test)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Wire active lease data into the home screen hero card (Requirement 1)
  - In `mobile/app/(tabs)/home.tsx`:
    - Add `activeLease` and `leaseLoading` state (initialized to `null` / `true`)
    - Add `allLeases` state to hold all tenant leases for renewal chain traversal
    - Add `schedules` state for `RentSchedule[]` (initialized to `[]`)
    - Inside `useFocusEffect`, call `api.getMyLeases(token)` — on success set `allLeases` and derive `activeLease` using `selectActiveLease`; on failure set `activeLease = null`; always set `leaseLoading = false`
    - Inside `useFocusEffect`, call `api.getPaymentSchedules(token)` — on success set `schedules`; on failure keep `schedules = []` and log error
    - Replace `currentProperty.price` in the hero card with `activeLease?.rentAmount`:
      - Show `"..."` while `leaseLoading === true`
      - Show `"—"` when `activeLease === null && !leaseLoading`
      - Show `"Ksh{activeLease.rentAmount.toLocaleString()}"` otherwise
    - Replace the hardcoded next-due calculation with `computeNextDue` from `homeUtils.ts` using `activeLease.startDate` and `activeLease.billingCycle`
    - Use `activeLease?.property?.title` and `activeLease?.property?.location` for the hero card subtitle
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 9. Wire "Pay Rent" button navigation (Requirement 2)
  - In `mobile/app/(tabs)/home.tsx`:
    - Replace the no-op `if (item.label === 'Pay Rent')` handler with a `handlePayRent` function
    - In `handlePayRent`: if `!activeLease`, show `Alert.alert('No active lease found. Contact your landlord.')` and return
    - Otherwise call `router.push({ pathname: '/pay/method', params: buildPayRentParams(activeLease, user.id, schedules, nextDue) })`
    - Disable the "Pay Rent" `Pressable` while `leaseLoading === true` (set `disabled={leaseLoading}` and reduce opacity)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Wire contacts section with non-tenant filtering (Requirement 3)
  - In `mobile/app/(tabs)/home.tsx`:
    - Add `contacts` state (initialized to `[]`) and fetch inside `useFocusEffect` using `api.getContacts(token)`
    - Apply `filterNonTenantContacts(contacts)` before rendering; keep an empty-state message when the filtered list is empty
    - Catch fetch errors: keep `contacts = []` and `console.error` the failure
    - Remove any existing hardcoded contacts array from the `stats` or rendering sections
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Wire Occupancy stat card with computed duration (Requirement 4)
  - In `mobile/app/(tabs)/home.tsx`:
    - Remove the hardcoded `"3 yrs"` / `"↑ Loyal"` values from the `stats` array
    - After `activeLease` is resolved, walk the renewal chain using `findRootLease(allLeases, activeLease)` to get the root `startDate`
    - Compute `occupancyMonths = computeOccupancyMonths(rootStartDate, new Date())`
    - Derive `occupancyValue = formatOccupancy(occupancyMonths)` and `occupancyChangeLabel = occupancyLabel(occupancyMonths)`
    - When `activeLease === null`, show `"—"` for the occupancy value
    - Render these derived values into the Occupancy stat card (replace the static entry)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Wire On-Time Payment Rate stat card with real data (Requirement 5)
  - In `mobile/app/(tabs)/home.tsx`:
    - Remove the hardcoded `"98.4%"` / `"↑ Great"` values from the `stats` array
    - After `schedules` is populated, compute `rate = computeOnTimeRate(schedules)`
    - Derive `rateValue = formatRate(rate)` and `rateChangeLabel = rateLabel(rate)`
    - Render these derived values into the On-Time Payment Rate stat card
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 13. Final checkpoint — full screen integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the screen renders without crashes when all fetches return empty arrays
  - Verify the screen renders without crashes when all fetches fail simultaneously

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- `homeUtils.ts` functions are pure and have no React Native dependencies — they can be tested with any Node-compatible test runner (Jest is the standard for Expo projects)
- `fast-check` should be installed in `mobile/` as a dev dependency: `npm install --save-dev fast-check`
- The `GET /api/leases/mine` route must be registered **before** `GET /:id` in `leases.ts` to prevent Express treating `"mine"` as an ID parameter
- `computeNextDue` with the fallback cycle (first of next month) satisfies Requirement 1.6
- Renewal chain traversal is done client-side from the `allLeases` array — no additional backend call needed
- The contacts filter on the home screen is in addition to (not a replacement for) the updated backend query; the client-side filter acts as a defensive check per Requirement 3.2

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "4", "5"] },
    { "id": 2, "tasks": ["6"] },
    { "id": 3, "tasks": ["8", "9", "10", "11", "12"] }
  ]
}
```
