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

1. WHEN the Home_Screen mounts and the tenant has an active Lease, THE Home_Screen SHALL fetch the tenant's active Lease from the API and display `Lease.rentAmount` as the "CURRENT MONTHLY RENT" value.
2. WHEN the API returns no active Lease for the tenant, THE Home_Screen SHALL display `"—"` in place of the rent amount and omit the hero card subtitle.
3. WHEN the Lease fetch is in progress, THE Home_Screen SHALL display a loading placeholder in the hero card instead of a numeric value.
4. IF the Lease fetch fails due to a network or server error, THEN THE Home_Screen SHALL display `"—"` as the rent amount, SHALL clear any previously cached rent data, and SHALL NOT crash or show an unhandled error specifically due to the failed lease fetch.
5. THE Home_Screen SHALL derive the "NEXT DUE" date from the active Lease's billing cycle rather than always computing the first day of next month from the current date.

---

### Requirement 2: Pay Rent Button Navigates to Payment Screen

**User Story:** As a tenant, I want the "Pay Rent" quick-action button on the home screen to take me directly to the payment method selection screen, so that I can pay my rent without extra steps.

#### Acceptance Criteria

1. WHEN a tenant presses the "Pay Rent" quick-action button, THE Home_Screen SHALL navigate to the Payment_Method_Screen.
2. WHEN navigating to the Payment_Method_Screen, THE Home_Screen SHALL pass the following route params: `amount` (from the active Lease's `rentAmount`), `propertyId` (from the tenant's first `UserProperty`), `tenantId` (the authenticated user's `id`), `propertyTitle` (from the associated property), `dueDate` (the next scheduled due date), `scheduleId` (the id of the next pending Rent_Schedule, or `0` if none), and `accountRef` (a reference string derived from the schedule or property).
3. IF no active Lease exists for the tenant, THEN THE Home_Screen SHALL display an alert stating `"No active lease found. Contact your landlord."` and SHALL NOT navigate to the Payment_Method_Screen.
4. WHILE a Lease fetch is in progress, THE Home_Screen SHALL disable the "Pay Rent" button continuously and SHALL NOT navigate to the Payment_Method_Screen until the fetch completes.

---

### Requirement 3: Contacts Section Shows Only Non-Tenant Users

**User Story:** As a tenant, I want the contacts listed on the home screen to only show landlords, property managers, and caretakers, so that I can quickly reach the right people without seeing other tenants.

#### Acceptance Criteria

1. THE Home_Screen SHALL fetch contacts from the `GET /api/users/contacts` endpoint, which already filters to Non_Tenant_Contact roles (Caretaker, Property Manager) for the current user's properties.
2. WHEN the contacts list is rendered on the Home_Screen, THE Home_Screen SHALL only display users whose `role.name` is NOT `"Tenant"` (case-insensitive).
3. WHEN the contacts list is empty after filtering, THE Home_Screen SHALL display a message `"No contacts available"` in the contacts section.
4. WHERE a landlord contact exists for the tenant's property, THE Home_Screen SHALL include the landlord in the contacts display alongside caretakers and property managers.

---

### Requirement 4: Occupancy Card Reflects Real Tenancy Duration

**User Story:** As a tenant, I want the Occupancy stat card to show how long I have actually been living at the property, so that I can see an accurate record of my tenancy.

#### Acceptance Criteria

1. WHEN the Home_Screen displays the Occupancy stat card and the tenant has an active Lease, THE Home_Screen SHALL calculate Occupancy_Duration as the number of complete months between `Lease.startDate` and the current date.
2. THE Home_Screen SHALL display Occupancy_Duration in a human-readable format: years and months where applicable (e.g., `"1 yr 3 mo"`) or months only for durations under one year (e.g., `"8 mo"`).
3. WHEN Occupancy_Duration is less than one month, THE Home_Screen SHALL display `"< 1 mo"` as the occupancy value.
4. IF no active Lease is found, THEN THE Home_Screen SHALL display `"—"` as the occupancy value.
5. THE Home_Screen SHALL derive the occupancy change label dynamically: `"↑ Loyal"` for durations of exactly 12 months or more, `"↑ Active"` for durations of 1 month or more but under 12 months, and `"New"` for durations under 1 month.

---

### Requirement 5: On-Time Payment Rate Calculated from Real Payment History

**User Story:** As a tenant, I want the On-Time Payment Rate stat to start at 100% when I have no payment history and accurately reflect my payment record over time, so that I have a meaningful metric of my reliability.

#### Acceptance Criteria

1. WHEN the Home_Screen fetches payment schedules and the tenant has no Rent_Schedule entries with a status other than `"scheduled"`, THE Home_Screen SHALL display `"100%"` as the On-Time Payment Rate.
2. WHEN the Home_Screen has Rent_Schedule data, THE Home_Screen SHALL calculate On_Time_Rate as `(count of schedules with status "paid") / (count of schedules with status "paid" OR status "overdue") * 100`, rounded to one decimal place.
3. WHEN On_Time_Rate is 100%, THE Home_Screen SHALL display the change label as `"↑ Perfect"`.
4. WHEN On_Time_Rate is 80% or above but below 100%, THE Home_Screen SHALL display the change label as `"↑ Great"`.
5. WHEN On_Time_Rate is below 80%, THE Home_Screen SHALL display the change label as `"↓ Improve"`.
6. THE Home_Screen SHALL fetch payment schedules from `GET /api/payments/schedules` using the authenticated token and SHALL scope the fetch to the current tenant's records only.
7. IF the payment schedules fetch fails, THEN THE Home_Screen SHALL display `"100%"` as a safe default for the On-Time Payment Rate AND SHALL log the error to the console; both actions are required together and neither SHALL be performed without the other.
