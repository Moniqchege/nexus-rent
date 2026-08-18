# Implementation Plan: Explore Page Improvements

## Overview

Four targeted fixes to `mobile/app/(tabs)/explore.tsx` and supporting layers:
1. New `GET /api/properties/all` backend endpoint (no ownership filter)
2. Updated `Property` TypeScript type with `unitTypes[]`
3. New `fetchAllProperties` API client method
4. Explore screen rewired: correct price, functional search, dynamic area chips

---

## Tasks

- [x] 1. Add `GET /api/properties/all` backend endpoint
  - In `backend/src/routes/properties.ts`, add the route **before** `router.get('/:id', ...)` to avoid Express treating "all" as an ID:
    ```typescript
    router.get('/all', requireAuth, async (req, res) => {
      try {
        const properties = await db.property.findMany({
          select: {
            id: true,
            title: true,
            location: true,
            status: true,
            image: true,
            amenities: true,
            floors: true,
            createdAt: true,
            unitTypes: {
              select: { id: true, type: true, baths: true, price: true, totalUnits: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        res.json(properties);
      } catch (error) {
        console.error('Failed to fetch all properties:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
      }
    });
    ```
  - Confirm the route is placed AFTER `router.get('/amenities', ...)` and BEFORE `router.get('/:id', ...)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Update `Property` TypeScript type
  - In `mobile/types/property.ts`:
    - Export a new `UnitType` interface: `{ id: number; type: string; price: number; baths: number; totalUnits: number }`
    - Remove the fields `price`, `beds`, `baths`, and `sqft` from the `Property` interface
    - Add `unitTypes: UnitType[]` to the `Property` interface
    - Retain all other existing fields: `id`, `title`, `location`, `status`, `amenities`, `image`, `floors`, `score`, `rating`, `createdAt`, `updatedAt`, `landlord`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Add `fetchAllProperties` to the mobile API client
  - In `mobile/lib/api.ts`, add the method to the `api` object following the existing pattern:
    ```typescript
    async fetchAllProperties(token: string): Promise<Property[]> {
      const response = await fetch(`${API_BASE}/api/properties/all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      return response.json();
    },
    ```
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint — verify backend and API client
  - Run `npx tsc --noEmit` in `backend/` and `mobile/` to confirm zero new TypeScript errors
  - Verify the `/all` route is registered before `/:id` in `properties.ts`
  - Ensure all tests pass; ask the user if questions arise

- [x] 5. Rewrite `propertyToListing` and fix NaN price display
  - In `mobile/app/(tabs)/explore.tsx`:
    - Add a `deriveStartingPrice` pure function:
      ```typescript
      const deriveStartingPrice = (unitTypes: UnitType[]): string => {
        const prices = (unitTypes ?? []).map(u => u.price).filter(p => Number.isFinite(p));
        if (prices.length === 0) return 'N/A';
        return `Ksh${Math.round(Math.min(...prices))}`;
      };
      ```
    - Rewrite `propertyToListing` to:
      - Use `deriveStartingPrice(p.unitTypes)` for `price` instead of `p.price`
      - Replace `p.beds` / `p.baths` / `p.sqft` with unit-type derived values:
        - `beds`: `p.unitTypes.length > 0 ? p.unitTypes[0].type : 'N/A'`
        - `baths`: `p.unitTypes.length > 0 ? \`${p.unitTypes[0].baths} Baths\` : 'N/A'`
        - `size`: `` `${p.unitTypes.length} unit type${p.unitTypes.length !== 1 ? 's' : ''}` ``
    - Import `UnitType` from `../../types/property` if needed
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Wire `fetchAllProperties`, search, and dynamic area chips into the Explore screen
  - In `mobile/app/(tabs)/explore.tsx`:
    - Add `searchQuery` state (`useState('')`) and `selectedArea` state (`useState('All Areas')`)
    - Remove the hardcoded `areas` constant array
    - Replace `api.fetchProperties(token)` call in `loadProperties` with `api.fetchAllProperties(token)`
    - After `setProperties(data)`, reset `setSelectedArea('All Areas')` (Req 6.9)
    - Remove the `featured` and `listings` separate state variables; compute them from `properties` inline
    - Add `useMemo` for `areaChips`:
      ```typescript
      const areaChips = useMemo((): string[] => {
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const p of properties) {
          const key = p.location.toLowerCase();
          if (!seen.has(key)) { seen.add(key); unique.push(p.location); }
        }
        return ['All Areas', ...unique];
      }, [properties]);
      ```
    - Add `useMemo` for `filteredProperties`:
      ```typescript
      const filteredProperties = useMemo((): Property[] => {
        const q = searchQuery.trim().toLowerCase();
        return properties.filter(p => {
          const matchesSearch = q === '' ||
            p.title.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q);
          const matchesArea = selectedArea === 'All Areas' ||
            p.location.toLowerCase() === selectedArea.toLowerCase();
          return matchesSearch && matchesArea;
        });
      }, [properties, searchQuery, selectedArea]);
      ```
    - Wire the TextInput: add `value={searchQuery}` and `onChangeText={setSearchQuery}` props
    - Wire the area chips: replace the hardcoded `areas.map(...)` with `areaChips.map(...)`, make each chip `Pressable` that calls `setSelectedArea(area)`, highlight the active chip using `selectedArea === area`
    - Update featured cards to use `filteredProperties.slice(0, 3).map(propertyToListing)`
    - Update all-listings to use `filteredProperties.map(propertyToListing)`
    - Add empty state: when `filteredProperties.length === 0` and not loading, render a `<Text>No properties found</Text>` message in place of the listing cards
    - Add `useMemo` import from React if not already present
  - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 7. Final checkpoint — full screen integration
  - Run TypeScript diagnostics on `mobile/app/(tabs)/explore.tsx` and fix any errors
  - Verify: `p.price` is no longer accessed anywhere in `explore.tsx`
  - Verify: the `areas` hardcoded array is gone
  - Verify: `searchQuery` is bound to the TextInput
  - Verify: `filteredProperties` feeds both featured cards and all-listings
  - Verify: `loadProperties` calls `api.fetchAllProperties` (not `api.fetchProperties`)
  - Ensure all tests pass; ask the user if questions arise

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4"] },
    { "id": 2, "tasks": ["5", "6"] },
    { "id": 3, "tasks": ["7"] }
  ]
}
```

---

## Notes

- Tasks 1, 2, and 3 are independent and can run in parallel (Wave 0)
- The `/all` route MUST be placed before `/:id` in `properties.ts` — Express matches routes top-to-bottom and "all" would otherwise be parsed as a numeric ID parameter
- `deriveStartingPrice` is a pure function — no React Native dependencies, fully testable in Node
- The existing `fetchProperties` method in `api.ts` is left untouched; other screens that use it continue to work
- `useMemo` is already available in React — just add it to the existing import if not present
- The `Property` type change may surface TypeScript errors in other files that previously read `p.price`, `p.beds`, `p.baths`, or `p.sqft` — fix those in the checkpoint tasks
