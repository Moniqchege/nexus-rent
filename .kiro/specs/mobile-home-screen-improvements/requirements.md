# Requirements Document

## Introduction

The mobile home screen (`mobile/app/(tabs)/home.tsx`) currently has five data accuracy and navigation issues for tenant users. This spec covers the fixes needed to make the home screen reflect real data from the backend and behave correctly:

1. The "Current Monthly Rent" hero card shows `Ksh0` because `property.price` is always `0` on the user object — the correct value lives on the active `Lease.rentAmount`.
2. The "Pay Rent" quick-action button has no navigation wired up (it logs to console and returns).
3. The Contacts section on the home screen pulls contacts that may include tenants; only non-tenant users (landlords, property managers, caretakers) should be shown.
4. The Occupancy stat card is hardcoded as `"3 yrs"` and never reflects real data.
5. The On-Time Payment Rate stat is hardcoded as `"98.4%"` and does not start at 100% for new tenants or derive from real payment history.

---

## Glossary

- **Home_Screen**: The `mobile/app/(tabs)/home.tsx` React Native component rendered for authenticated tenants.
- **Auth_Store**: The Zustand store (`mobile/store/authStore.ts`) that holds the authenticated `user` object and `token`.
- **Lease**: A `Lease` record from the backend (`Lease` Prisma model) with fields `rentAmount`, `startDate`, `status`, and related `tenants`.
- **Rent_Schedule**: A `RentSchedule` record representing a single rent billing period with a `status` of `scheduled`, `paid`, or `overdue`.
- **Payment_Method_Screen**: The screen at `mobile/app/pay/method.tsx` that accepts `amount`, `propertyId`, `tenantId`, `scheduleId`, `propertyTitle`, `dueDate`, and `accountRef` as route params.
- **User_Property**: A `UserProperty` join record linking a `User` to a `Property` with a `Role`.
- **Non_Tenant_Contact**: A user associated with the same property whose `Role.name` is not `"Tenant"` (e.g., Landlord, Property Manager, Caretaker).
- **Occupancy_Duration**: The number of complete months elapsed from `Lease.startDate` to the current date for the tenant's active lease.
- **On_Time_Rate**: The percentage of `RentSchedule` entries for the current tenant that have `status = "paid"` and were paid on or before `dueDate`, out of all non-`scheduled` (settled or overdue) entries.
- **API**: The backend REST API served at `API_BASE` as defined in `mobile/lib/api.ts`.

---

## Requirements

### Requirement 1: Display Actual Lease Rent Amount

**User Story:** As a tenant, I want the home screen to show my actual monthly rent amount from my active lease, so that I always know the correct amount I owe.

#### Acceptance Criteria

1. WHEN the Home_Screen mounts, IF the tenant has a Lease with `status = "active"`, THEN the Home_Screen SHALL fetch the tenant's active Lease from the API and display `Lease.rentAmount` formatted as `"Ksh{amount}"` as the "CURRENT MONTHLY RENT" value. IF the tenant has more than one active Lease, the one with the most recent `startDate` SHALL be used.
2. IF the API returns no Lease with `status = "active"` for the tenant, THEN the Home_Screen SHALL display `"—"` in place of the rent amount and SHALL omit the hero card subtitle text.
3. WHILE the Lease fetch is in progress, the Home_Screen SHALL display a loading placeholder (e.g., `"..."` or an activity indicator) in the hero card rent value position instead of a numeric value.
4. IF the Lease fetch fails due to a network or server error, THEN the Home_Screen SHALL display `"—"` as the rent amount, SHALL clear any previously cached rent amount and NEXT DUE date values, and SHALL NOT crash or propagate an unhandled error to the user as a result of the failed Lease fetch.
5. WHEN the Home_Screen derives the "NEXT DUE" date and the active Lease has `billingCycle = "monthly"`, THE Home_Screen SHALL compute the next future date that falls on the same day-of-month as `Lease.startDate`. WHEN the active Lease has `billingCycle = "weekly"`, THE Home_Screen SHALL compute the next future date that falls on the same day-of-week as `Lease.startDate`.
6. WHEN the active Lease has a `billingCycle` value other than `"monthly"` or `"weekly"`, THE Home_Screen SHALL fall back to displaying the first day of the next calendar month as the "NEXT DUE" date.

---

### Requirement 2: Pay Rent Button Navigates to Payment Screen

**User Story:** As a tenant, I want the "Pay Rent" quick-action button on the home screen to take me directly to the payment method selection screen, so that I can pay my rent without extra steps.

#### Acceptance Criteria

