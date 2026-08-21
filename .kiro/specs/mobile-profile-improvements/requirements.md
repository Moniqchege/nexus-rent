# Requirements Document

## Introduction

The mobile Profile screen currently displays hardcoded tenant stats, incorrect property details sourced from the wrong data model fields, and has no navigation wired up for the "Edit Profile" and "Security & Password" settings items. This feature set makes all three data areas live using a new `GET /api/users/me/profile-stats` backend endpoint, adds a `POST /api/users/me/change-password` endpoint, implements an Edit Profile screen, and implements a Change Password screen — all within the existing Expo Router mobile app and Express/Prisma backend.

## Glossary

- **Profile_Stats_API**: The `GET /api/users/me/profile-stats` backend endpoint that returns tenancy duration, on-time payment rate, tenant score, active lease details, next due date, and floor/unit assignment for the authenticated tenant.
- **Change_Password_API**: The `POST /api/users/me/change-password` backend endpoint that verifies the current password and replaces it with a hashed new password.
- **Profile_Screen**: The mobile screen rendered by `mobile/app/(tabs)/profile.tsx`.
- **Edit_Profile_Screen**: The new Expo Router modal screen at `/(modals)/edit-profile`.
- **Change_Password_Screen**: The new Expo Router modal screen at `/(modals)/change-password`.
- **Stats_Card**: The row of three statistics (Tenancy, On-Time %, Score) displayed below the VERIFIED TENANT badge on the Profile_Screen.
- **Property_Card**: The "MY PROPERTY" card section on the Profile_Screen.
- **Active_Lease**: The most recent `Lease` record associated with the authenticated tenant via `LeaseTenant` that has `status = "active"`.
- **RentSchedule**: A `RentSchedule` database record linked to the authenticated tenant.
- **Auth_Store**: The Zustand `useAuthStore` in `mobile/store/authStore.ts` that holds the authenticated user and token.
- **API_Lib**: The `mobile/lib/api.ts` module that centralises all HTTP calls to the backend.
- **Tenant**: An authenticated mobile user with a `Tenant` role assigned via `UserProperty`.
- **UnitType**: The `UnitType` Prisma model containing `type`, `baths`, and `price` fields, linked to a `Lease` via `unitTypeId`.
- **UserProperty**: The `UserProperty` Prisma model that links a user to a property, and may contain `floor` and `unit` fields.

---

## Requirements

### Requirement 1: Profile Stats Endpoint

**User Story:** As a Tenant, I want the Profile_Screen to show my real tenancy duration, on-time payment rate, and tenant score, so that I can see accurate data about my rental history.

#### Acceptance Criteria

1. THE Profile_Stats_API SHALL require a valid JWT bearer token and return HTTP 401 when the token is absent or invalid.
2. WHEN the authenticated tenant has at least one `Lease` record, THE Profile_Stats_API SHALL derive `tenancyDuration` from the earliest `startDate` across all of the tenant's leases (both active and ended), expressed as "N yr(s)" when the duration is 12 months or more, and as "N mo" when the duration is less than 12 months.
3. IF the authenticated tenant has no lease records, THEN THE Profile_Stats_API SHALL return `tenancyDuration` as `"—"`.
4. WHEN the authenticated tenant has one or more `RentSchedule` records with `dueDate` on or before the current date, THE Profile_Stats_API SHALL compute `onTimeRate` as `(count of RentSchedule with status = "paid") / (count of RentSchedule with dueDate ≤ today) × 100`, rounded to one decimal place.
5. IF the authenticated tenant has no `RentSchedule` records with `dueDate` on or before the current date, THEN THE Profile_Stats_API SHALL return `onTimeRate` as `100.0`.
6. THE Profile_Stats_API SHALL compute `score` using the formula: `base = onTimeRate`, subtract `(overdueCount / max(totalScheduleCount, 1)) * 10` points where `overdueCount` is the count of `RentSchedule` records with `status = "overdue"` and `totalScheduleCount` is the total number of the tenant's `RentSchedule` records, floor the result, and clamp the final value to the range 0–100 inclusive.
7. WHEN the authenticated tenant has an Active_Lease, THE Profile_Stats_API SHALL include an `activeLease` object containing `id`, `rentAmount`, `startDate`, `endDate`, `status`, `billingCycle`, and a nested `unitType` object with `type`, `baths`, and `price` sourced from the lease's related `UnitType` record.
8. IF the authenticated tenant has an Active_Lease but its `unitTypeId` is null, THEN THE Profile_Stats_API SHALL return `unitType` as `null` within the `activeLease` object.
9. IF the authenticated tenant has no Active_Lease, THEN THE Profile_Stats_API SHALL return `activeLease` as `null`.
10. WHEN the authenticated tenant has one or more `RentSchedule` records with `status = "scheduled"` or `status = "overdue"`, THE Profile_Stats_API SHALL return `nextDueDate` as the ISO 8601 datetime string of the earliest such record's `dueDate`.
11. IF the authenticated tenant has no `RentSchedule` records with `status = "scheduled"` or `status = "overdue"`, THEN THE Profile_Stats_API SHALL return `nextDueDate` as `null`.
12. WHEN the authenticated tenant has a `UserProperty` record with non-null `floor` or `unit` fields, THE Profile_Stats_API SHALL include those values in the response as `floor` and `unit` string fields.
13. IF the authenticated tenant has no `UserProperty` record, or the `floor` and `unit` fields are null, THEN THE Profile_Stats_API SHALL return `floor` and `unit` as `null`.
14. THE Profile_Stats_API SHALL return all computed fields in a single JSON response object with the shape: `{ tenancyDuration, onTimeRate, score, activeLease, nextDueDate, floor, unit }`.

