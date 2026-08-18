# Requirements Document

## Introduction

The Explore page in the Nexus Rent mobile app is a property discovery screen where users can browse rental listings. Currently it has four defects that degrade the experience: (1) it only shows properties the authenticated user already belongs to rather than the full catalogue; (2) the search bar accepts text but does not filter results; (3) area-filter chips are hardcoded and may list areas with no properties; (4) rent prices display as "NaN/month" because the code reads a non-existent `price` field instead of deriving the starting price from `unitTypes`.

This feature addresses all four issues end-to-end, covering a new backend endpoint, a mobile API helper, an updated `Property` type, and revised screen logic.

---

## Glossary

- **Explore_Screen**: The `mobile/app/(tabs)/explore.tsx` React Native screen.
- **Properties_Route**: The Express router in `backend/src/routes/properties.ts`.
- **All_Properties_Endpoint**: The new `GET /api/properties/all` route that returns every property in the system.
- **Property**: A Prisma `Property` record as returned by the backend, including its `unitTypes` array.
- **UnitType**: A child record of `Property` containing `type`, `price`, `baths`, and `totalUnits`.
- **Starting_Price**: The minimum `price` value across all `UnitType` records belonging to a `Property`.
- **Listing_Item**: The UI-facing object derived from a `Property` used to render a card on the Explore_Screen.
- **Area_Chip**: A horizontally-scrollable filter button derived from property location values.
- **Search_Query**: The text entered by the user in the search `TextInput` on the Explore_Screen.
- **API_Client**: The `mobile/lib/api.ts` module.
- **Property_Type**: The TypeScript interface in `mobile/types/property.ts`.

---

## Requirements

### Requirement 1: All-Properties Backend Endpoint

**User Story:** As a prospective tenant, I want to browse every available rental property, so that I am not limited to properties I am already attached to.

#### Acceptance Criteria

1. THE `Properties_Route` SHALL expose a `GET /api/properties/all` endpoint protected by the existing `requireAuth` middleware.
2. WHEN a valid authenticated request is received at `GET /api/properties/all`, THE `All_Properties_Endpoint` SHALL query the database for all `Property` records without any filter on `landlordId` or `UserProperty` associations, and SHALL return HTTP 200 with a JSON array of those records. IF zero properties exist, it SHALL return HTTP 200 with an empty array.
3. WHEN returning properties, THE `All_Properties_Endpoint` SHALL include the `id`, `title`, `location`, `status`, `image`, `amenities`, `floors`, `createdAt`, and `unitTypes` (with sub-fields `id`, `type`, `baths`, `price`, `totalUnits`) fields for each property.
4. IF the database query fails, THEN THE `All_Properties_Endpoint` SHALL return HTTP 500 with a JSON body `{ "error": "Failed to fetch properties" }`.
5. IF the request lacks a valid auth token, THEN THE `All_Properties_Endpoint` SHALL return HTTP 401 with a JSON body containing an `error` field describing the rejection reason.
6. THE `All_Properties_Endpoint` SHALL order results by `createdAt` descending.

---

### Requirement 2: UnitType-Aware Property Type

**User Story:** As a developer, I want the mobile `Property` type to accurately reflect the backend data model, so that TypeScript compilation catches misuse of price and unit fields.

#### Acceptance Criteria

1. THE `Property_Type` SHALL include a `unitTypes` field typed as an array of `{ id: number; type: string; price: number; baths: number; totalUnits: number }`.
2. THE `Property_Type` SHALL remove the top-level `price`, `beds`, `baths`, and `sqft` fields that do not exist on the backend response.
3. THE `Property_Type` SHALL retain the fields `id`, `title`, `location`, `status`, `image`, `amenities`, `floors`, `createdAt`, `score`, `rating`, and `landlord` as they are currently defined.
4. THE `API_Client` function `fetchAllProperties` SHALL declare its return type as `Promise<Property[]>` using the updated `Property_Type`.

---

### Requirement 3: Fetch All Properties in the API Client

**User Story:** As a developer, I want a dedicated API helper that calls the all-properties endpoint, so that the Explore_Screen can retrieve the full property catalogue.

#### Acceptance Criteria

