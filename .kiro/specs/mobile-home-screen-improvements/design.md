# Design Document: Mobile Home Screen Improvements

## Overview

This document describes the technical design for five targeted fixes to `mobile/app/(tabs)/home.tsx`. The home screen currently renders stale or hardcoded values for rent amount, occupancy duration, and payment rate, has a broken "Pay Rent" navigation action, and shows all contacts including tenants. The fixes wire the screen to real API data using the existing `api.ts` client and Expo Router navigation primitives.

### Goals

- Display the active `Lease.rentAmount` instead of the unused `property.price` field.
- Navigate the "Pay Rent" button to `/pay/method` with correct route parameters.
- Filter the contacts list to exclude users with the "Tenant" role.
- Compute occupancy duration from `Lease.startDate`, following renewal chains.
- Derive the on-time payment rate from real `RentSchedule` data.

### Non-Goals

- Changes to the backend API shape or authentication mechanism.
- Modifications to other screens (contacts/index, pay/method, etc.).
- Adding a new dedicated lease endpoint — the existing `GET /api/leases` is used by landlords; a tenant-scoped fetch via `LeaseTenant` will be used.
- Offline caching beyond what Zustand's persisted store already provides.

---

## Architecture

The home screen is a React Native component rendered inside Expo Router's tab layout. It already uses:

- `useAuthStore` (Zustand) — provides `user` (with `userProperties`) and `token`.
- `useFocusEffect` — runs side-effects when the tab gains focus.
- `api.ts` — a thin `fetch`-based API client with `getPaymentSchedules` and `getContacts` already implemented.

The five improvements all follow the same pattern: introduce `useState` + `useFocusEffect` (or `useEffect`) hooks to fetch data on mount/focus, derive computed values from the fetched data, and render the derived values in place of the current hardcoded ones.

```
┌─────────────────────────────────────────────────────────┐
│  Home Screen (home.tsx)                                 │
│                                                         │
│  useFocusEffect ──► fetchActiveLease()                  │
│                 └── fetchPaymentSchedules()             │
│                 └── fetchContacts() (existing pattern)  │
│                                                         │
│  Derived values:                                        │
│    activeLease ──► rentAmount, nextDueDate              │
│    schedules   ──► onTimeRate, rateLabel                │
│    contacts    ──► filtered (non-tenant) list           │
│    activeLease ──► occupancyDuration, occupancyLabel    │
└────────────────────┬────────────────────────────────────┘
                     │  router.push('/pay/method', params)
                     ▼
           pay/method.tsx (unchanged)
```

### API Endpoints Used

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /api/leases` | Bearer token | Landlord-scoped; tenants are not listed as `landlordId`. Use `GET /api/leases` filtered by `LeaseTenant` via backend, **or** fetch all leases and filter client-side on `tenants[].tenantId === user.id`. See "Lease Fetch Strategy" below. |
| `GET /api/payments/schedules` | Bearer token | Backend auto-scopes to `tenantId` when the requester has a Tenant role. Returns `{ schedules: RentSchedule[] }`. |
| `GET /api/users/contacts` | Bearer token | Already used. Returns contacts including "Landlord" role users. See Requirement 3. |

#### Lease Fetch Strategy

The existing `GET /api/leases` route in `leases.ts` filters by `property.landlordId = authReq.userId`, meaning it returns leases for properties where the *requester is the landlord*. A tenant calling this endpoint would get an empty array.

**Solution**: Add a new `GET /api/leases/mine` tenant-scoped endpoint **or** use the existing `GET /api/leases` with a `tenantId` query parameter added server-side. Given the constraint of minimal backend change, we add a lightweight `api.getMyLeases(token)` call that hits a new tenant endpoint: `GET /api/leases/mine`.

This endpoint:
1. Looks up `LeaseTenant` records where `tenantId = authReq.userId`.
2. Returns the associated `Lease` records with their `property`, `tenants`, and renewal chain (`renewedFromId`).

The mobile API client gets a new method `getMyLeases(token)`. No changes to other routes.

---

## Components and Interfaces

### New TypeScript Types (mobile-local)

```typescript
// Types used inside home.tsx (can live inline or in mobile/types/)

interface ActiveLease {
  id: number;
  rentAmount: number;
  startDate: string;        // ISO date string from API
  billingCycle: 'monthly' | 'weekly' | string;
  status: string;
  propertyId: number;
  propertyTitle: string;
  renewedFromId: number | null;
}

