# Implementation Plan: Property Listing and Detail

## Overview

Two improvements: (1) expand explore listings to one card per unit type, and (2) add a new Property Detail screen with amenities, contacts, and a book-viewing form. Requires a new backend endpoint, a new API client method, and a new mobile screen file.

---

## Tasks

- [x] 1. Add `GET /api/properties/:id/contacts` backend endpoint
  - In `backend/src/routes/properties.ts`, add this route **after** `GET /all` and **before** `PATCH /:id`. The `/:id/contacts` pattern must come before the generic `/:id` PATCH/DELETE handlers to avoid Express ambiguity:
  - Query `db.userProperty.findMany` where `propertyId` matches and `role.name` is NOT in `['Tenant', 'tenant', 'TENANT']`
  - Deduplicate by `user.id` using a `Set`
  - Return `{ contacts: [...] }` with each contact having `id`, `name`, `phone`, `role`
  - Handle: `isNaN(propertyId)` → 400; property not found → 404; DB error → 500
  - Protect with `requireAuth`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Add `fetchPropertyContacts` to the mobile API client
  - In `mobile/lib/api.ts`, add the method to the `api` object:
    ```typescript
    async fetchPropertyContacts(token: string, propertyId: number): Promise<PropertyContact[]> {
      const response = await fetch(`${API_BASE}/api/properties/${propertyId}/contacts`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json();
      return data.contacts ?? [];
    },
    ```
  - Add a `PropertyContact` interface to `mobile/types/property.ts`: `{ id: number; name: string; phone: string | null; role: string }`
  - _Requirements: 4.7, 4.8_

- [x] 3. Update `ListingItem` interface and `expandToListingItems` in `explore.tsx`
  - In `mobile/app/(tabs)/explore.tsx`:
    - Add `propertyId: number` and `unitTypeId: number` to the `ListingItem` interface
    - Replace `propertyToListing` and `deriveStartingPrice` with a new `expandToListingItems` function:
      ```typescript
      const expandToListingItems = (properties: Property[]): ListingItem[] =>
        properties.flatMap(p =>
          p.unitTypes.map(u => ({
            propertyId: p.id,
            unitTypeId: u.id,
            icon: getIconFromLocation(p.location),
            price: `Ksh${Math.round(u.price).toLocaleString()}`,
            area: p.location,
            name: `${p.title} ${u.type}`,
            ai: Math.round(p.score ?? 75),
            beds: u.type,
            baths: `${u.baths} Baths`,
            size: `${u.totalUnits} units`,
            color: getColorFromScore(p.score),
            gradientColors: ['#0f2027', '#203a43'] as [string, string],
          }))
        );
      ```
    - Properties with no unit types are automatically excluded since `flatMap` on an empty array produces no items
    - Update the featured section: `expandToListingItems(filteredProperties).slice(0, 3)`
    - Update all-listings section: `expandToListingItems(filteredProperties)`
    - Empty state check: `expandToListingItems(filteredProperties).length === 0`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 7.1_

- [x] 4. Wire navigation from listing cards in `explore.tsx`
  - In `mobile/app/(tabs)/explore.tsx`:
    - Import `useRouter` from `expo-router`
    - Wrap each featured card and each all-listings card in a `TouchableOpacity` (or `Pressable`) with an `onPress` handler:
      ```typescript
      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: String(item.propertyId), unitTypeId: String(item.unitTypeId) } })}
      ```
    - Apply to both the featured horizontal scroll cards AND the vertical all-listings cards
  - _Requirements: 2.1, 7.1, 7.2_

- [x] 5. Create `mobile/app/properties/_layout.tsx`
  - Create a minimal Expo Router layout file at `mobile/app/properties/_layout.tsx`:
    ```typescript
    import { Stack } from 'expo-router';
    export default function PropertiesLayout() {
      return <Stack screenOptions={{ headerShown: false }} />;
    }
    ```
  - This enables Expo Router to recognise the `/properties/[id]` route group
  - _Requirements: 2.1_

