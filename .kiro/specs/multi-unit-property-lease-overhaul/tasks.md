# Implementation Plan: Multi-Unit Property & Lease Overhaul

## Overview

Align the full stack with the multi-unit data model: remove flat `price/beds/baths/sqft` fields from `Property`, introduce the `UnitType` child model, add `unitTypeId` + `depositAmount` to `Lease`, update all API routes and the frontend store/types, refactor `LeaseForm` with a property→unit-type cascade dropdown, and replace the property-count occupancy rate with a unit-count formula on the dashboard.

---

## Tasks

- [x] 1. Update Prisma schema — Property, UnitType, and Lease models
  - [x] 1.1 Remove flat fields from `Property`, rename `floor → floors`, add `unitTypes` relation
    - In `backend/prisma/schema.prisma`, delete `price Float`, `beds Int`, `baths Int`, `sqft Int?` from the `Property` model
    - Rename the `floor String?` field to `floors String?`
    - Add `unitTypes UnitType[]` relation to `Property`
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 1.2 Add the `UnitType` model to the schema
    - Add the full `UnitType` model with fields: `id`, `propertyId`, `type`, `baths`, `price`, `totalUnits`, `createdAt`, `updatedAt`
    - Include `property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)`
    - Include `leases Lease[]` relation
    - Add `@@index([propertyId])`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Add `unitTypeId` and `depositAmount` to the `Lease` model
    - Add `unitTypeId Int?` with `unitType UnitType? @relation(fields: [unitTypeId], references: [id], onDelete: SetNull)`
    - Add `depositAmount Float?`
    - Add `@@index([unitTypeId])`
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 2. Generate and verify the database migration
  - [x] 2.1 Generate and review the Prisma migration
    - Run `npx prisma migrate dev --name multi_unit_overhaul` in `backend/`
    - Verify the generated SQL: drops `price`, `beds`, `baths`, `sqft`; renames `floor → floors`; creates `UnitType` table; adds `unitTypeId` + `depositAmount` to `Lease`
    - Confirm all column drops are in one `ALTER TABLE` statement (atomic)
    - _Requirements: 1.3, 1.4_

- [x] 3. Update Property API route (`backend/src/routes/properties.ts`)
  - [x] 3.1 Update `CreatePropertyInput` / `UpdatePropertyInput` interfaces and POST handler
    - Replace `price`, `beds`, `baths`, `sqft`, `floor` with `floors?: string` and `unitTypes: UnitTypeInput[]` in `CreatePropertyInput`
    - Validate `unitTypes` is a non-empty array; return 400 `"unitTypes must be a non-empty array"` otherwise
    - Validate each entry has `type` and `price`; return 400 `"Each unit type must have a type and price"` otherwise
    - Use Prisma nested `create` (`unitTypes: { create: unitTypes }`) inside `db.property.create` to persist atomically
    - Update the `select` clause to include `unitTypes: true` in the POST response
    - Return HTTP 201 with property + nested `unitTypes`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Update GET handlers to include `unitTypes` and drop old flat fields
    - In `GET /api/properties` and `GET /api/properties/:id`, remove `price`, `beds`, `baths`, `sqft`, `floor` from the `select` clause
    - Add `unitTypes: true` and `floors: true` to all `select` clauses
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.3 Update `UpdatePropertyInput` interface and PATCH handler
    - Replace removed flat fields with `floors?: string` in `UpdatePropertyInput`
    - Update `editableFields` array: remove `price`, `beds`, `baths`, `sqft`, `floor`; add `floors`
    - When `unitTypes` is present and non-empty in request body, run `db.$transaction` with `deleteMany({ where: { propertyId } })` then `createMany({ data: unitTypes })`
    - Include `unitTypes: true` in the PATCH response `select`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.4 Write property tests for Property API (Properties 3 & 4)
    - **Property 3: Unit types round-trip on property create** — generate random property payloads with unitTypes arrays of length 1–10 and random field values; assert response `unitTypes` deep-equals request `unitTypes` (ignoring server-assigned `id` and `propertyId`)
    - **Validates: Requirements 3.1, 3.6, 4.1**
    - **Property 4: Unit types replace-all on property update** — generate a property, update it with a different unitTypes array; assert response contains exactly the new array and no stale entries remain
    - **Validates: Requirements 5.1**
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 3: Unit types round-trip on property create`
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 4: Unit types replace-all on property update`
    - Use `fast-check` for generation; minimum 100 iterations each

- [x] 4. Checkpoint — Backend schema and property routes
  - Ensure all TypeScript compiles without errors in `backend/`; ensure all tests pass; ask the user if questions arise.

