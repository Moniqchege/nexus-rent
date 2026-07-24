# Requirements Document

## Introduction

The Nexus Rent platform currently stores pricing and unit configuration data as flat fields directly on the `Property` model (`price`, `beds`, `baths`, `sqft`). The frontend's property-onboarding form (`PropertyForm.tsx`) has already been updated to collect structured `unitTypes` (an array of `{type, baths, price, totalUnits}`) and a building-level `floors` field, but the backend schema and API still operate on the old flat model, creating a mismatch.

This feature overhaul aligns the entire system — database schema, backend API, frontend store, and lease creation UI — with the new multi-unit data model. Key outcomes are:

- All pricing and unit data moves from `Property` into a new linked `UnitType` model.
- `Property` retains only building-level metadata and gains a `floors` field (renamed from `floor`).
- `Lease` gains `unitTypeId` (FK to `UnitType`) and `depositAmount`, enabling the lease form to cascade property → unit type → auto-fill rent.
- The occupancy rate calculation on the dashboard is updated to use `SUM(unitType.totalUnits)` instead of a raw property count.

## Glossary

- **Property**: A building or dwelling managed by a landlord in the system.
- **UnitType**: A category of rentable unit within a Property (e.g. "2 Bedroom", "Bedsitter"), carrying its own bathroom count, price, and inventory.
- **Lease**: A formal rental agreement linking one or more Tenants to a Property and a specific UnitType.
- **LeaseTenant**: A join record associating a User (tenant) with a Lease.
- **UnitType_Cascade**: The UI interaction where selecting a Property in the lease form automatically filters the available UnitType dropdown to only those belonging to that Property.
- **Occupancy_Rate**: The percentage of total units that are currently covered by at least one active lease, computed as `(units with active lease / total units across all unit types) × 100`.
- **Admin_Store**: The Zustand store (`adminStore.ts`) that holds client-side state for Properties, Leases, and related entities.
- **Dashboard**: The analytics page that displays `Occupancy_Rate`, revenue trends, and other KPIs.
- **Landlord**: A User who owns and manages one or more Properties.
- **Tenant**: A User who is assigned to a Property with the "Tenant" role.

---

## Requirements

### Requirement 1: Remove Flat Fields from the Property Model

**User Story:** As a developer, I want to remove the flat `price`, `beds`, `baths`, and `sqft` fields from the `Property` model and rename `floor` to `floors`, so that all unit-specific data lives in `UnitType` and the schema reflects building-level information only.

#### Acceptance Criteria

1. THE `Property` model SHALL NOT contain `price`, `beds`, `baths`, or `sqft` fields after migration.
2. THE `Property` model SHALL contain a `floors` field (String, nullable) in place of the existing `floor` field.
3. WHEN the database migration runs, THE Migration_Script SHALL rename the existing `floor` column to `floors` on the `Property` table.
4. WHEN the database migration runs, THE Migration_Script SHALL drop the `price`, `beds`, `baths`, and `sqft` columns from the `Property` table within a single atomic transaction, such that IF any column drop fails, the entire migration SHALL be rolled back and an error SHALL be reported.
5. THE `Property` model SHALL retain all existing fields not listed for removal: `id`, `landlordId`, `title`, `location`, `status`, `amenities`, `rating`, `score`, `image`, `createdAt`, `updatedAt`, and all existing relations.

---

### Requirement 2: Introduce the UnitType Model

**User Story:** As a landlord, I want each property to define multiple unit types with their own configuration and pricing, so that a single building can accurately represent a mix of studios, 1-bedrooms, 2-bedrooms, and other unit categories.

#### Acceptance Criteria