1. WHEN a tenant presses the "Pay Rent" quick-action button, THE Home_Screen SHALL navigate to the Payment_Method_Screen at route `/pay/method`.
2. WHEN navigating to the Payment_Method_Screen, THE Home_Screen SHALL pass the following route params: `amount` (from the active Lease's `rentAmount`), `propertyId` (from the tenant's first `UserProperty`), `tenantId` (the authenticated user's `id`), `propertyTitle` (from the associated property's `title`), `dueDate` (the next scheduled due date as formatted string), `scheduleId` (the `id` of the next pending `RentSchedule` with `status = "scheduled"`, or `0` if none exists), and `accountRef` (a reference string derived from the schedule or property identifier).
3. IF no active Lease exists for the tenant at the time the button is pressed, THEN THE Home_Screen SHALL display an alert with the message `"No active lease found. Contact your landlord."` and SHALL NOT navigate to the Payment_Method_Screen.
4. WHILE a Lease fetch is in progress, THE Home_Screen SHALL keep the "Pay Rent" button in a disabled state and SHALL NOT navigate to the Payment_Method_Screen until the fetch completes successfully.

---

### Requirement 3: Contacts Section Shows Only Non-Tenant Users

**User Story:** As a tenant, I want the contacts listed on the home screen to only show landlords, property managers, and caretakers, so that I can quickly reach the right people without seeing other tenants.

#### Acceptance Criteria

1. WHEN the Home_Screen mounts and the authenticated user has a token, THE Home_Screen SHALL fetch contacts from the `GET /api/users/contacts` endpoint using the authenticated token.
2. WHEN the contacts list is rendered on the Home_Screen, THE Home_Screen SHALL only display contacts whose `role.name` does not equal `"Tenant"` using a case-insensitive string comparison.
3. IF the contacts list is empty after client-side filtering, THEN THE Home_Screen SHALL display an empty-state message in the contacts section.
4. IF a landlord user is associated with the same property as the tenant, THEN THE Home_Screen SHALL include that landlord contact in the rendered contacts list alongside caretakers and property managers.
5. IF the contacts fetch fails, THEN THE Home_Screen SHALL display an empty-state message in the contacts section and SHALL NOT crash or propagate an unhandled error.

---

### Requirement 4: Occupancy Card Reflects Real Tenancy Duration

**User Story:** As a tenant, I want the Occupancy stat card to show how long I have actually been living at the property, so that I can see an accurate record of my tenancy.

#### Acceptance Criteria

1. WHEN the Home_Screen displays the Occupancy stat card and the tenant has a Lease with `status = "active"`, THE Home_Screen SHALL calculate Occupancy_Duration as the number of complete calendar months elapsed from `Lease.startDate` to the current date, using the earliest `startDate` in the renewal chain (following `renewedFromId` links) to reflect continuous tenancy.
2. WHEN Occupancy_Duration is 12 months or more, THE Home_Screen SHALL display the duration in years and remaining months format (e.g., `"1 yr 3 mo"`). WHEN Occupancy_Duration is between 1 and 11 months inclusive, THE Home_Screen SHALL display the duration in months only (e.g., `"8 mo"`).
3. WHEN Occupancy_Duration is less than 1 complete calendar month, THE Home_Screen SHALL display `"< 1 mo"` as the occupancy value.
4. IF no Lease with `status = "active"` is found for the tenant, THEN THE Home_Screen SHALL display `"—"` as the occupancy value.
5. THE Home_Screen SHALL derive the occupancy change label as follows: `"↑ Loyal"` when Occupancy_Duration is 12 months or more; `"↑ Active"` when Occupancy_Duration is 1 month or more but less than 12 months; `"New"` when Occupancy_Duration is less than 1 month.

---

### Requirement 5: On-Time Payment Rate Calculated from Real Payment History

**User Story:** As a tenant, I want the On-Time Payment Rate stat to start at 100% when I have no payment history and accurately reflect my payment record over time, so that I have a meaningful metric of my reliability.

#### Acceptance Criteria

1. WHEN the Home_Screen fetches payment schedules and all Rent_Schedule entries for the tenant have `status = "scheduled"` (i.e., no entry has `status = "paid"` or `status = "overdue"`), THE Home_Screen SHALL display `"100%"` as the On-Time Payment Rate.
2. WHEN the Home_Screen has at least one Rent_Schedule entry with `status = "paid"` or `status = "overdue"`, THE Home_Screen SHALL calculate On_Time_Rate as `(count of entries with status "paid") / (count of entries with status "paid" OR status "overdue") * 100`, rounded to one decimal place. IF the denominator is 0, THE Home_Screen SHALL display `"100%"` as the On-Time Payment Rate.
3. IF On_Time_Rate equals 100%, THEN THE Home_Screen SHALL display the change label as `"↑ Perfect"`.
4. IF On_Time_Rate is 80% or above but below 100%, THEN THE Home_Screen SHALL display the change label as `"↑ Great"`.
5. IF On_Time_Rate is below 80%, THEN THE Home_Screen SHALL display the change label as `"↓ Improve"`.
6. WHEN the Home_Screen comes into focus and the user is authenticated, THE Home_Screen SHALL fetch payment schedule data from `GET /api/payments/schedules` using the authenticated token.
7. THE Home_Screen SHALL scope the payment schedule fetch to only the records belonging to the currently authenticated tenant.
8. IF the payment schedules fetch fails, THEN THE Home_Screen SHALL display `"100%"` as the On-Time Payment Rate and SHALL log the error details to the console.