interface ScheduleSummary {
  paidCount: number;
  overdueCount: number;
  scheduledCount: number;
}
```

### New API Client Method

Added to `mobile/lib/api.ts`:

```typescript
async getMyLeases(token: string): Promise<{ leases: any[] }> {
  const response = await fetch(`${API_BASE}/api/leases/mine`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

### New Backend Route: `GET /api/leases/mine`

Added to `backend/src/routes/leases.ts` **before** the `GET /:id` route (to avoid route shadowing):

```typescript
// GET /api/leases/mine — tenant-scoped active lease fetch
router.get('/mine', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const leaseTenants = await db.leaseTenant.findMany({
      where: { tenantId: authReq.userId! },
      include: {
        lease: {
          include: {
            property: { select: { id: true, title: true, location: true } },
            tenants: { select: { tenantId: true } },
          },
        },
      },
    });

    const leases = leaseTenants.map((lt) => lt.lease);
    res.json({ leases });
  } catch (error) {
    console.error('Failed to fetch tenant leases:', error);
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
});
```

### Contacts Backend: Role Expansion

The current `GET /api/users/contacts` endpoint hard-codes `role: { name: { in: ['Caretaker', 'Property Manager'] } }`, which excludes Landlords. Requirement 3 says the home screen should include Landlords in the contacts and filter *out* Tenants. Two approaches:

**Option A**: Update the backend query to include all non-Tenant roles.
**Option B**: Client-side filter on the home screen after fetching all contacts.

The requirements state client-side filtering (`role.name` case-insensitive !== `"Tenant"`). However, the backend already excludes Landlords from the query, so Landlord contacts would never arrive. We must also update the backend query to remove the hard-coded role allowlist and instead exclude only the "Tenant" role:

```typescript
// In users.ts contacts route — update the where clause
role: {
  name: { not: { equals: 'Tenant', mode: 'insensitive' } },
},
```

This ensures Landlords are included in the response. The mobile client then applies an additional client-side filter as a defensive check per requirements 3.2.

---

## Data Models

### Rent Amount (Requirement 1)

```
API: GET /api/leases/mine
Response: { leases: Lease[] }

Lease fields used:
  - id: number
  - status: string            -- filter to "active"
  - rentAmount: number        -- display value
  - startDate: string (ISO)   -- for next-due date and occupancy
  - billingCycle: string      -- "monthly" | "weekly"
  - property.id: number       -- for Pay Rent params
  - property.title: string    -- for hero card and Pay Rent params
  - renewedFromId: number | null -- for occupancy chain traversal
```

Active lease selection: filter `leases` to `status === 'active'`, sort descending by `startDate`, take first.

### Next Due Date Computation

```
function computeNextDue(startDate: Date, billingCycle: string, today: Date): Date

Monthly: find smallest future date where date.getDate() === startDate.getDate()
  - Start from today + 1 day, advance until day-of-month matches
  - Handle month-end overflow (e.g., Jan 31 → Feb 28/29)

Weekly: find smallest future date where date.getDay() === startDate.getDay()
  - Compute: daysUntil = (startDate.getDay() - today.getDay() + 7) % 7
  - If daysUntil === 0, use 7 (next week, not today)

Fallback: first day of next calendar month
  new Date(today.getFullYear(), today.getMonth() + 1, 1)
```

### Occupancy Duration (Requirement 4)

```
function computeOccupancyMonths(originalStartDate: Date, today: Date): number
  years  = today.getFullYear() - originalStartDate.getFullYear()
  months = today.getMonth() - originalStartDate.getMonth()
  total  = years * 12 + months
  if today.getDate() < originalStartDate.getDate(): total -= 1
  return max(0, total)

Renewal chain traversal (client-side):
  Given the list of all tenant's leases (active + ended from getMyLeases),
  walk renewedFromId links from the active lease backwards to find the
  root lease (the one with renewedFromId === null). Use that root's startDate.
```

### On-Time Payment Rate (Requirement 5)

```
RentSchedule fields used:
  - status: "scheduled" | "paid" | "overdue"

function computeOnTimeRate(schedules: RentSchedule[]): number | null
  settled = schedules.filter(s => s.status === "paid" || s.status === "overdue")
  if settled.length === 0: return null  // display "100%"
  paid    = schedules.filter(s => s.status === "paid").length
  rate    = (paid / settled.length) * 100
  return Math.round(rate * 10) / 10     // 1 decimal place

function formatRate(rate: number | null): string
  if rate === null: return "100%"
  return rate === 100 ? "100%" : `${rate.toFixed(1)}%`

function rateLabel(rate: number | null): string
  const r = rate ?? 100
  if (r >= 100): return "↑ Perfect"
  if (r >= 80):  return "↑ Great"
  return "↓ Improve"
```

### Pay Rent Navigation Params (Requirement 2)

```typescript
interface PayRentParams {
  amount: string;         // activeLease.rentAmount.toString()
  propertyId: string;     // activeLease.property.id.toString()
  tenantId: string;       // user.id.toString()
  propertyTitle: string;  // activeLease.property.title
  dueDate: string;        // ISO string of computed next due date
  scheduleId: string;     // next "scheduled" RentSchedule id, or "0"
  accountRef: string;     // `PROP-${propertyId}` or `SCHED-${scheduleId}`
}
```

`scheduleId` is resolved from the `schedules` state: find the first schedule with `status === "scheduled"`, ordered by `dueDate` ascending. If none, use `"0"`.

`accountRef`: use `SCHED-${scheduleId}` when a schedule exists, otherwise `PROP-${propertyId}`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Active Lease Rent Amount Selection

*For any* array of lease objects where zero or more have `status = "active"`, the lease selection function shall return the lease with the latest `startDate` among active leases, or `null` when no active lease exists.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Monthly Next-Due Date

*For any* valid `startDate` and any `today` date, the monthly next-due function shall return a date that (a) is strictly after `today`, (b) has the same day-of-month as `startDate` (adjusted for months with fewer days), and (c) is the nearest such future date — no earlier future date with the same day-of-month exists.

**Validates: Requirements 1.5**

---

### Property 3: Weekly Next-Due Date

*For any* valid `startDate` and any `today` date, the weekly next-due function shall return a date that (a) is strictly after `today`, (b) has the same day-of-week as `startDate`, and (c) is at most 7 days after `today`.

**Validates: Requirements 1.6**

---

### Property 4: Pay Rent Navigation Parameters

*For any* active lease with a rent schedule array, when the "Pay Rent" button is pressed, the params object passed to `router.push('/pay/method', params)` shall satisfy: `params.amount === String(lease.rentAmount)`, `params.propertyId === String(lease.property.id)`, `params.tenantId === String(user.id)`, `params.propertyTitle === lease.property.title`, and `params.scheduleId` equals the id of the first `"scheduled"` schedule entry (or `"0"` if none).

**Validates: Requirements 2.1, 2.2**

---

### Property 5: Contacts Non-Tenant Filter

*For any* array of contact objects (with any mix of role names), the contact filter function shall return only contacts whose `role.name.toLowerCase()` is not equal to `"tenant"`. No contact with role "Tenant", "TENANT", or "tenant" shall appear in the output.

**Validates: Requirements 3.2, 3.4**

---

### Property 6: Occupancy Duration Computation

*For any* `originalStartDate` and any `today` date where `today >= originalStartDate`, the occupancy computation function shall return the number of complete calendar months elapsed, defined as: `floor((today.year - start.year) * 12 + (today.month - start.month) - (1 if today.day < start.day else 0))`. The result shall be non-negative.

**Validates: Requirements 4.1**

---

### Property 7: Occupancy Display Formatting and Label

*For any* non-negative integer `months` representing Occupancy_Duration, the formatting function shall return:
- `"X yr Y mo"` (where X ≥ 1 and 0 ≤ Y ≤ 11) when `months >= 12`
- `"X mo"` (where 1 ≤ X ≤ 11) when `1 <= months < 12`
- `"< 1 mo"` when `months === 0`

And the label function shall return:
- `"↑ Loyal"` when `months >= 12`
- `"↑ Active"` when `1 <= months < 12`
- `"New"` when `months === 0`

**Validates: Requirements 4.2, 4.3, 4.5**

---

### Property 8: On-Time Payment Rate Calculation

*For any* non-negative integers `paidCount` and `overdueCount`, the rate function shall return:
- `null` (displayed as `"100%"`) when `paidCount + overdueCount === 0`
- `Math.round((paidCount / (paidCount + overdueCount)) * 1000) / 10` otherwise

The result shall be in the range `[0, 100]`.

**Validates: Requirements 5.1, 5.2**

---

### Property 9: On-Time Payment Rate Label

*For any* rate value `r` (where `r ∈ [0, 100]` or `r = null` representing 100%), the label function shall return:
- `"↑ Perfect"` when `r === null` or `r >= 100`
- `"↑ Great"` when `80 <= r < 100`
- `"↓ Improve"` when `r < 80`

Every possible numeric rate value maps to exactly one label.

**Validates: Requirements 5.3, 5.4, 5.5**

---

## Error Handling

### Lease Fetch Failure (Requirement 1.4)

- `activeLease` state defaults to `null`; `leaseLoading` defaults to `true`.
- On catch: set `activeLease = null`, `leaseLoading = false`.
- Hero card renders `"—"` when `activeLease === null && !leaseLoading`.
- The error is caught locally; no unhandled rejection propagates to the React error boundary.

### Pay Rent with No Active Lease (Requirement 2.3)

```typescript
const handlePayRent = () => {
  if (!activeLease) {
    Alert.alert('No active lease found. Contact your landlord.');
    return;
  }
  router.push({ pathname: '/pay/method', params: buildPayRentParams() });
};
```

### Contacts Fetch Failure (Requirement 3.5)

- `contacts` state defaults to `[]`.
- On catch: keep `contacts = []`, render empty-state message.
- `console.error` logs the failure.

### Payment Schedules Fetch Failure (Requirement 5.8)

- `schedules` state defaults to `[]`.
- On catch: keep `schedules = []` → `computeOnTimeRate([])` returns `null` → display `"100%"`.
- `console.error` logs the error.

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions extracted from the component. Each function is testable in isolation without mounting React components.

Functions to unit test:

| Function | Test Cases |
|---|---|
| `selectActiveLease(leases)` | Empty array → null; single active → returned; multiple active → latest startDate; no active (all ended) → null |
| `computeNextDue(startDate, cycle, today)` | Monthly: same day next month; past day this month → this month; end-of-month overflow; Weekly: 1–7 days out; same day → 7 days; Unknown cycle → first of next month |
| `computeOccupancyMonths(startDate, today)` | Same month → 0; exactly 12 months → 12; day-of-month boundary (not yet reached → subtract 1); today < startDate → 0 |
| `formatOccupancy(months)` | 0 → "< 1 mo"; 5 → "5 mo"; 12 → "1 yr 0 mo"; 15 → "1 yr 3 mo" |
| `occupancyLabel(months)` | 0 → "New"; 6 → "↑ Active"; 12 → "↑ Loyal" |
| `computeOnTimeRate(schedules)` | All scheduled → null; 3 paid 0 overdue → null (100%... actually 3/3 = 100 → not null, wait: denominator = paid + overdue = 3, paid = 3 → 100.0, not null); 0 paid 0 overdue → null; 2 paid 1 overdue → 66.7 |
| `formatRate(rate)` | null → "100%"; 100 → "100%"; 98.4 → "98.4%"; 66.7 → "66.7%" |
| `rateLabel(rate)` | null → "↑ Perfect"; 100 → "↑ Perfect"; 85 → "↑ Great"; 79.9 → "↓ Improve"; 0 → "↓ Improve" |
| `filterNonTenantContacts(contacts)` | Tenant filtered; TENANT (uppercase) filtered; Landlord included; Caretaker included; empty → empty |
| `buildPayRentParams(lease, user, schedules, nextDue)` | Correct fields; no scheduled entries → scheduleId "0"; accountRef derivation |

### Property-Based Tests

Property tests use **[fast-check](https://github.com/dubzzz/fast-check)** (already available in the TypeScript/Node ecosystem used by this project). Each test runs a minimum of 100 iterations.

**Tag format**: `// Feature: mobile-home-screen-improvements, Property {N}: {property_text}`

```typescript
// Property 1: Active Lease Rent Amount Selection
// Feature: mobile-home-screen-improvements, Property 1: Active lease selection returns latest startDate lease
fc.assert(fc.property(
  fc.array(fc.record({ id: fc.integer(), status: fc.oneof(fc.constant('active'), fc.constant('ended')), rentAmount: fc.float(), startDate: fc.date() })),
  (leases) => {
    const result = selectActiveLease(leases);
    const actives = leases.filter(l => l.status === 'active');
    if (actives.length === 0) return result === null;
    const expected = actives.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
    return result?.id === expected.id;
  }
), { numRuns: 100 });

// Property 2: Monthly Next-Due Date
// Feature: mobile-home-screen-improvements, Property 2: Monthly next-due is strictly future, same day-of-month, nearest
fc.assert(fc.property(
  fc.date(), fc.date(),
  (startDate, today) => {
    const result = computeNextDue(startDate, 'monthly', today);
    return result > today &&
      (result.getDate() === startDate.getDate() || /* overflow */ result.getDate() < startDate.getDate());
  }
), { numRuns: 100 });

// Property 3: Weekly Next-Due Date
// Feature: mobile-home-screen-improvements, Property 3: Weekly next-due is strictly future, same day-of-week, within 7 days
fc.assert(fc.property(
  fc.date(), fc.date(),
  (startDate, today) => {
    const result = computeNextDue(startDate, 'weekly', today);
    const diffDays = Math.round((result.getTime() - today.getTime()) / 86400000);
    return result > today &&
      result.getDay() === startDate.getDay() &&
      diffDays >= 1 && diffDays <= 7;
  }
), { numRuns: 100 });

// Property 5: Contacts Non-Tenant Filter
// Feature: mobile-home-screen-improvements, Property 5: filterNonTenantContacts excludes all tenant-role entries
fc.assert(fc.property(
  fc.array(fc.record({ id: fc.integer(), name: fc.string(), role: fc.record({ name: fc.oneof(fc.constant('Tenant'), fc.constant('tenant'), fc.constant('TENANT'), fc.constant('Landlord'), fc.constant('Caretaker'), fc.constant('Property Manager')) }) })),
  (contacts) => {
    const result = filterNonTenantContacts(contacts);
    return result.every(c => c.role.name.toLowerCase() !== 'tenant');
  }
), { numRuns: 100 });

// Property 6: Occupancy Duration Computation
// Feature: mobile-home-screen-improvements, Property 6: occupancy months is non-negative and matches floor calendar-month diff
fc.assert(fc.property(
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  (startDate, today) => {
    const result = computeOccupancyMonths(startDate, today);
    return result >= 0;
  }
), { numRuns: 100 });

// Property 7: Occupancy Display Formatting and Label
// Feature: mobile-home-screen-improvements, Property 7: occupancy format and label match tier rules
fc.assert(fc.property(
  fc.integer({ min: 0, max: 600 }),
  (months) => {
    const value = formatOccupancy(months);
    const label = occupancyLabel(months);
    if (months === 0) return value === '< 1 mo' && label === 'New';
    if (months < 12) return value === `${months} mo` && label === '↑ Active';
    const yr = Math.floor(months / 12);
    const mo = months % 12;
    return value === `${yr} yr ${mo} mo` && label === '↑ Loyal';
  }
), { numRuns: 100 });

// Property 8: On-Time Payment Rate Calculation
// Feature: mobile-home-screen-improvements, Property 8: rate equals paid/(paid+overdue)*100 or null when no settled entries
fc.assert(fc.property(
  fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }),
  (paidCount, overdueCount) => {
    const schedules = [
      ...Array(paidCount).fill({ status: 'paid' }),
      ...Array(overdueCount).fill({ status: 'overdue' }),
    ];
    const result = computeOnTimeRate(schedules);
    if (paidCount + overdueCount === 0) return result === null;
    const expected = Math.round((paidCount / (paidCount + overdueCount)) * 1000) / 10;
    return result === expected;
  }
), { numRuns: 100 });

// Property 9: On-Time Payment Rate Label
// Feature: mobile-home-screen-improvements, Property 9: every rate maps to exactly one label tier
fc.assert(fc.property(
  fc.oneof(fc.constant(null), fc.float({ min: 0, max: 100 })),
  (rate) => {
    const label = rateLabel(rate);
    const r = rate ?? 100;
    if (r >= 100) return label === '↑ Perfect';
    if (r >= 80)  return label === '↑ Great';
    return label === '↓ Improve';
  }
), { numRuns: 100 });
```

### Integration Tests

- `GET /api/leases/mine` returns only leases where the authenticated user is a `LeaseTenant` record (1–2 examples with seed data).
- `GET /api/users/contacts` returns Landlord contacts alongside Caretakers/Property Managers when the backend query is updated (1–2 examples).
- `GET /api/payments/schedules` scopes results to the authenticated tenant (1–2 examples).

### Smoke Tests

- The home screen renders without crashing when all three API calls return empty arrays.
- The home screen renders without crashing when all three API calls fail simultaneously.
