# Implementation Plan: Mobile Profile Improvements

## Overview

Replace all hardcoded values on the Profile screen with live data from two new backend endpoints, add an Edit Profile modal, add a Change Password modal, and wire up navigation — touching six existing files and adding two new ones with no schema migrations required.

---

## Tasks

- [x] 1. Add `GET /api/users/me/profile-stats` endpoint to the backend
  - In `backend/src/routes/users.ts`, insert the route **before** `router.get('/:id', ...)` to prevent Express treating `"me"` as a user ID
  - Run four Prisma queries in `Promise.all`: `leaseTenants` (with nested lease + unitType), `allSchedules` (all `RentSchedule` for tenant), `nextSchedule` (earliest scheduled/overdue), and `userProperty` (floor/unit)
  - Compute `tenancyDuration` from the earliest eligible lease `startDate` — `"N yr(s)"` when ≥ 12 months, `"N mo"` when < 12 months, `"—"` when no leases
  - Compute `onTimeRate` as `(paidCount / pastDueTotal) * 100` rounded to 1 dp; return `100.0` when `pastDueTotal === 0`
  - Compute `score` using `Math.max(0, Math.min(100, Math.floor(onTimeRate - penalty)))` where `penalty = (overdueCount / Math.max(totalScheduleCount, 1)) * 10`
  - Derive `activeLease` as the most recent `status = "active"` lease, or `null`
  - Return `{ tenancyDuration, onTimeRate, score, activeLease, nextDueDate, floor, unit }` as JSON
  - Protect the route with the existing `requireAuth` middleware (returns 401 on failure)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14_