---

### Requirement 2: Change Password Endpoint

**User Story:** As a Tenant, I want to change my account password from within the app, so that I can maintain account security without contacting an administrator.

#### Acceptance Criteria

1. THE Change_Password_API SHALL require a valid JWT bearer token and return HTTP 401 when the token is absent or invalid.
2. WHEN the request body contains `currentPassword` and `newPassword` fields, THE Change_Password_API SHALL verify `currentPassword` against the stored `password_hash` using bcrypt comparison.
3. IF the bcrypt comparison of `currentPassword` against the stored `password_hash` does not match, THEN THE Change_Password_API SHALL return HTTP 400 with the message `"Current password is incorrect"`.
4. WHEN `currentPassword` matches the stored `password_hash`, THE Change_Password_API SHALL hash `newPassword` using bcrypt with a cost factor of 12 and update the user's `password_hash` in the database.
5. WHEN the password update succeeds, THE Change_Password_API SHALL return HTTP 200 with the body `{ "message": "Password updated" }`.
6. IF the request body is missing `currentPassword` or `newPassword`, THEN THE Change_Password_API SHALL return HTTP 400 with a descriptive validation message.

---

### Requirement 3: Mobile API Library Extensions

**User Story:** As a developer, I want the API_Lib to expose typed functions for the new endpoints and profile update, so that screens can call backend services through a consistent interface.

#### Acceptance Criteria

1. THE API_Lib SHALL export a `getTenantProfileStats(token: string)` function that performs `GET /api/users/me/profile-stats` with the bearer token and returns the parsed JSON response.
2. THE API_Lib SHALL export a `changePassword(token: string, currentPassword: string, newPassword: string)` function that performs `POST /api/users/me/change-password` with the bearer token and the JSON body `{ currentPassword, newPassword }`, and returns the parsed JSON response.
3. THE API_Lib SHALL export an `updateProfile(token: string, userId: number, data: { name?: string; phone?: string })` function that performs `PATCH /api/users/:userId` with the bearer token and returns the parsed JSON response.
4. WHEN a response from any of the three new functions has a non-2xx HTTP status, THE API_Lib SHALL throw an `Error` with a message that includes the HTTP status code and the response body text.

---

### Requirement 4: Live Stats Card

**User Story:** As a Tenant, I want the Stats_Card on my Profile_Screen to show my real tenancy duration, on-time payment rate, and tenant score, so that the displayed values reflect my actual rental history.

#### Acceptance Criteria

1. WHEN the Profile_Screen mounts, THE Profile_Screen SHALL call `getTenantProfileStats` in parallel with any other data fetches and display `"—"` placeholder values in the Stats_Card while the request is in progress.
2. WHEN `getTenantProfileStats` returns successfully, THE Profile_Screen SHALL replace the Tenancy stat with `tenancyDuration`, the On-Time stat with `onTimeRate` formatted as a percentage string (e.g., "97.5%"), and the Score stat with the integer `score`.
3. IF `getTenantProfileStats` returns an error, THEN THE Profile_Screen SHALL display `"—"` in all three Stats_Card fields and SHALL NOT crash or display an unhandled error screen.
4. WHEN the Profile_Screen regains focus after being navigated away from, THE Profile_Screen SHALL re-fetch profile stats and refresh the Stats_Card values.

---

### Requirement 5: Live Property Card

**User Story:** As a Tenant, I want the Property_Card to show accurate unit type, bathroom count, rent amount, next due date, lease status, and floor/unit assignment from live data, so that I can see correct property information at all times.

#### Acceptance Criteria

