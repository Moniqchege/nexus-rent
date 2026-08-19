# Requirements Document

## Introduction

This feature improves the tenant-facing Explore screen and adds a Property Detail screen to the Nexus Rent mobile app (Expo Router / React Native). There are two distinct improvements:

1. **Per-unit-type listing cards** — Instead of one card per property, the Explore screen expands each property into one card per `UnitType`, with the card title combining the property name and unit type (e.g., "Apex Apartments 1BR"). Featured and regular listing sections both follow this pattern.

2. **Property Detail screen** — Tapping any listing card navigates to a new detail screen at `mobile/app/properties/[id].tsx` that shows the selected unit type's details, the full property amenities list, a "Book Viewing" action, and contact details for the property's caretaker/manager.

The feature also requires a new backend endpoint (`GET /api/properties/:id/contacts`) so that the detail screen can load caretaker/manager contacts for any property, not just those the current user is already assigned to.

---

## Glossary

- **Explore_Screen**: The `(tabs)/explore.tsx` screen where tenants browse all available properties.
- **ListingItem**: The display-layer data structure used to render a single card in the Explore_Screen. Currently one per property; after this feature, one per unit type per property.
- **Property**: A building or estate record returned by `GET /api/properties/all`, containing `id`, `title`, `location`, `status`, `amenities`, `image`, `floors`, `score`, and `unitTypes`.
- **UnitType**: A sub-record of a Property with fields `id`, `type`, `price`, `baths`, `totalUnits`. Represents one bedroom/bath configuration within a property.
- **Detail_Screen**: The new screen at `mobile/app/properties/[id].tsx` that shows full information for a single UnitType of a single Property.
- **Contact**: A user record for a caretaker or property manager attached to a specific property, returned by `GET /api/properties/:id/contacts`. Contains `id`, `name`, `phone`, `role`.
- **Book_Viewing_Form**: A simple in-app form (or alert) that collects a prospective tenant's name, phone number, and preferred viewing date before submitting a viewing request.
- **Properties_Router**: The Express router at `backend/src/routes/properties.ts` that handles all `/api/properties` endpoints.
- **API_Client**: The `mobile/lib/api.ts` module that provides typed wrapper functions for all backend API calls.

---

## Requirements

### Requirement 1: Expand Explore Listings to Per-Unit-Type Cards

**User Story:** As a prospective tenant, I want to see one listing card per unit type per property, so that I can immediately compare pricing and configuration across all available unit types without having to drill into each property first.

#### Acceptance Criteria

1. THE Explore_Screen SHALL expand each Property into one ListingItem per UnitType, such that a property with N unit types produces exactly N listing cards.
2. WHEN generating a ListingItem for a given UnitType, THE Explore_Screen SHALL set the card title to the concatenation of the Property title, a space, and the UnitType type (e.g., "Apex Apartments 1BR").
3. WHEN generating a ListingItem for a given UnitType, THE Explore_Screen SHALL display the UnitType price (not a derived minimum) as the card price, formatted as `KshXXX,XXX/mo`.
4. THE Explore_Screen SHALL display the Property location on every ListingItem regardless of UnitType.
5. THE Explore_Screen SHALL include `propertyId` and `unitTypeId` on every ListingItem to enable navigation to the Detail_Screen.
6. WHEN a Property has zero UnitTypes, THE Explore_Screen SHALL omit that property from the listings entirely.
7. THE Explore_Screen SHALL apply the per-unit-type expansion to both the Featured horizontal scroll section (top 3 cards) and the All Listings vertical section.
8. WHEN search or area-filter criteria are active, THE Explore_Screen SHALL apply the filters at the Property level before expanding to per-unit-type ListingItems, so that filtering by area "Westlands" shows all unit types for properties in Westlands.

---

### Requirement 2: Navigate to Property Detail Screen

**User Story:** As a prospective tenant, I want to tap a listing card and see the full details for that unit type and property, so that I can make an informed decision before booking a viewing.

#### Acceptance Criteria

1. WHEN a user taps a ListingItem card in the Explore_Screen, THE Explore_Screen SHALL initiate navigation to the Detail_Screen passing the `propertyId` and `unitTypeId` values embedded in that ListingItem as route params named `id` and `unitTypeId` respectively.
2. WHEN the Detail_Screen mounts, THE Detail_Screen SHALL resolve the target Property by matching route param `id` to `property.id`, and the target UnitType by matching route param `unitTypeId` to `unitType.id` within that property's `unitTypes` array.
3. IF the resolved Property is not found or the resolved UnitType is not found within the property's `unitTypes`, THEN THE Detail_Screen SHALL display an error message and a visible back-navigation control, and SHALL NOT attempt to render detail content.
4. WHILE the Detail_Screen is fetching data (from mount until the first successful or failed API response), THE Detail_Screen SHALL display a loading indicator and SHALL NOT render partial detail content.

---

### Requirement 3: Display Unit Type and Property Details

**User Story:** As a prospective tenant, I want the detail screen to show all relevant information about the unit type and property, so that I can assess whether it meets my needs.

#### Acceptance Criteria