1. THE system SHALL create a `UnitType` model with fields: `id` (Int, PK, auto-increment), `propertyId` (Int, FK → `Property.id`), `type` (String), `baths` (Int), `price` (Float), `totalUnits` (Int).
2. THE `UnitType` model SHALL include `createdAt` (DateTime) and `updatedAt` (DateTime) fields managed automatically.
3. WHEN a `Property` is deleted, THE system SHALL cascade-delete all associated `UnitType` records.
4. THE `Property` model SHALL expose a `unitTypes` relation returning all associated `UnitType` records.
5. THE `UnitType` model SHALL expose a `leases` relation returning all `Lease` records linked to it.
6. THE `UnitType.type` field SHALL accept any non-empty string (e.g. "1br", "bedsitter", "penthouse") and SHALL NOT be constrained to an enum at the database level.

---

### Requirement 3: Property API — Create

**User Story:** As a landlord, I want to create a property by supplying building-level metadata and an array of unit types, so that the new multi-unit data structure is persisted correctly from the start.

#### Acceptance Criteria

1. WHEN a `POST /api/properties` request is received with a valid `unitTypes` array, THE Properties_API SHALL create the `Property` record and all associated `UnitType` records in a single transaction.
2. THE `POST /api/properties` request body SHALL accept: `title` (String, required), `location` (String, required), `floors` (String, optional), `status` (String, optional), `image` (String, optional), `amenities` (String[], optional), and `unitTypes` (Array, required, min length 1).
3. THE `POST /api/properties` request body SHALL NOT accept `price`, `beds`, `baths`, or `sqft` fields.
4. WHEN a `POST /api/properties` request is received with an empty `unitTypes` array, a `unitTypes` field set to `null`, or no `unitTypes` field at all, THE Properties_API SHALL return HTTP 400 with a descriptive error message.
5. WHEN a `POST /api/properties` request is received with a `unitTypes` entry missing a `type` or `price` field, THE Properties_API SHALL return HTTP 400 with a descriptive error message.
6. WHEN a `POST /api/properties` request succeeds, THE Properties_API SHALL return HTTP 201 with the created `Property` object including its nested `unitTypes` array.

---

### Requirement 4: Property API — Read

**User Story:** As a landlord, I want property read endpoints to return unit type data alongside property metadata, so that consumers always have a complete picture of a property's unit configuration.

#### Acceptance Criteria

1. WHEN a `GET /api/properties` request is received, THE Properties_API SHALL return each property with its nested `unitTypes` array.
2. WHEN a `GET /api/properties/:id` request is received for a valid property, THE Properties_API SHALL return the property with its nested `unitTypes` array.
3. THE Properties_API SHALL NOT return `price`, `beds`, `baths`, or `sqft` fields in any GET response.
4. THE Properties_API SHALL return `floors` (not `floor`) in all GET responses.

---

### Requirement 5: Property API — Update

**User Story:** As a landlord, I want to update a property's building details and unit types via the API, so that changes to unit configuration are reflected immediately.

#### Acceptance Criteria

1. WHEN a `PATCH /api/properties/:id` request includes a `unitTypes` array, THE Properties_API SHALL replace all existing `UnitType` records for that property with the provided array within a single transaction.
2. WHEN a `PATCH /api/properties/:id` request does not include a `unitTypes` field, or includes it as `null` or an empty array, THE Properties_API SHALL leave existing `UnitType` records unchanged.
3. THE `PATCH /api/properties/:id` request body SHALL accept `floors` as an optional field in place of `floor`.
4. THE `PATCH /api/properties/:id` request body SHALL NOT accept `price`, `beds`, `baths`, or `sqft` fields.
5. WHEN a `PATCH /api/properties/:id` request succeeds, THE Properties_API SHALL return the updated `Property` object including its nested `unitTypes` array.

---

### Requirement 6: Lease Model — Add UnitType FK and Deposit Amount

**User Story:** As a landlord, I want a lease to reference a specific unit type and record a deposit amount, so that the financial terms of the lease are fully captured.

#### Acceptance Criteria