1. THE `API_Client` SHALL expose a `fetchAllProperties(token: string): Promise<Property[]>` function.
2. WHEN called, THE `fetchAllProperties` function SHALL send a `GET` request to `{API_BASE}/api/properties/all` with `Content-Type: application/json` and `Authorization: Bearer {token}` headers.
3. WHEN the server responds with a 2xx status, THE `fetchAllProperties` function SHALL parse the response body as JSON and return it as `Property[]`.
4. IF the response status is 401, THEN THE `fetchAllProperties` function SHALL throw an `Error` with the message `"Unauthorized"`.
5. IF the response status is any other non-2xx code, THEN THE `fetchAllProperties` function SHALL throw an `Error` with the message `"HTTP {status}: {responseText}"` where `{status}` is the HTTP status code and `{responseText}` is the raw response body text.

---

### Requirement 4: Correct Starting Price Derivation

**User Story:** As a prospective tenant, I want to see a valid starting price for each property, so that I can compare rental costs before enquiring.

#### Acceptance Criteria

1. THE `Explore_Screen` SHALL derive the `Starting_Price` for each `Property` as the minimum `price` value across all `UnitType` items in `property.unitTypes`, where `price` is the numeric `price` field on each `UnitType`.
2. IF `property.unitTypes` is empty, undefined, or contains no items with a finite numeric `price`, THEN THE `Explore_Screen` SHALL display `"N/A"` in place of a price and SHALL NOT attempt to format or derive a numeric price value.
3. WHEN `property.unitTypes` contains at least one entry with a finite numeric `price`, THE `Explore_Screen` SHALL format the price as `Ksh{amount}` where `amount` is the `Starting_Price` rounded to the nearest whole number using `Math.round`.
4. WHEN displaying a price in a card, THE `Explore_Screen` SHALL append the suffix `/mo` after the formatted amount.
5. THE `propertyToListing` function SHALL NOT read `property.price`, `property.beds`, `property.baths`, or `property.sqft` directly.

---

### Requirement 5: Operational Search Bar

**User Story:** As a prospective tenant, I want to type in the search bar and see only matching listings, so that I can quickly find properties by name or neighbourhood.

#### Acceptance Criteria

1. THE `Explore_Screen` SHALL maintain a `searchQuery` state variable bound to the search `TextInput` `value` and `onChangeText` props.
2. WHEN `searchQuery` is non-empty after trimming leading and trailing whitespace, THE `Explore_Screen` SHALL filter the displayed listings to only those whose `title` or `location` contains the trimmed `searchQuery` string (case-insensitive).
3. WHEN `searchQuery` is empty or contains only whitespace, THE `Explore_Screen` SHALL display all listings without filtering.
4. THE search filter SHALL apply to both the featured-cards section and the all-listings section simultaneously.
5. WHEN no listings match `searchQuery`, THE `Explore_Screen` SHALL display the text `"No properties found"` in place of the listing cards.

---

### Requirement 6: Dynamic Area Chips

**User Story:** As a prospective tenant, I want the area filter chips to reflect only areas that have real listings, so that I do not tap a chip and see an empty result.

#### Acceptance Criteria

1. WHEN properties are loaded or re-fetched, THE `Explore_Screen` SHALL derive the list of area chips from the `location` field of the fetched properties rather than from a hardcoded array.
2. THE `Explore_Screen` SHALL always include `"All Areas"` as the first chip, regardless of the fetched data.
3. THE `Explore_Screen` SHALL deduplicate location values using a case-insensitive comparison so each unique area (ignoring case differences) appears at most once in the chip list, preserving the original casing of the first occurrence.
4. WHEN an area chip other than `"All Areas"` is selected, THE `Explore_Screen` SHALL filter the displayed listings to only those whose `location` value equals the selected area chip label using a case-insensitive comparison.
5. WHEN `"All Areas"` is selected, THE `Explore_Screen` SHALL display all listings without area filtering.
6. THE `Explore_Screen` SHALL apply the area filter in combination with the `searchQuery` filter so both can be active simultaneously.
7. WHEN the selected area chip has no matching listings (after applying the search filter), THE `Explore_Screen` SHALL display the text `"No properties found"`.
8. THE `Explore_Screen` SHALL maintain a `selectedArea` state variable initialised to `"All Areas"`.
9. WHEN properties are re-fetched, THE `Explore_Screen` SHALL recompute the area chip list from the new data and reset `selectedArea` to `"All Areas"`.