- [x] 2. Add `POST /api/users/me/change-password` endpoint to the backend
  - In `backend/src/routes/users.ts`, insert the route **before** `router.get('/:id', ...)` (after the profile-stats route added in task 1)
  - Validate that `currentPassword` and `newPassword` are both present; return HTTP 400 with a descriptive message if either is missing
  - Fetch the user's `password_hash` from the DB, compare with `bcrypt.compare`; return HTTP 400 `"Current password is incorrect"` on mismatch
  - Hash the new password with `bcrypt.hash(newPassword, 12)` and update `password_hash` in the DB
  - Return HTTP 200 `{ message: "Password updated" }` on success
  - Protect the route with `requireAuth` (already imported in `users.ts`)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Checkpoint — verify both backend endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Add `TenantProfileStats` interface and three new API functions to `mobile/lib/api.ts`
  - [x] 4.1 Export the `TenantProfileStats` interface
    - Add the interface at the top of `mobile/lib/api.ts` (after existing imports/types)
    - Fields: `tenancyDuration: string`, `onTimeRate: number`, `score: number`, `activeLease: { id, rentAmount, startDate, endDate, status, billingCycle, unitType: { type, baths, price } | null } | null`, `nextDueDate: string | null`, `floor: string | null`, `unit: string | null`
    - _Requirements: 3.1_

  - [x] 4.2 Add `getTenantProfileStats`, `changePassword`, and `updateProfile` methods
    - `getTenantProfileStats(token)`: `GET /api/users/me/profile-stats` with Bearer token; throws `Error` with status + body text on non-2xx
    - `changePassword(token, currentPassword, newPassword)`: `POST /api/users/me/change-password` with Bearer token and JSON body `{ currentPassword, newPassword }`; throws on non-2xx
    - `updateProfile(token, userId, data)`: `PATCH /api/users/${userId}` with Bearer token and JSON body `{ name, phone }`; throws on non-2xx; returns parsed `User` object
    - All three follow the same error pattern as existing methods: `throw new Error(\`HTTP ${response.status}: ${await response.text()}\`)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.3 Write property test for API error propagation (Property 7)
    - **Property 7: API error propagation**
    - **Validates: Requirements 3.4**
    - Create `mobile/lib/__tests__/api.test.ts`
    - For each of the three new functions, mock `fetch` to return a non-2xx status; assert the function throws an `Error` instance and never returns `undefined`

- [x] 5. Add `setUser` action to `mobile/store/authStore.ts`
  - Add `setUser: (user: User) => void` to the `AuthState` interface
  - Implement as `setUser: (user) => set({ user })` in the store — this merges via Zustand's shallow merge and does not touch `token`, `tempToken`, or any other field
  - _Requirements: 6.6_

- [ ] 6. Update `mobile/app/(tabs)/profile.tsx` with live stats, live property card, and navigation wiring
  - [~] 6.1 Add fetch state and `fetchProfileStats` function
    - Add state: `const [profileStats, setProfileStats] = useState<TenantProfileStats | null>(null)` and `const [statsLoading, setStatsLoading] = useState(true)`
    - Implement `fetchProfileStats`: set `statsLoading = true`, call `api.getTenantProfileStats(token)`, set `profileStats` on success or `null` on error, always set `statsLoading = false` in `finally`
    - Call `fetchProfileStats` on mount via `useEffect` and on screen focus via `useFocusEffect` (import `useFocusEffect` from `@react-navigation/native`, consistent with existing navigation imports)
    - Add `formatDate(isoString: string): string` helper at module scope: `new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`
    - _Requirements: 4.1, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 6.2 Write property test for `statsLoading` completeness (Property 8)
    - **Property 8: loading state completeness**
    - **Validates: Requirements 4.1, 8.2**
    - Test: for any fetch outcome (success, network error, non-2xx), `statsLoading` is always `false` after `fetchProfileStats` completes — the `finally` block guarantees this for all code paths

  - [~] 6.3 Bind Stats Card to live data
    - Replace hardcoded `"3 yrs"`, `"98.4%"`, `"94"` with:
      - Tenancy: `statsLoading ? "—" : (profileStats?.tenancyDuration ?? "—")`
      - On-Time: `statsLoading ? "—" : (profileStats ? \`${profileStats.onTimeRate}%\` : "—")`
      - Score: `statsLoading ? "—" : (profileStats ? profileStats.score.toString() : "—")`
    - _Requirements: 4.1, 4.2, 4.3_

  - [~] 6.4 Bind Property Card to live data
    - Replace the `specs` array derived from `propertyItem` (which reads from the stale `Property` model) with values from `profileStats`:
      - Unit type: `profileStats?.activeLease?.unitType?.type ?? "—"` (replaces `${propertyItem.beds} Beds`)
      - Baths: `profileStats?.activeLease?.unitType ? \`${profileStats.activeLease.unitType.baths} Baths\` : "—"` (replaces `${propertyItem.baths} Baths`)
      - Next due date: `profileStats?.nextDueDate ? formatDate(profileStats.nextDueDate) : "—"` (replaces hardcoded `"Jul 15"`)
      - Remove the sqft spec entry (no equivalent in the new data model)
    - Replace `price` in the property top row: `profileStats?.activeLease?.rentAmount ? \`Ksh${profileStats.activeLease.rentAmount.toLocaleString()}/mo\` : "N/A"`
    - Replace `"● ACTIVE LEASE"` badge text: `\`● ${profileStats?.activeLease?.status?.toUpperCase() ?? "NO LEASE"}\``
    - Add conditional floor/unit line below the location `Text`: render `\`Floor ${floor} · Unit ${unit}\`` (or only the available part) when `profileStats?.floor || profileStats?.unit`; omit entirely when both are null
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [~] 6.5 Wire navigation for Edit Profile and Security & Password preference items
    - In the `preferenceItems` array, add `onPress: () => router.push('/(modals)/edit-profile')` to the Edit Profile item
    - Add `onPress: () => router.push('/(modals)/change-password')` to the Security & Password item
    - In the `TouchableOpacity` `onPress` handler for `type === "link"` items, call `item.onPress?.()` (currently the handler only calls `toggleSetting` for toggles and has a TODO comment for links)
    - _Requirements: 6.1, 7.1_

- [~] 7. Create `mobile/app/(modals)/edit-profile.tsx`
  - Scaffold the file with dark theme matching `profile.tsx` (`#060A14` background, `#111827` inputs, `#00F0FF` accent)
  - Read `user` and `token` from `useAuthStore`; read `setUser` from the store
  - State: `name` (initialized to `user?.name ?? ''`), `phone` (initialized to `user?.phone ?? ''`), `loading` (false), `error` (null)
  - Layout: back button (`router.back()`), Name `TextInput` (pre-populated, editable), Phone `TextInput` (pre-populated, `keyboardType="phone-pad"`), Email `Text` (read-only, visually distinct), Save `TouchableOpacity` (disabled + reduced opacity while `loading`), error `Text` (shown when `error !== null`)
  - `handleSave`: guard on `!token || !user`; set `loading = true`, `error = null`; call `api.updateProfile(token, user.id, { name, phone })`; on success call `setUser(updated)` then `router.back()`; on failure set `error = e.message ?? 'Failed to update profile'`; always set `loading = false` in `finally`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [~] 8. Create `mobile/app/(modals)/change-password.tsx`
  - Scaffold the file with the same dark theme as `edit-profile.tsx`
  - Read `token` from `useAuthStore`
  - State: `currentPassword`, `newPassword`, `confirmPassword` (all `''`), `loading` (false), `error` (null), `success` (false)
  - Layout: back button, three `TextInput` fields with `secureTextEntry`, Update Password `TouchableOpacity` (disabled while `loading`), error `Text` (conditional), success `Text` (conditional)
  - `handleSubmit`: validate all three fields are non-empty (error: `'All fields are required'`); validate `newPassword === confirmPassword` (error: `'New passwords do not match'`); guard on `!token`; set `loading = true`, `error = null`; call `api.changePassword(token, currentPassword, newPassword)`; on success set `success = true` and `setTimeout(() => router.back(), 1500)`; on failure set `error = e.message ?? 'Failed to change password'`; always set `loading = false` in `finally`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [~] 9. Update auth guard in `mobile/app/_layout.tsx` to allow `(modals)` routes
  - Add `const isModalsRoute = segments[0] === '(modals)'` alongside the existing route flags
  - Add `!isModalsRoute` to the redirect condition that calls `router.replace('/(tabs)/home')`, so the guard reads: `!inTabsGroup && !isAuthFlow && !isServicesRoute && !isContactsRoute && !isChatbotRoute && !isAuditRoute && !isPayRoute && !isPropertiesRoute && !isModalsRoute`
  - No new `<Stack.Screen>` entries are needed — Expo Router's file-based routing discovers `(modals)/edit-profile.tsx` and `(modals)/change-password.tsx` automatically
  - _Requirements: 6.1, 7.1_

- [~] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the Profile screen renders without crashes when `getTenantProfileStats` returns an error
  - Verify that navigating to Edit Profile and Change Password does not trigger the auth redirect loop

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Both `/me/profile-stats` and `/me/change-password` routes **must** be placed before `router.get('/:id', ...)` in `users.ts`; Express matches routes in registration order and would otherwise treat `"me"` as a user ID
- `bcrypt` is already imported at the top of `users.ts` — no new import needed for task 2
- `useFocusEffect` is already used in other screens in the project; import from `@react-navigation/native`
- `setUser` in authStore uses Zustand's shallow merge (`set({ user })`), which preserves `token`, `tempToken`, and all other auth fields untouched
- `fast-check` should be installed in `mobile/` as a dev dependency if not already present: `npm install --save-dev fast-check`
- The `(modals)` directory is a new Expo Router group — create it as `mobile/app/(modals)/`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["4.1"] },
    { "id": 2, "tasks": ["4.2", "5"] },
    { "id": 3, "tasks": ["4.3", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "6.5", "7", "8", "9"] }
  ]
}
```