1. THE `Lease` model SHALL contain a `unitTypeId` field (Int, nullable, FK → `UnitType.id`).
2. THE `Lease` model SHALL contain a `depositAmount` field (Float, nullable).
3. WHEN a `Lease` record is created with a valid `unitTypeId`, THE system SHALL set `rentAmount` automatically from `UnitType.price`.
4. WHEN a `Lease` record is created without a `unitTypeId`, THE system SHALL allow manual entry of `rentAmount` to preserve backwards compatibility with existing leases.
5. WHEN the referenced `UnitType` is deleted, THE system SHALL set `unitTypeId` to `null` on any associated `Lease` records (SET NULL on delete).

---

### Requirement 7: Lease API — Create

**User Story:** As a landlord, I want to create a lease by selecting a property and unit type, so that the rent amount is automatically derived and I only need to provide the deposit amount manually.

#### Acceptance Criteria

1. WHEN a `POST /api/leases` request is received with a valid `unitTypeId`, THE Leases_API SHALL look up the corresponding `UnitType`, set `rentAmount` from `UnitType.price`, and ignore any `rentAmount` value provided in the request body.
2. WHEN a `POST /api/leases` request is received without `unitTypeId`, THE Leases_API SHALL require `rentAmount` to be provided explicitly in the request body.
3. WHEN a `POST /api/leases` request includes `depositAmount`, THE Leases_API SHALL store it on the created `Lease` record.
4. WHEN a `POST /api/leases` request is received with a `unitTypeId` that does not belong to the specified `propertyId`, THE Leases_API SHALL return HTTP 400 with a descriptive error message.
5. WHEN a `POST /api/leases` request succeeds, THE Leases_API SHALL return HTTP 201 with the created lease including `unitTypeId` and `depositAmount` fields.
6. THE `POST /api/leases` response SHALL include the property's nested `unitTypes` array via the `property` relation.

---

### Requirement 8: Lease API — Read and Update

**User Story:** As a landlord, I want lease read and update endpoints to expose the unit type reference and deposit amount, so that lease details are always complete and editable.

#### Acceptance Criteria

1. WHEN a `GET /api/leases` or `GET /api/leases/:id` request is received, THE Leases_API SHALL include `unitTypeId` and `depositAmount` in the response for every lease.
2. WHEN a `PATCH /api/leases/:id` request includes `depositAmount`, THE Leases_API SHALL update the `depositAmount` field on the lease.
3. WHEN a `PATCH /api/leases/:id` request includes a `unitTypeId`, THE Leases_API SHALL re-derive `rentAmount` from the new unit type's price and update both fields.
4. WHEN a `PATCH /api/leases/:id` request does not include `unitTypeId`, THE Leases_API SHALL allow `rentAmount` to be updated manually as before.

---

### Requirement 9: Frontend Store — Property Type Updates

**User Story:** As a frontend developer, I want the `Property` interface in `adminStore.ts` to match the new backend model, so that type-safe code throughout the frontend reflects the actual data shape.

#### Acceptance Criteria

1. THE `Property` interface in `adminStore.ts` SHALL remove the `price`, `beds`, `baths`, and `sqft` fields.
2. THE `Property` interface in `adminStore.ts` SHALL add a `floors` field (String, optional).
3. THE `Property` interface in `adminStore.ts` SHALL add a `unitTypes` field typed as an array of `UnitType` objects where each `UnitType` has: `id` (number), `propertyId` (number), `type` (string), `baths` (number), `price` (number), and `totalUnits` (number).
4. THE `createProperty` action in `adminStore.ts` SHALL pass the `unitTypes` array and `floors` field to the API instead of `price`, `beds`, `baths`, and `sqft`.
5. THE `updateProperty` action in `adminStore.ts` SHALL pass `unitTypes` (when present) and `floors` to the API instead of the removed flat fields.

---

### Requirement 10: Frontend Store — Lease Type Updates

**User Story:** As a frontend developer, I want the `Lease` type to include `unitTypeId` and `depositAmount`, so that lease state management and UI rendering are consistent with the backend.

#### Acceptance Criteria

