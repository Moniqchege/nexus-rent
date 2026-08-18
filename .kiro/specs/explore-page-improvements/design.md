# Design Document

## Feature: Explore Page Improvements

---

## Overview

The Explore screen (`mobile/app/(tabs)/explore.tsx`) is a property-discovery UI that currently suffers from four defects: it only shows properties the signed-in user already owns or belongs to, its search bar is decorative (state is never wired), its area chips are hardcoded strings, and rent prices render as "NaN" because the mapping function reads a `price` field that does not exist on the backend response.

This design covers the full stack of changes required to fix all four defects:

1. A new `GET /api/properties/all` backend endpoint that bypasses ownership filtering.
2. An updated `Property` TypeScript interface that mirrors the real backend shape (replaces phantom `price/beds/baths/sqft` with `unitTypes[]`).
3. A `fetchAllProperties(token)` API-client method.
4. A `propertyToListing` rewrite that derives `Starting_Price` from `unitTypes[].price`.
5. A functional `searchQuery` filter wired to the `TextInput`.
6. Dynamic area chips derived from real property locations, combined with the search filter.

No database schema changes are needed. The Prisma `UnitType` model already carries `price`, `baths`, `type`, and `totalUnits`.

---

## Architecture

The change touches three layers:

```
┌─────────────────────────────────────────────────────┐
│  mobile/app/(tabs)/explore.tsx  (React Native)       │
│  – state: properties, searchQuery, selectedArea      │
│  – derived: filteredListings, areaChips              │
│  – renders: featured cards, chip row, listing cards  │
└─────────────────┬───────────────────────────────────┘
                  │ fetchAllProperties(token)
┌─────────────────▼───────────────────────────────────┐
│  mobile/lib/api.ts                                   │
│  – GET {API_BASE}/api/properties/all                 │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP GET /api/properties/all
┌─────────────────▼───────────────────────────────────┐
│  backend/src/routes/properties.ts                    │
│  – router.get('/all', requireAuth, handler)          │
│  – registered BEFORE /:id to avoid path collision    │
└─────────────────┬───────────────────────────────────┘
                  │ prisma.property.findMany()
┌─────────────────▼───────────────────────────────────┐
│  MySQL via Prisma (no schema change required)        │
└─────────────────────────────────────────────────────┘
```

Data flow:

1. `Explore` mounts → calls `loadProperties()`.
2. `loadProperties` calls `api.fetchAllProperties(token)` → `GET /api/properties/all`.
3. Backend queries all properties with `unitTypes`, ordered by `createdAt desc`, returns JSON array.
4. Screen stores raw `Property[]` in `properties` state.
5. On every render, two pure derivations run:
   - `areaChips` — `["All Areas", ...deduped locations]`
   - `filteredListings` — `properties` filtered by `searchQuery` AND `selectedArea`
6. `filteredListings` is mapped through `propertyToListing` before rendering.

---

## Components and Interfaces

### Backend: `/all` route handler

**File:** `backend/src/routes/properties.ts`

```typescript
// GET /api/properties/all — must be registered BEFORE /:id
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
          select: {
            id: true,
            type: true,
            baths: true,
            price: true,
            totalUnits: true,
          },
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

**Route registration order** in `properties.ts`:

```
router.get('/',       requireAuth, ...)   // existing
router.post('/',      requireAuth, ...)   // existing
router.get('/amenities', requireAuth, ...) // existing
router.get('/all',    requireAuth, ...)   // NEW — before /:id
router.get('/:id',    requireAuth, ...)   // existing
...
```

Express matches routes top-to-bottom. Placing `/all` after `/:id` would cause the string `"all"` to be parsed as a numeric ID (which fails silently or returns 404).

---

### TypeScript: Updated `Property` type

**File:** `mobile/types/property.ts`

```typescript
export interface UnitType {
  id: number;
  type: string;
  price: number;
  baths: number;
  totalUnits: number;
}