- [x] 6. Create the Property Detail screen `mobile/app/properties/[id].tsx`
  - Create `mobile/app/properties/[id].tsx` as a new React Native screen.
  - Read route params: `const { id, unitTypeId } = useLocalSearchParams<{ id: string; unitTypeId: string }>();`
  - State: `property` (null), `contacts` ([]), `loadingProperty` (true), `loadingContacts` (true), `contactsError` (''), `showBookingForm` (false), `bookingName` (''), `bookingPhone` (''), `bookingDate` (''), `bookingErrors` ({}), `bookingConfirmed` (false)
  - On mount, fetch in parallel:
    1. `api.fetchAllProperties(token)` → find property by `Number(id)` → `setProperty`
    2. `api.fetchPropertyContacts(token, Number(id))` → `setContacts`, catch → `setContactsError`
  - Derived: `const unitType = property?.unitTypes.find(u => u.id === Number(unitTypeId));`
  - **Loading state**: show `<ActivityIndicator>` while `loadingProperty` is true
  - **Error state**: if `!property || !unitType` after load, show error message + Back button (use `router.back()`)
  - **Detail content**:
    - Heading: `"${property.title} — ${unitType.type}"` with gradient text (match app style)
    - Location: `"📍 ${property.location}"`
    - Price: `"Ksh ${unitType.price.toLocaleString()}/mo"`
    - Bathrooms: `"${unitType.baths} Bathroom${unitType.baths !== 1 ? 's' : ''}"`
    - Total units: `"${unitType.totalUnits} units available"`
    - Amenities section: map over `property.amenities ?? []`; if empty show `"No amenities listed"`
    - Contacts section: loading indicator while `loadingContacts`; error notice if `contactsError`; list contacts with name, role, phone (`"Not available"` if null); empty state `"No contact information available"` if empty; each contact shows a `Call` button (`Linking.openURL('tel:...')`) if phone is not null
    - "Book Viewing" button always visible
  - **Book Viewing form** (shown when `showBookingForm`):
    - TextInput for name, phone, date (as text input in YYYY-MM-DD format)
    - Show `bookingErrors.name`, `bookingErrors.phone`, `bookingErrors.date` inline under each field
    - Submit button: validates → if valid sets `bookingConfirmed = true` and hides form
    - Cancel button: hides form, clears `bookingErrors`
    - Confirmation message: shown when `bookingConfirmed`
  - **Validation logic**:
    ```typescript
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 365);
    const errors: Record<string, string> = {};
    if (!bookingName.trim()) errors.name = 'Name is required';
    if (!bookingPhone.trim()) errors.phone = 'Phone is required';
    if (!bookingDate.trim()) errors.date = 'Date is required';
    else {
      const d = new Date(bookingDate);
      if (isNaN(d.getTime()) || d < today || d > maxDate) errors.date = 'Enter a valid date within the next 365 days';
    }
    if (Object.keys(errors).length > 0) { setBookingErrors(errors); return; }
    setBookingErrors({});
    setBookingConfirmed(true);
    setShowBookingForm(false);
    ```
  - Style to match the app's dark theme (#060A14 background, Orbitron font headings, neon/purple accents)
  - Run TypeScript diagnostics and fix any errors before completing
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.2, 7.3_

- [x] 7. Final checkpoint
  - Run TypeScript diagnostics on all modified/created files:
    - `backend/src/routes/properties.ts`
    - `mobile/lib/api.ts`
    - `mobile/types/property.ts`
    - `mobile/app/(tabs)/explore.tsx`
    - `mobile/app/properties/_layout.tsx`
    - `mobile/app/properties/[id].tsx`
  - Verify: `expandToListingItems` is used (not the old `propertyToListing`)
  - Verify: each listing card has an `onPress` that navigates with `propertyId` and `unitTypeId`
  - Verify: `GET /api/properties/:id/contacts` is placed correctly in `properties.ts` (before PATCH/DELETE)
  - Ensure all tests pass; ask the user if questions arise

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3", "5"] },
    { "id": 1, "tasks": ["4"] },
    { "id": 2, "tasks": ["6"] },
    { "id": 3, "tasks": ["7"] }
  ]
}
```

---

## Notes

- `GET /api/properties/:id/contacts` must be registered before `PATCH /:id` and `DELETE /:id` in `properties.ts` — Express matches `/:id` first if the contacts route comes after
- The detail screen reuses `fetchAllProperties` (which already has all unit type data) rather than introducing a new single-property endpoint — simpler and avoids an extra backend change
- `expandToListingItems` uses `flatMap` which naturally skips properties with empty `unitTypes` arrays (produces no items for them)
- The book-viewing form is purely client-side for now (no backend booking storage) — the confirmation is a UI-only acknowledgement
- `PropertyContact` should be added to `mobile/types/property.ts` to keep property-related types co-located