1. THE Detail_Screen SHALL display the property name and unit type in the heading, formatted as `"<Property Title> — <UnitType type>"` (e.g., "Apex Apartments — 1BR").
2. THE Detail_Screen SHALL display the property location.
3. THE Detail_Screen SHALL display the price of the UnitType identified by `unitTypeId`, formatted as `Ksh X,XXX/mo` using locale-aware number formatting.
4. THE Detail_Screen SHALL display the number of bathrooms from the UnitType identified by `unitTypeId`.
5. THE Detail_Screen SHALL display the total units available from the UnitType identified by `unitTypeId`.
6. THE Detail_Screen SHALL display the full amenities list from `property.amenities` (a string array), rendered as individual list items.
7. WHEN `property.amenities` is null, undefined, or an empty array, THE Detail_Screen SHALL display a `"No amenities listed"` placeholder instead of a list.

---

### Requirement 4: Property Contacts Endpoint

**User Story:** As a prospective tenant, I want to see the contact details for the caretaker or property manager of a specific property, so that I can reach out with questions before booking a viewing.

#### Acceptance Criteria

1. THE Properties_Router SHALL expose a `GET /api/properties/:id/contacts` endpoint that returns non-tenant staff (caretakers, property managers, landlords) assigned to the specified property, protected by `requireAuth`.
2. IF the `:id` path segment is not a valid integer, THEN THE Properties_Router SHALL return HTTP 400 with a JSON body `{ "error": "Invalid property ID" }`.
3. IF the `:id` does not correspond to an existing property, THEN THE Properties_Router SHALL return HTTP 404 with a JSON body `{ "error": "Property not found" }`.
4. IF the request lacks a valid auth token, THEN THE Properties_Router SHALL return HTTP 401 with an error body.
5. WHEN a valid property ID is provided and auth is valid, THE Properties_Router SHALL return HTTP 200 with a JSON body `{ "contacts": [...] }` where each contact object contains `id` (number), `name` (string), `phone` (string or null), and `role` (string — the role name).
6. WHEN the property has no non-tenant staff assigned, THE Properties_Router SHALL return HTTP 200 with `{ "contacts": [] }`.
7. THE API_Client SHALL expose a `fetchPropertyContacts(token: string, propertyId: number): Promise<Contact[]>` function that calls `GET /api/properties/{propertyId}/contacts` with an `Authorization: Bearer {token}` header.
8. IF `fetchPropertyContacts` receives a non-2xx HTTP response, THEN it SHALL throw an `Error` with message `"HTTP {status}: {responseText}"`.

---

### Requirement 5: Display Property Contacts on Detail Screen

**User Story:** As a prospective tenant, I want to see who manages the property directly on the detail screen, so that I have a clear point of contact.

#### Acceptance Criteria

1. WHEN the Detail_Screen mounts, THE Detail_Screen SHALL fetch contacts for the property by calling `fetchPropertyContacts` and SHALL display a loading indicator until the response is received.
2. WHEN the contacts response is received, THE Detail_Screen SHALL display each contact's name, role, and phone number (showing `"Not available"` when phone is null).
3. WHEN the contacts response is an empty array, THE Detail_Screen SHALL display a `"No contact information available"` placeholder.
4. IF the contacts fetch fails due to a network error or non-2xx response, THEN THE Detail_Screen SHALL display an inline error notice and SHALL NOT navigate away from the screen.

---

### Requirement 6: Book Viewing Action

**User Story:** As a prospective tenant, I want to initiate a viewing request from the detail screen, so that I can schedule a visit to the property without leaving the app.

#### Acceptance Criteria

1. THE Detail_Screen SHALL display a "Book Viewing" button that is always visible to the user.
2. WHEN the user taps the "Book Viewing" button, THE Detail_Screen SHALL present the Book_Viewing_Form as a modal or inline section.
3. THE Book_Viewing_Form SHALL collect the prospective tenant's name (1–100 characters), phone number (1–20 characters), and preferred viewing date (a date between today and 365 days from today inclusive).
4. WHEN the user submits the Book_Viewing_Form with all required fields valid, THE Detail_Screen SHALL display a confirmation message acknowledging the viewing request.
5. IF any required field is empty when the user submits, THEN THE Book_Viewing_Form SHALL display an inline validation error for each empty field and SHALL NOT submit the form.
6. IF the preferred date is outside the valid range (before today or more than 365 days from today), THEN THE Book_Viewing_Form SHALL display an inline validation error for the date field and SHALL NOT submit the form.
7. WHEN the user dismisses or cancels the Book_Viewing_Form without submitting, THE Detail_Screen SHALL return to its default state without any error messages.

---

### Requirement 7: Round-Trip Integrity of Listing Navigation

**User Story:** As a developer, I want the property ID and unit type ID carried through navigation to always resolve back to the same data, so that the detail screen never shows mismatched or stale information.

#### Acceptance Criteria

1. FOR ALL ListingItems generated from a given Property and UnitType, THE Explore_Screen SHALL embed a `propertyId` equal to `property.id` and a `unitTypeId` equal to `unitType.id`.
2. FOR ALL navigation events from the Explore_Screen, THE Detail_Screen SHALL receive the same `propertyId` and `unitTypeId` that were embedded in the tapped ListingItem.
3. WHEN the Detail_Screen resolves the UnitType using `unitTypeId`, THE Detail_Screen SHALL display data exclusively from that UnitType's fields (price, baths, totalUnits) and not from any sibling UnitType.