1. THE `Lease` type (in `types/lease.ts` or equivalent) SHALL add a `unitTypeId` field (number, optional/nullable).
2. THE `Lease` type SHALL add a `depositAmount` field (number, optional/nullable).
3. THE `createLease` action in `adminStore.ts` SHALL forward `unitTypeId` and `depositAmount` when present in the supplied data object, and SHALL throw an error if either field is present but cannot be forwarded to the API.
4. THE `updateLease` action in `adminStore.ts` SHALL forward `unitTypeId` and `depositAmount` when present in the supplied data object, and SHALL throw an error if either field is present but cannot be forwarded to the API.

---

### Requirement 11: LeaseForm UI — Property to Unit Type Cascade

**User Story:** As a landlord, I want the lease creation form to show a unit type dropdown that is filtered to the selected property's unit types, so that I can only pick a unit type that actually belongs to the chosen property.

#### Acceptance Criteria

1. WHEN a landlord selects a property in the LeaseForm, THE LeaseForm SHALL display a second dropdown populated with the unit types belonging to that property.
2. WHEN a landlord changes the selected property, THE LeaseForm SHALL clear the previously selected unit type and repopulate the unit type dropdown with the new property's unit types.
3. WHEN no property is selected, THE LeaseForm SHALL disable or hide the unit type dropdown.
4. THE LeaseForm unit type dropdown SHALL display each option using a label that includes the `type` name and price (e.g. "2 Bedroom — Ksh 25,000").
5. WHEN a landlord submits the form without selecting a unit type, THE LeaseForm SHALL prevent submission and display a validation error.

---

### Requirement 12: LeaseForm UI — Auto-fill Rent and Deposit

**User Story:** As a landlord, I want the lease form to auto-populate the rent amount from the selected unit type's price and let me enter a deposit amount separately, so that rent is always consistent with the unit type definition.

#### Acceptance Criteria

1. WHEN a landlord selects a unit type in the LeaseForm, THE LeaseForm SHALL automatically populate the rent amount field with `UnitType.price`.
2. THE LeaseForm SHALL include a `depositAmount` input field that accepts a numeric value.
3. WHEN the LeaseForm is submitted, THE LeaseForm SHALL include `unitTypeId` and `depositAmount` in the payload sent to `createLease` or `updateLease`.
4. WHEN the LeaseForm is pre-populated with `initialData` for an edit scenario where `unitTypeId` is set, THE LeaseForm SHALL display the previously selected unit type and the corresponding pre-filled rent amount in read-only mode.
5. WHEN the LeaseForm is pre-populated with `initialData` for an edit scenario where `unitTypeId` is not set (legacy lease), THE LeaseForm SHALL display the rent amount as an editable field to preserve backwards compatibility.
6. WHEN a unit type is selected in the LeaseForm (whether during initial creation or pre-population), THE rent amount field SHALL be read-only to prevent manual overrides.

---

### Requirement 13: Dashboard — Occupancy Rate Using Unit Counts

**User Story:** As a landlord, I want the dashboard's occupancy rate to reflect the actual proportion of units occupied, rather than a simple count of properties, so that the metric is meaningful for multi-unit buildings.

#### Acceptance Criteria

1. WHEN the `GET /api/dashboard/stats` endpoint is called, THE Dashboard_API SHALL compute `occupancyRate` as `(totalOccupiedUnits / totalAvailableUnits) × 100`, where:
   - `totalAvailableUnits` is the sum of `UnitType.totalUnits` across all unit types belonging to the landlord's properties.
   - `totalOccupiedUnits` is derived from active leases, counting one unit per active lease (each active lease occupies exactly one unit of its referenced unit type).
2. WHEN `totalAvailableUnits` is zero, THE Dashboard_API SHALL return an `occupancyRate` of 0 to avoid division by zero.
3. WHEN a property has no `UnitType` records (legacy data), THE Dashboard_API SHALL treat its contribution to `totalAvailableUnits` as 0, but SHALL still count active leases on that property toward `totalOccupiedUnits`.
4. THE Dashboard_API SHALL return `occupancyRate` as a number between 0 and 100 inclusive, rounded to at most two decimal places.