export interface Property {
  id: number;
  title: string;
  location: string;
  status: string;
  amenities?: string[] | null;
  image?: string | null;
  floors?: string | null;
  score?: number | null;
  rating?: number | null;
  createdAt: string;
  updatedAt?: string;
  landlord?: { id: number; name: string } | null;
  unitTypes: UnitType[];
}
```

Removed: `price`, `beds`, `baths`, `sqft` — these fields are not present in any backend response and were the root cause of the NaN defect.

---

### API Client: `fetchAllProperties`

**File:** `mobile/lib/api.ts`

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

This mirrors the pattern already used by `fetchProperties`, keeping the API client consistent.

---

### Explore Screen: Core Logic Changes

**File:** `mobile/app/(tabs)/explore.tsx`

#### State

```typescript
const [properties, setProperties]       = useState<Property[]>([]);
const [searchQuery, setSearchQuery]     = useState('');
const [selectedArea, setSelectedArea]   = useState('All Areas');
const [loading, setLoading]             = useState(true);
const [refreshing, setRefreshing]       = useState(false);
const [error, setError]                 = useState('');
```

`featured` and `listings` as separate pre-mapped state are removed in favour of a single `properties` state with derived values computed inline on each render.

#### `loadProperties`

```typescript
const loadProperties = async () => {
  if (!token) return;
  setRefreshing(true);
  try {
    setError('');
    const data = await api.fetchAllProperties(token);
    setProperties(data);
    setSelectedArea('All Areas');   // reset on re-fetch (Req 6.9)
  } catch (err: any) {
    setError(err.message);
  } finally {
    setRefreshing(false);
    setLoading(false);
  }
};
```

#### `propertyToListing` — price derivation

```typescript
const deriveStartingPrice = (unitTypes: UnitType[]): string => {
  const prices = (unitTypes ?? [])
    .map(u => u.price)
    .filter(p => Number.isFinite(p));
  if (prices.length === 0) return 'N/A';
  return `Ksh${Math.round(Math.min(...prices))}`;
};

const propertyToListing = (p: Property): ListingItem => ({
  icon: getIconFromLocation(p.location),
  price: deriveStartingPrice(p.unitTypes),
  area: p.location,
  name: p.title,
  ai: Math.round(p.score ?? 75),
  beds: p.unitTypes.length > 0 ? `${p.unitTypes[0].type}` : 'N/A',
  baths: p.unitTypes.length > 0 ? `${p.unitTypes[0].baths} Baths` : 'N/A',
  size: `${p.unitTypes.length} unit type${p.unitTypes.length !== 1 ? 's' : ''}`,
  color: getColorFromScore(p.score ?? undefined),
  gradientColors: ['#0f2027', '#203a43'] as [string, string],
});
```

`beds` and `baths` tags now surface the first unit-type's data rather than non-existent top-level fields.

#### Area chips — derived

```typescript
const areaChips = useMemo((): string[] => {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of properties) {
    const key = p.location.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p.location);   // preserve original casing of first occurrence
    }
  }
  return ['All Areas', ...unique];
}, [properties]);
```

#### Combined filter — derived

```typescript
const filteredProperties = useMemo((): Property[] => {
  const q = searchQuery.trim().toLowerCase();
  return properties.filter(p => {
    const matchesSearch =
      q === '' ||
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    const matchesArea =
      selectedArea === 'All Areas' ||
      p.location.toLowerCase() === selectedArea.toLowerCase();
    return matchesSearch && matchesArea;
  });
}, [properties, searchQuery, selectedArea]);
```

Featured cards take the first 3 of `filteredProperties`; all-listings renders the full `filteredProperties`.

#### Search TextInput wiring

```tsx
<TextInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Westlands, Nairobi..."
  placeholderTextColor="#9CA3AF"
  style={{ flex: 1, color: '#fff', paddingVertical: 8 }}