1. WHEN `getTenantProfileStats` returns an `activeLease` with a non-null `unitType`, THE Profile_Screen SHALL display `unitType.type` (e.g., "2 Bedroom") and `unitType.baths` (e.g., "2 Baths") in the Property_Card specs row, replacing any values derived from the `Property` model.
2. WHEN `getTenantProfileStats` returns an `activeLease`, THE Profile_Screen SHALL display `activeLease.rentAmount` formatted as "KshN,NNN/mo" as the rent amount in the Property_Card.
3. WHEN `getTenantProfileStats` returns a non-null `nextDueDate`, THE Profile_Screen SHALL display it formatted as "MMM D" (e.g., "Aug 19") in the Property_Card specs row.
4. IF `getTenantProfileStats` returns `nextDueDate` as `null`, THEN THE Profile_Screen SHALL display `"—"` in the next due date spec.
5. WHEN `getTenantProfileStats` returns an `activeLease`, THE Profile_Screen SHALL display the `activeLease.status` value (uppercased) in the lease status badge inside the Property_Card, replacing the hardcoded "ACTIVE LEASE" text.
6. WHEN `getTenantProfileStats` returns non-null `floor` or `unit` values, THE Profile_Screen SHALL display a floor/unit line formatted as "Floor {floor} · Unit {unit}" (or only the available field if one is null) below the property location in the Property_Card.
7. IF `getTenantProfileStats` returns null for both `floor` and `unit`, THEN THE Profile_Screen SHALL omit the floor/unit line from the Property_Card.
8. WHILE `getTenantProfileStats` is loading, THE Profile_Screen SHALL display `"—"` for rent amount, next due date, unit type, and bath count in the Property_Card.
9. IF `getTenantProfileStats` returns an error, THEN THE Profile_Screen SHALL display `"—"` for all live fields in the Property_Card and SHALL NOT crash.

---

### Requirement 6: Edit Profile Screen

**User Story:** As a Tenant, I want to update my display name and phone number from within the app, so that my profile information stays current.

#### Acceptance Criteria

1. WHEN the Tenant presses the "Edit Profile" preference item in the Profile_Screen, THE Profile_Screen SHALL navigate to the Edit_Profile_Screen via `router.push("/(modals)/edit-profile")`.
2. THE Edit_Profile_Screen SHALL display a text input pre-populated with the current `user.name` value from the Auth_Store.
3. THE Edit_Profile_Screen SHALL display a text input pre-populated with the current `user.phone` value from the Auth_Store, or an empty input if `phone` is null.
4. THE Edit_Profile_Screen SHALL display the current `user.email` as a non-editable read-only field.
5. WHEN the Tenant submits the Edit_Profile_Screen form, THE Edit_Profile_Screen SHALL call `updateProfile(token, user.id, { name, phone })` with the values entered in the name and phone inputs.
6. WHEN `updateProfile` returns successfully, THE Edit_Profile_Screen SHALL update the Auth_Store user with the returned user data and navigate back to the Profile_Screen.
7. IF `updateProfile` returns an error, THEN THE Edit_Profile_Screen SHALL display an inline error message and SHALL NOT navigate away.
8. WHILE the `updateProfile` request is in progress, THE Edit_Profile_Screen SHALL disable the submit button to prevent duplicate submissions.

---

### Requirement 7: Change Password Screen

**User Story:** As a Tenant, I want to change my account password from a dedicated screen in the app, so that I can update my credentials securely without administrative intervention.

#### Acceptance Criteria

1. WHEN the Tenant presses the "Security & Password" preference item in the Profile_Screen, THE Profile_Screen SHALL navigate to the Change_Password_Screen via `router.push("/(modals)/change-password")`.
2. THE Change_Password_Screen SHALL display three password inputs: current password, new password, and confirm new password.
3. WHEN the Tenant submits the Change_Password_Screen form and the new password input and the confirm new password input do not match, THE Change_Password_Screen SHALL display the error message `"New passwords do not match"` and SHALL NOT call the Change_Password_API.
4. WHEN the Tenant submits the Change_Password_Screen form and all three inputs are non-empty and the new password matches the confirm new password, THE Change_Password_Screen SHALL call `changePassword(token, currentPassword, newPassword)`.
5. WHEN `changePassword` returns successfully, THE Change_Password_Screen SHALL display a success message and navigate back to the Profile_Screen.
6. IF `changePassword` returns an error, THEN THE Change_Password_Screen SHALL display the error message returned by the API and SHALL NOT navigate away.
7. WHILE the `changePassword` request is in progress, THE Change_Password_Screen SHALL disable the submit button to prevent duplicate submissions.
8. IF any of the three password fields are empty when the form is submitted, THEN THE Change_Password_Screen SHALL display a validation message indicating which fields are required and SHALL NOT call the Change_Password_API.

---

### Requirement 8: Parallel Fetch and Screen Focus Refresh

**User Story:** As a Tenant, I want the Profile_Screen to load all live data efficiently and stay up to date when I return to it, so that I never see stale information.

#### Acceptance Criteria

1. WHEN the Profile_Screen mounts, THE Profile_Screen SHALL initiate the `getTenantProfileStats` fetch without blocking the screen render, allowing static content to display immediately.
2. THE Profile_Screen SHALL display `"—"` placeholder values for all API-dependent fields (Stats_Card values, Property_Card rent amount, next due date, unit type, bath count) until their respective responses are received.
3. WHEN the Profile_Screen receives focus after a navigation event (e.g., returning from Edit_Profile_Screen or Change_Password_Screen), THE Profile_Screen SHALL re-fetch profile stats to reflect any changes made.
4. IF the `getTenantProfileStats` fetch fails for any reason, THEN THE Profile_Screen SHALL retain `"—"` placeholders in all affected fields and SHALL NOT crash or display an unhandled exception screen.