- [x] 5. Update Lease API route (`backend/src/routes/leases.ts`)
  - [x] 5.1 Extend `leaseInclude` and update GET handlers
    - Add `unitType: true` to `leaseInclude`
    - Extend the `property` select inside `leaseInclude` to include `unitTypes: true`
    - All GET responses for leases will now include `unitTypeId`, `depositAmount`, and nested `unitType` and `property.unitTypes`
    - _Requirements: 8.1_

  - [x] 5.2 Update POST `/api/leases` handler — `unitTypeId` logic and `depositAmount`
    - Destructure `unitTypeId` and `depositAmount` from `req.body`
    - Change validation: require `rentAmount` only when `unitTypeId` is absent; return 400 `"rentAmount is required when unitTypeId is not provided"` otherwise
    - When `unitTypeId` is present: look up `UnitType`; return 400 `"Unit type not found"` if missing; validate `unitType.propertyId === propertyIdNum`; return 400 `"Unit type does not belong to the specified property"` if mismatch; set `rentAmount = unitType.price`
    - Pass `unitTypeId` and `depositAmount` (when provided) into `db.lease.create`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.3 Update PATCH `/api/leases/:id` handler — `unitTypeId` and `depositAmount` editing
    - Add `"unitTypeId"` and `"depositAmount"` to the `editableFields` array
    - After collecting `updateData`, if `updateData.unitTypeId` is set: look up the new `UnitType`, validate it belongs to the lease's current `propertyId`, and set `updateData.rentAmount = unitType.price`
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 5.4 Write property tests for Lease API (Properties 1, 2, & 6)
    - **Property 1: Rent derivation from unit type (create and update)** — generate random property with N unit types (N ∈ [1,10], random prices); randomly select one; create or update a lease with `unitTypeId` and an arbitrary `rentAmount`; assert `lease.rentAmount === selectedUnitType.price`
    - **Validates: Requirements 6.3, 7.1, 8.3**
    - **Property 2: Cross-property unit type rejection** — generate two distinct properties each with at least one unit type; attempt lease creation on property A using a unit type from property B; assert HTTP 400
    - **Validates: Requirements 7.4**
    - **Property 6: depositAmount persistence round-trip** — generate random `depositAmount` values (positive integers, zero, fractional floats); create a lease with each value, read it back; assert `lease.depositAmount === input.depositAmount`
    - **Validates: Requirements 6.2, 7.3, 8.1, 8.2**
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 1: Rent derivation from unit type`
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 2: Cross-property unit type rejection`
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 6: depositAmount persistence round-trip`
    - Use `fast-check`; minimum 100 iterations each

- [x] 6. Update Dashboard route (`backend/src/routes/dashboard.ts`)
  - [x] 6.1 Replace property-count occupancy rate with unit-count formula
    - Remove the `occupiedPropertyIds` query from the `Promise.all` array
    - Add two new parallel queries: `db.unitType.aggregate({ where: { property: { landlordId: userId } }, _sum: { totalUnits: true } })` and `db.lease.count({ where: { status: 'active', property: { landlordId: userId } } })`
    - Compute `totalAvailableUnits = unitAggregate._sum.totalUnits ?? 0`
    - Compute `occupancyRate = totalAvailableUnits > 0 ? Math.round((totalOccupiedUnits / totalAvailableUnits) * 100 * 100) / 100 : 0`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 6.2 Write property test for dashboard occupancy rate (Property 5)
    - **Property 5: Occupancy rate formula invariant** — generate random portfolios with varying numbers of unit types (`totalUnits ∈ [0, 50]` per type) and a random active lease count; assert `occupancyRate === Math.round((activeLeaseCount / totalAvailableUnits) * 100 * 100) / 100` when `totalAvailableUnits > 0`, and `0` otherwise; assert the value is always within `[0, 100]`
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 5: Occupancy rate formula invariant`
    - Use `fast-check`; minimum 100 iterations

- [x] 7. Checkpoint — All backend routes
  - Ensure all TypeScript compiles without errors in `backend/`; ensure all tests pass; ask the user if questions arise.

- [x] 8. Update frontend Lease types (`frontend/types/lease.ts`)
  - [x] 8.1 Add `UnitType` interface and extend `Lease`, `CreateLeaseInput`, `UpdateLeaseInput`
    - Export a new `UnitType` interface: `{ id: number; propertyId: number; type: string; baths: number; price: number; totalUnits: number }`
    - Add `unitTypeId?: number | null` and `depositAmount?: number | null` to the `Lease` interface
    - Extend `Lease.property` shape with `unitTypes: UnitType[]`
    - Add `unitTypeId?: number` and `depositAmount?: number` to `CreateLeaseInput`
    - Add `unitTypeId?: number` and `depositAmount?: number` to `UpdateLeaseInput`
    - _Requirements: 10.1, 10.2_