/>
```

#### Empty state

```tsx
{filteredProperties.length === 0 && (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>No properties found</Text>
  </View>
)}
```

---

## Data Models

### Backend response shape for `/all`

```json
[
  {
    "id": 1,
    "title": "Westlands Heights",
    "location": "Westlands",
    "status": "active",
    "image": null,
    "amenities": ["wifi", "parking"],
    "floors": "5",
    "createdAt": "2026-07-01T10:00:00.000Z",
    "unitTypes": [
      { "id": 10, "type": "Studio", "baths": 1, "price": 25000, "totalUnits": 8 },
      { "id": 11, "type": "1BR",    "baths": 1, "price": 35000, "totalUnits": 4 }
    ]
  }
]
```

`Starting_Price` for this property: `Math.min(25000, 35000)` = 25000 → displayed as `Ksh25000/mo`.

### `ListingItem` (internal, not persisted)

| Field            | Type                         | Derivation                                      |
|------------------|------------------------------|-------------------------------------------------|
| `price`          | `string`                     | `deriveStartingPrice(p.unitTypes)` — `"Ksh…"` or `"N/A"` |
| `area`           | `string`                     | `p.location`                                    |
| `name`           | `string`                     | `p.title`                                       |
| `ai`             | `number`                     | `Math.round(p.score ?? 75)`                     |
| `beds`           | `string`                     | First unit-type label                           |
| `baths`          | `string`                     | First unit-type baths                           |
| `size`           | `string`                     | Count of unit types                             |
| `color`          | `ColorKey`                   | `getColorFromScore(p.score)`                    |
| `gradientColors` | `[string, string]`           | Static gradient pair                            |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: All-properties endpoint returns all records regardless of ownership

*For any* set of properties in the database belonging to any landlords, a request to `GET /api/properties/all` from any authenticated user SHALL return all properties, including those the requesting user does not own or belong to.

**Validates: Requirements 1.2**

---

### Property 2: Response shape completeness

*For any* property returned by `GET /api/properties/all`, the response object SHALL contain all required top-level fields (`id`, `title`, `location`, `status`, `image`, `amenities`, `floors`, `createdAt`, `unitTypes`) and each `unitTypes` entry SHALL contain (`id`, `type`, `baths`, `price`, `totalUnits`).

**Validates: Requirements 1.3**

---

### Property 3: Results ordered by createdAt descending

*For any* non-empty array of properties returned by `GET /api/properties/all`, for every consecutive pair `(a, b)` in the array, `a.createdAt >= b.createdAt`.

**Validates: Requirements 1.6**

---

### Property 4: fetchAllProperties error message format

*For any* non-2xx HTTP response status code (excluding 401) and any response body text, `fetchAllProperties` SHALL throw an `Error` whose message exactly equals `"HTTP {status}: {responseText}"`.

**Validates: Requirements 3.5**

---

### Property 5: deriveStartingPrice — valid unitTypes

*For any* non-empty array of `UnitType` objects where at least one has a finite numeric `price`, `deriveStartingPrice` SHALL return `"Ksh" + Math.round(Math.min(...prices)).toString()`.

**Validates: Requirements 4.1, 4.3**

---

### Property 6: deriveStartingPrice — empty or invalid unitTypes

*For any* input where `unitTypes` is an empty array, undefined, or contains only non-finite `price` values, `deriveStartingPrice` SHALL return the string `"N/A"`.

**Validates: Requirements 4.2**

---

### Property 7: Search filter correctness

*For any* array of `Property` objects and any non-empty, non-whitespace search query string `q`, every item in `filteredProperties` SHALL satisfy: `title.toLowerCase().includes(q.trim().toLowerCase())` OR `location.toLowerCase().includes(q.trim().toLowerCase())`. No item that fails both conditions SHALL appear in the result.

**Validates: Requirements 5.2**

---

### Property 8: Whitespace query returns all listings

*For any* array of `Property` objects and any string composed entirely of whitespace characters, `filteredProperties` SHALL equal the full unfiltered array.

**Validates: Requirements 5.3**

---

### Property 9: Area chip list derivation

*For any* array of `Property` objects, the derived `areaChips` array SHALL satisfy all of: (a) `areaChips[0] === "All Areas"`, (b) every subsequent entry appears as a `location` in the property array, (c) no two entries in the chip list are equal under case-insensitive comparison, and (d) the original casing of the first occurrence of each location is preserved.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 10: Area filter correctness

*For any* array of `Property` objects and any selected area string other than `"All Areas"`, every item in the area-filtered result SHALL satisfy `item.location.toLowerCase() === selectedArea.toLowerCase()`. No item that fails this condition SHALL appear in the result.

**Validates: Requirements 6.4**

---

### Property 11: Combined filter (search + area)

*For any* array of `Property` objects, any search query `q`, and any selected area `a`, every item in `filteredProperties` SHALL independently satisfy both the search-filter condition (Property 7 / Property 8) and the area-filter condition (Property 10). No item that fails either condition SHALL appear.

**Validates: Requirements 5.4, 6.6**

*Note: Properties 7, 8, and 10 are logically subsumed by Property 11 for the combined filter function. They are retained as separate properties because they test isolated pure functions (`deriveStartingPrice`, the search predicate, and the area predicate) independently of the combined render path.*

---

## Error Handling

| Scenario | Layer | Response / Behaviour |
|---|---|---|
| Database error on `/all` | Backend | HTTP 500 `{ "error": "Failed to fetch properties" }` + `console.error` |
| Missing / invalid auth token | Backend (`requireAuth`) | HTTP 401 with existing middleware error body |
| `fetchAllProperties` receives 401 | API client | throws `Error("Unauthorized")` |
| `fetchAllProperties` receives other non-2xx | API client | throws `Error("HTTP {status}: {text}")` |
| Network failure in `loadProperties` | Explore screen | sets `error` state; screen renders error message via existing `error` state |
| `property.unitTypes` is empty / undefined | `deriveStartingPrice` | returns `"N/A"` — never throws |
| `property.unitTypes` has non-finite prices | `deriveStartingPrice` | filters out non-finite values; falls back to `"N/A"` if none remain |
| `filteredProperties` is empty | Explore screen | renders `"No properties found"` empty state |

---

## Testing Strategy

### Unit Tests

Focus on the pure helper functions extracted from the screen logic:

- `deriveStartingPrice`: test with empty array, undefined, all-NaN prices, mixed finite/non-finite, single entry, multiple entries.
- `buildAreaChips` (extracted from `useMemo`): test empty properties, single property, properties with duplicate locations in varying cases, large sets.
- `applyFilters` (the combined predicate): test all-pass (empty query + All Areas), search-only, area-only, combined, empty-result cases.
- `fetchAllProperties`: mock `fetch` to test 200 path, 401 path, 500 path, network error.
- Backend `/all` handler: use supertest with a mocked Prisma client to test 200, 401, 500.

### Property-Based Tests

Use **fast-check** (for TypeScript/React Native) or **jest-fast-check** to run a minimum of **100 iterations** per property test.

Each property test is tagged with a comment in the format:
`// Feature: explore-page-improvements, Property {N}: {property_text}`

