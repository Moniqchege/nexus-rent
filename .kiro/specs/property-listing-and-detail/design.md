# Design Document: Property Listing and Detail

## Overview

This feature makes two targeted changes to the Explore screen and adds a new Property Detail screen:

1. **Per-unit-type expansion** — `explore.tsx` fans each property out into one `ListingItem` per `UnitType`, replacing the previous single-card-per-property model.
2. **Property Detail screen** — A new `mobile/app/properties/[id].tsx` screen showing unit type details, amenities, caretaker/manager contacts, and a book-viewing form.

A new `GET /api/properties/:id/contacts` backend endpoint is required because the existing contacts endpoint is scoped to the requesting user's own properties.

---

## Architecture

```
Explore_Screen (explore.tsx)
  filteredProperties (Property[])
    → expandToListingItems(filteredProperties) → ListingItem[]
       (one ListingItem per UnitType per Property)
    → render cards with onPress → router.push('/properties/[id]', { id, unitTypeId })

Detail_Screen (properties/[id].tsx)
  route params: id, unitTypeId
  → api.fetchAllProperties(token) — reuse existing endpoint to get property + unitTypes
  → api.fetchPropertyContacts(token, propertyId)
  → render: heading, price, baths, totalUnits, amenities, contacts, Book Viewing button
```

No new data is fetched for the listing expansion — `filteredProperties` already has all `unitTypes` fields. The detail screen reuses `fetchAllProperties` to get a single property's data (by finding it in the result by ID), avoiding a new property-by-ID endpoint change.

---

## Components and Interfaces

### Updated `ListingItem` interface

Add `propertyId` and `unitTypeId` fields:

```typescript
interface ListingItem {
  propertyId: number;     // NEW
  unitTypeId: number;     // NEW
  icon: string;
  price: string;
  area: string;
  name: string;           // now "<Property Title> <UnitType type>"
  ai: number;
  beds: string;
  baths: string;
  size: string;
  color: 'neon' | 'purple' | 'success' | 'danger';
  gradientColors: [string, string];
}
```

### `expandToListingItems` function

Replaces `propertyToListing` for the expansion logic:

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

### New `Contact` type (`mobile/types/contact.ts` or inline)

```typescript
export interface PropertyContact {
  id: number;
  name: string;
  phone: string | null;
  role: string;
}
```

### New API client method: `fetchPropertyContacts`

```typescript
async fetchPropertyContacts(token: string, propertyId: number): Promise<PropertyContact[]> {
  const response = await fetch(`${API_BASE}/api/properties/${propertyId}/contacts`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.contacts ?? [];
},
```

### New backend route: `GET /api/properties/:id/contacts`

Placed **before** the existing `PATCH /:id` and `DELETE /:id` routes, after `GET /all`:

```typescript
router.get('/:id/contacts', requireAuth, async (req, res) => {
  const idParam = req.params.id;
  const propertyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

  if (isNaN(propertyId)) {
    return res.status(400).json({ error: 'Invalid property ID' });
  }

  try {
    const property = await db.property.findUnique({ where: { id: propertyId }, select: { id: true } });
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const userProperties = await db.userProperty.findMany({
      where: {
        propertyId,
        role: { name: { notIn: ['Tenant', 'tenant', 'TENANT'] } },
      },
      select: {
        role: { select: { name: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    const seen = new Set<number>();
    const contacts = userProperties
      .filter(({ user }) => { if (seen.has(user.id)) return false; seen.add(user.id); return true; })
      .map(({ user, role }) => ({ id: user.id, name: user.name, phone: user.phone, role: role.name }));

    res.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch property contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});
```

### Detail Screen: `mobile/app/properties/[id].tsx`

New file. Route accessed via `router.push({ pathname: '/properties/[id]', params: { id, unitTypeId } })`.

State:
```typescript
const { id, unitTypeId } = useLocalSearchParams<{ id: string; unitTypeId: string }>();
const [property, setProperty] = useState<Property | null>(null);
const [contacts, setContacts] = useState<PropertyContact[]>([]);
const [loadingProperty, setLoadingProperty] = useState(true);
const [loadingContacts, setLoadingContacts] = useState(true);
const [contactsError, setContactsError] = useState('');
const [showBookingForm, setShowBookingForm] = useState(false);
// Booking form state
const [bookingName, setBookingName] = useState('');
const [bookingPhone, setBookingPhone] = useState('');
const [bookingDate, setBookingDate] = useState('');
const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
const [bookingConfirmed, setBookingConfirmed] = useState(false);
```