- [x] 9. Update frontend admin store (`frontend/app/store/adminStore.ts`)
  - [x] 9.1 Update `Property` interface and add `UnitType` interface
    - Export a new `UnitType` interface: `{ id: number; propertyId: number; type: string; baths: number; price: number; totalUnits: number }`
    - Remove `price`, `beds`, `baths`, `sqft` from the `Property` interface
    - Add `floors?: string` and `unitTypes: UnitType[]` to `Property`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.2 Update `createProperty`, `updateProperty`, `createLease`, and `updateLease` store actions
    - `createProperty`: pass `unitTypes` and `floors` to the API; do not send `price`, `beds`, `baths`, `sqft`
    - `updateProperty`: pass `unitTypes` (when present) and `floors` to the API
    - `createLease`: forward `unitTypeId` and `depositAmount` when present in the supplied data object
    - `updateLease`: forward `unitTypeId` and `depositAmount` when present in the supplied data object
    - _Requirements: 9.4, 9.5, 10.3, 10.4_

- [ ] 10. Update `LeaseForm` UI (`frontend/app/components/leases/LeaseForm.tsx`)
  - [ ] 10.1 Add `unitTypeId` and `depositAmount` to form state and initialize from `initialData`
    - Extend the `data` state object with `unitTypeId: initialData.unitTypeId ?? undefined` and `depositAmount: initialData.depositAmount ?? 0`
    - Import `UnitType` from `adminStore` (or `types/lease.ts`)
    - _Requirements: 11.3, 12.2_

  - [x] 10.2 Add the Unit Type cascade dropdown in the Agreement Details section
    - Derive `availableUnitTypes` from `properties.find(p => p.id === data.propertyId)?.unitTypes ?? []`
    - Render a `CustomDropdown` for Unit Type immediately after the Property dropdown
    - Disable (or hide) the dropdown when `data.propertyId === 0` or `availableUnitTypes.length === 0`
    - Display each option as `"${ut.type} — Ksh ${ut.price.toLocaleString()}"` (value = `ut.id`)
    - When property changes, reset `unitTypeId` to `undefined` and `rentAmount` to `0` alongside the existing tenant reset
    - When a unit type is selected: set `unitTypeId = ut.id` and `rentAmount = ut.price`
    - Add validation on submit: if `availableUnitTypes.length > 0` and no `unitTypeId` is selected, set error `"Please select a unit type"` and abort
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.3 Make `rentAmount` read-only when a unit type is selected, add `depositAmount` input
    - In the Financial Terms section, render the `rentAmount` input with `readOnly={!!data.unitTypeId}` and conditionally apply dimmed / pointer-events-none styles when read-only
    - Add a new numeric input for "Deposit Amount (Ksh)" in the Financial Terms section (3-column grid becomes 4-column, or add a second row)
    - Update `handleSubmit` to include `unitTypeId` and `depositAmount` in the payload; omit `rentAmount` from the payload when `unitTypeId` is set (server derives it)
    - For edit mode with `initialData.unitTypeId` set: pre-select unit type dropdown, show `rentAmount` read-only
    - For edit mode without `initialData.unitTypeId` (legacy): `rentAmount` remains editable as before
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 10.4 Write property tests for LeaseForm cascade and auto-fill (Properties 7 & 8)
    - **Property 7: LeaseForm unit type cascade** — using React Testing Library + fast-check, generate random arrays of property objects each with varying `unitTypes`; render `LeaseForm`, select a random property, assert dropdown options match that property's `unitTypes`; change to another property, assert old unit type selection is cleared and dropdown reflects the new property's unit types
    - **Validates: Requirements 11.1, 11.2**
    - **Property 8: LeaseForm rent auto-fill and read-only invariant** — generate random unit types with varying `price` values; select each in `LeaseForm`; assert `formState.rentAmount === selectedUnitType.price` and the rent input has `readOnly={true}`
    - **Validates: Requirements 12.1, 12.6**
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 7: LeaseForm unit type cascade`
    - Tag: `// Feature: multi-unit-property-lease-overhaul, Property 8: LeaseForm rent auto-fill and read-only invariant`
    - Use `fast-check` + React Testing Library; minimum 100 iterations each

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all TypeScript compiles without errors across both `backend/` and `frontend/`; run the full test suite; ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements from `requirements.md` for full traceability
- The Prisma migration (task 2.1) must be run before any backend route changes are tested against a live database
- Property-based tests use `fast-check` (already the project's PBT library per the design doc); frontend PBTs use `fast-check` + React Testing Library
- Frontend PBT tasks (10.4) require a test runner configured for React components (e.g. Jest + jsdom or Vitest + jsdom)
- The `LeaseForm` backward-compatibility path (legacy leases without `unitTypeId`) must be preserved — the `rentAmount` input stays editable in that scenario
- All column drops in the Prisma migration are atomic; if any step fails the entire migration rolls back

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "5.1", "6.1"] },
    { "id": 3, "tasks": ["3.4", "5.2", "5.3", "6.2", "8.1"] },
    { "id": 4, "tasks": ["5.4", "9.1"] },
    { "id": 5, "tasks": ["9.2", "10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3"] },
    { "id": 7, "tasks": ["10.4"] }
  ]
}
```