**Properties to implement as PBT:**

| Property | Function under test | Generator inputs |
|---|---|---|
| P5 – deriveStartingPrice valid | `deriveStartingPrice` | `fc.array(fc.record({ price: fc.float({ noNaN: true, noDefaultInfinity: true }) }), { minLength: 1 })` |
| P6 – deriveStartingPrice invalid | `deriveStartingPrice` | empty arrays, arrays with `NaN`/`Infinity` prices |
| P7 – Search filter correctness | `applyFilters` | `fc.array(propertyArb)`, `fc.string({ minLength: 1 })` |
| P8 – Whitespace query | `applyFilters` | `fc.array(propertyArb)`, `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P9 – Area chip derivation | `buildAreaChips` | `fc.array(propertyArb)` |
| P10 – Area filter | `applyFilters` | `fc.array(propertyArb)`, area string drawn from property locations |
| P11 – Combined filter | `applyFilters` | `fc.array(propertyArb)`, query + area combos |
| P3 – Ordering (backend) | query result | `fc.array(propertyArb, { minLength: 2 })` with varied `createdAt` |
| P4 – Error message format | `fetchAllProperties` | `fc.integer({ min: 402, max: 599 })`, `fc.string()` |

### Integration Tests

- `GET /api/properties/all` with a real (or in-memory SQLite via Prisma) database seeded with properties owned by different users: verify all are returned.
- `GET /api/properties/all` with no token: verify 401.
- `GET /api/properties/all` when DB throws: verify 500 body.

### Smoke Tests (TypeScript Compilation)

- `mobile/types/property.ts` compiles without `price`, `beds`, `baths`, `sqft` fields.
- Accessing `p.price` on a `Property` is a TypeScript compile error.
- `fetchAllProperties` return type is `Promise<Property[]>`.
- `GET /api/properties/all` route responds to an authenticated request.