On mount, fetch `fetchAllProperties` to get the property (find by `id`), and `fetchPropertyContacts` for contacts in parallel.

Derived values:
```typescript
const unitType = property?.unitTypes.find(u => u.id === Number(unitTypeId));
```

Book viewing validation:
```typescript
const today = new Date(); today.setHours(0,0,0,0);
const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 365);
const selectedDate = bookingDate ? new Date(bookingDate) : null;
const errors: Record<string, string> = {};
if (!bookingName.trim()) errors.name = 'Name is required';
if (!bookingPhone.trim()) errors.phone = 'Phone is required';
if (!bookingDate) errors.date = 'Date is required';
else if (selectedDate! < today || selectedDate! > maxDate) errors.date = 'Date must be within the next 365 days';
```

### Expo Router: `mobile/app/properties/_layout.tsx`

Minimal layout file required for Expo Router to recognise the route group:

```typescript
import { Stack } from 'expo-router';
export default function PropertiesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

## Data Models

### `ListingItem` (updated)

| Field | Source | Notes |
|---|---|---|
| `propertyId` | `property.id` | For navigation |
| `unitTypeId` | `unitType.id` | For navigation |
| `name` | `"${property.title} ${unitType.type}"` | e.g. "Apex Apartments 1BR" |
| `price` | `"Ksh${Math.round(unitType.price).toLocaleString()}"` | Per-unit price |
| `area` | `property.location` | |
| `baths` | `"${unitType.baths} Baths"` | |
| `size` | `"${unitType.totalUnits} units"` | |

### `GET /api/properties/:id/contacts` response

```json
{
  "contacts": [
    { "id": 5, "name": "Jane Doe", "phone": "+254712345678", "role": "Caretaker" },
    { "id": 3, "name": "John Mwangi", "phone": null, "role": "Property Manager" }
  ]
}
```

---

## Correctness Properties

### Property 1: Per-unit-type expansion count
For any array of Properties, `expandToListingItems(properties).length` equals `sum of properties[i].unitTypes.length`.

### Property 2: ListingItem embeds correct IDs
For any ListingItem produced by `expandToListingItems`, `item.propertyId` equals the source property's `id` and `item.unitTypeId` equals the source unit type's `id`.

### Property 3: ListingItem name format
For any ListingItem, `item.name` equals `"${property.title} ${unitType.type}"` with exactly one space between them.

### Property 4: Properties with zero unit types are excluded
For any Property with `unitTypes.length === 0`, `expandToListingItems([property])` returns an empty array.

### Property 5: Detail screen uses only the specified unit type's data
For any Detail_Screen render where `unitTypeId` matches unit type U, the rendered price, baths, and totalUnits values come exclusively from U and not from any sibling unit type.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `/:id` is non-integer in contacts route | HTTP 400 `{ "error": "Invalid property ID" }` |
| Property not found in contacts route | HTTP 404 `{ "error": "Property not found" }` |
| DB failure in contacts route | HTTP 500 + `console.error` |
| `fetchPropertyContacts` non-2xx | Throws `Error("HTTP {status}: {responseText}")` |
| Detail screen: property not in API response | Render error + back button, no detail content |
| Detail screen: unit type not found | Render error + back button, no detail content |
| Detail screen: contacts fetch fails | Inline error notice, no navigation away |
| Book viewing: empty fields | Inline field-level error, no submission |
| Book viewing: date out of range | Inline date error, no submission |

---

## Testing Strategy

Unit tests (pure functions):
- `expandToListingItems`: count, name format, ID embedding, zero-unit-type exclusion
- Book viewing validation logic: empty name/phone/date, out-of-range date, valid submission

Integration:
- `GET /api/properties/:id/contacts`: valid ID with contacts, valid ID no contacts, non-integer ID, non-existent ID, no auth

Smoke: TypeScript compilation on all new/modified files
