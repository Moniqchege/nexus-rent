# Design Document: Mobile Light/Dark Theme

## Overview

This design introduces a user-togglable light/dark theme system to the Nexus Rent mobile app. The app currently uses a hardcoded dark palette throughout all 21 screens. The goal is to:

1. Introduce a typed `Theme` interface with two implementations (`darkTheme`, `lightTheme`)
2. Persist the user's preference in a Zustand store backed by AsyncStorage
3. Expose a single `useTheme()` hook that every screen uses to read the active token set
4. Wire the existing "Dark Mode" toggle on the Profile screen to the store
5. Propagate theme tokens to all screens using a consistent inline-style pattern

The dark theme values are exact mirrors of the current hardcoded colors, so screens will look identical to today when dark mode is active. Only light mode introduces visual change.

---

## Architecture

### Dependency Graph

```
AsyncStorage
    │
    ▼
store/themeStore.ts   ◄──── persisted Zustand store (isDark: boolean)
    │
    ▼
lib/theme.ts          ◄──── Theme interface, darkTheme, lightTheme, useTheme()
    │
    ├──► app/(tabs)/_layout.tsx          (tab bar colors)
    ├──► app/(tabs)/profile.tsx          (toggle wiring)
    ├──► app/(tabs)/home.tsx
    ├──► app/(tabs)/payments.tsx
    ├──► app/(tabs)/explore.tsx
    ├──► app/(tabs)/alerts.tsx
    ├──► app/(modals)/edit-profile.tsx
    ├──► app/(modals)/change-password.tsx
    ├──► app/login.tsx
    ├──► app/otp.tsx
    ├──► app/reset-password.tsx
    ├──► app/forgot-password.tsx
    ├──► app/audit-trails.tsx
    ├──► app/chatbot.tsx
    ├──► app/contacts/index.tsx
    ├──► app/contacts/[slug]/index.tsx
    ├──► app/pay/method.tsx
    ├──► app/pay/mpesa.tsx
    ├──► app/pay/card.tsx
    ├──► app/pay/bank.tsx
    └──► app/properties/[id].tsx
```

**Critical constraint:** `store/themeStore.ts` and `lib/theme.ts` must be created before any screen is modified. All screens depend on `useTheme()` from `lib/theme.ts`, which in turn depends on `useThemeStore` from `store/themeStore.ts`.

### Data Flow

```
User presses toggle
      │
      ▼
Profile.tsx calls toggleTheme()
      │
      ▼
useThemeStore.isDark flips
      │
      ├── AsyncStorage.setItem('theme-storage', ...)   [side effect via persist middleware]
      │
      └── All subscribed useTheme() calls re-render their screens
```

React's Zustand subscription model ensures all mounted screens re-render atomically in a single React commit when `isDark` changes. There is no prop-drilling or context propagation; every screen subscribes independently.

---

## Components and Interfaces

### `store/themeStore.ts`

The single source of truth for the current theme preference.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'theme-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
        removeItem: async (name) => AsyncStorage.removeItem(name),
      },
    }
  )
);
```

**Design decisions:**
- AsyncStorage key is `'theme-storage'` — distinct from `'auth-storage'` to avoid namespace collisions.
- Default `isDark: true` preserves the current dark-only experience for new installs.
- The store does not expose `setDark(boolean)` — only `toggleTheme()` — because the only UI affordance is a toggle.

---

### `lib/theme.ts`

Defines the contract all themes must satisfy and exports the two implementations plus the hook.

#### `Theme` Interface

```typescript
export interface Theme {
  bg: string;
  bgCard: string;
  bgInput: string;
  bgInputDark: string;
  border: string;
  borderAccent: string;
  text: string;
  textSub: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentPurple: string;
  accentGreen: string;
  accentRed: string;
  accentWarn: string;
  tabBar: string;
  tabBarBorder: string;
  ambientOpacity: number;
}
```

18 tokens total. TypeScript's structural typing means that if either theme object omits a key, the compiler emits a type error immediately — no runtime check needed.

#### Token Mapping

| Token | darkTheme | lightTheme | Usage |
|---|---|---|---|
| `bg` | `#060A14` | `#F8FAFC` | Screen container background |
| `bgCard` | `#111827` | `#FFFFFF` | Card, stat box, group background |
| `bgInput` | `#111827` | `#F1F5F9` | Text input background |
| `bgInputDark` | `#0D1421` | `#E2E8F0` | Read-only / darker input fields |
| `border` | `#1F2937` | `#E2E8F0` | Default border color |
| `borderAccent` | `rgba(0,240,255,0.2)` | `rgba(8,145,178,0.3)` | Accent-colored borders |
| `text` | `#FFFFFF` | `#0F172A` | Primary text |
| `textSub` | `#9CA3AF` | `#475569` | Secondary text |
| `textMuted` | `#888888` | `#64748B` | Muted / helper text |
| `textDim` | `#555555` | `#94A3B8` | Dimmed / placeholder text |
| `accent` | `#00F0FF` | `#0891B2` | Cyan accent — buttons, links, tint |
| `accentPurple` | `#7C3AED` | `#7C3AED` | Purple — unchanged across themes |
| `accentGreen` | `#00FFA3` | `#059669` | Success green |
| `accentRed` | `#FF3B81` | `#E11D48` | Error / danger red |
| `accentWarn` | `#FFB84D` | `#D97706` | Warning amber |
| `tabBar` | `rgba(6,10,20,0.98)` | `rgba(255,255,255,0.98)` | Tab bar background |
| `tabBarBorder` | `rgba(0,240,255,0.15)` | `rgba(8,145,178,0.2)` | Tab bar top border |
| `ambientOpacity` | `0.1` | `0.04` | Alpha for background glow blobs |

#### `useTheme` Hook

```typescript
export function useTheme(): { theme: Theme; isDark: boolean } {
  const isDark = useThemeStore((state) => state.isDark);
  return { theme: isDark ? darkTheme : lightTheme, isDark };
}
```

**Design decisions:**
- The hook is a thin selector wrapper. It does not introduce additional state or effects.
- Zustand's selector `(state) => state.isDark` means the hook only re-renders when `isDark` changes, not on unrelated store updates (though `ThemeState` only has two fields).
- Placing `useTheme()` at the top of the component body (before any conditionals or early returns) follows the Rules of Hooks and is enforced by Requirement 13.2.

---

### `app/(tabs)/_layout.tsx` — Tab Bar Theming

The `TabLayout` component currently hardcodes `tabBarStyle` and `tabBarActiveTintColor`. These must be made dynamic:

```typescript
export default function TabLayout() {
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();  // ← added at top of component
  // ...

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 16,
          paddingTop: 10,
          position: 'absolute',
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: isDark
          ? 'rgba(0,240,255,0.4)'
          : 'rgba(8,145,178,0.4)',
        // ...
      }}
    >
```

`useTheme()` is called unconditionally at the top of `TabLayout`, before the early `if (!user) return null` guard, so the hook always runs per Rules of Hooks.

---

### `app/(tabs)/profile.tsx` — Toggle Wiring

**Current state:** The profile screen has a local `useState` that holds `{ rentAlerts: true, darkMode: false }`. The `darkMode` key is visually connected to the toggle, but the state is never persisted.

**Changes required:**

```typescript
// Remove:
const [toggles, setToggles] = useState({ rentAlerts: true, darkMode: false });

// Add:
const isDark = useThemeStore((state) => state.isDark);
const toggleTheme = useThemeStore((state) => state.toggleTheme);
const [toggles, setToggles] = useState({ rentAlerts: true });  // darkMode removed
```

In the `preferenceItems` array, the Dark Mode item's toggle visual state must read from `isDark` not `toggles.darkMode`:

```typescript
// In the toggle render for item.key === 'darkMode':
// Was: toggles[item.key]
// Now: item.key === 'darkMode' ? isDark : toggles[item.key as keyof typeof toggles]
```

The `onPress` handler for the Dark Mode toggle must call `toggleTheme()` instead of `toggleSetting('darkMode')`.

The profile screen also receives full theming (Requirement 6), so `const { theme, isDark } = useTheme()` replaces the separate `useThemeStore` subscriptions once both are needed. Since `useTheme()` already returns `isDark`, it can be used as the single read point.

---

### Screen Theming Pattern

All 19 screens (excluding the two foundation files) follow an identical pattern:

```typescript
// 1. Import at the top of the file (alongside existing imports):
import { useTheme } from '../../lib/theme';

// 2. First line of the component function body:
const { theme, isDark } = useTheme();

// 3. Replace hardcoded colors with theme tokens in JSX inline styles:
<View style={{ flex: 1, backgroundColor: theme.bg }}>
  <Text style={{ color: theme.text }}>...</Text>
  <View style={{
    backgroundColor: theme.bgCard,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 16,
  }}>
```

For ambient glow blobs, the static `rgba` string is converted to use `ambientOpacity`:

```typescript
// Before:
backgroundColor: "rgba(124,58,237,0.1)"

// After:
backgroundColor: `rgba(124,58,237,${theme.ambientOpacity})`
```

For accent colors that were hardcoded as `#00F0FF` or `rgba(0,240,255,...)`, replace with `theme.accent` or compute dynamically:

```typescript
// Solid accent:
color: theme.accent

// Accent with fixed opacity (e.g., border):
borderColor: theme.borderAccent  // use the token if opacity matches
// Or if a custom opacity is needed and differs between themes:
borderColor: isDark ? 'rgba(0,240,255,0.3)' : 'rgba(8,145,178,0.3)'
```

**What does NOT change:**
- `LinearGradient` colors for `GradientText` / `GradientTitle` components remain `["#00FFFF", "#7C3AED"]` in both themes (Requirement 11).
- Static layout styles (padding, margin, borderRadius, dimensions, flex) can remain in `StyleSheet.create()` at module scope.

---

## Data Models

### `ThemeState`

```typescript
interface ThemeState {
  isDark: boolean;       // Persisted boolean flag
  toggleTheme: () => void;  // Action — not persisted (Zustand handles this)
}
```

Only `isDark` is serialized to AsyncStorage. The `toggleTheme` function is reconstructed by Zustand on hydration. AsyncStorage stores a JSON string under key `'theme-storage'` with shape:

```json
{
  "state": { "isDark": false },
  "version": 0
}
```

### `Theme`

See the full interface above (18 tokens). Both `darkTheme` and `lightTheme` are plain frozen object literals satisfying this interface. They are module-level constants — not created inside any component — so they are allocated once at module load time.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: toggleTheme is a pure negation

*For any* initial value of `isDark` in the Theme Store, calling `toggleTheme()` once SHALL produce `!isDark`, and calling it a second time SHALL restore the original value.

**Validates: Requirements 1.3**

---

### Property 2: Theme persistence round-trip

*For any* boolean value of `isDark`, storing it to AsyncStorage via the Theme Store and then rehydrating the store in a fresh instance SHALL produce an `isDark` value identical to the one that was stored.

**Validates: Requirements 1.4, 12.1, 12.3**

---

### Property 3: useTheme returns the correct theme for any isDark value

*For any* boolean value of `isDark` set in the Theme Store, calling `useTheme()` SHALL return `darkTheme` when `isDark` is `true` and `lightTheme` when `isDark` is `false`. No other theme object SHALL be returned.

**Validates: Requirements 3.2, 3.3**

---

### Property 4: Both theme objects fully satisfy the Theme interface

*For any* token key defined in the `Theme` interface, both `darkTheme` and `lightTheme` SHALL provide a non-undefined value for that key. Equivalently, the set of keys present on both theme objects SHALL be identical to the set of keys declared in the `Theme` interface.

**Validates: Requirements 2.2, 2.5**

---

### Property 5: Screen containers use theme.bg for any isDark value

*For any* boolean value of `isDark`, every screen listed in Requirements 5–9 SHALL render its outermost container with `backgroundColor` equal to the `bg` token of the active theme.

**Validates: Requirements 5.2, 6.2, 7.2, 8.2**

---

### Property 6: Profile toggle visual state matches isDark for any store value

*For any* boolean value of `isDark` in the Theme Store, the Dark Mode toggle in the Profile screen SHALL render in the ON position when `isDark` is `true` and the OFF position when `isDark` is `false`.

**Validates: Requirements 4.4, 4.5, 4.6**

---

### Property 7: Gradient text colors are invariant across themes

*For any* boolean value of `isDark`, `GradientText` and `GradientTitle` components SHALL always use `["#00FFFF", "#7C3AED"]` as the `LinearGradient` colors, regardless of which theme is active.

**Validates: Requirements 11.1, 11.2**

---

### Property 8: Tab bar tokens are applied for any isDark value

*For any* boolean value of `isDark`, the Tab Layout's `tabBarStyle.backgroundColor` SHALL equal `theme.tabBar` and `tabBarStyle.borderTopColor` SHALL equal `theme.tabBarBorder` for the active theme.

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 9: ambientOpacity token controls glow blob alpha

*For any* boolean value of `isDark`, the `backgroundColor` alpha of every ambient glow blob on every screen SHALL equal `theme.ambientOpacity` (0.1 for dark, 0.04 for light).

**Validates: Requirements 10.2, 10.3, 10.4**

---

## Error Handling

### AsyncStorage failures during rehydration

If AsyncStorage throws during the Zustand `persist` rehydration step (e.g., storage quota exceeded, device storage issue), the store will remain with its in-memory default of `isDark: true`. The app will function normally in dark mode. No user-visible error is shown — this is consistent with how `authStore.ts` handles the same scenario.

### AsyncStorage failures during write

Zustand's `persist` middleware calls `storage.setItem` as a fire-and-forget side effect after each state update. If the write fails, the in-memory state is already updated, so the UI reflects the toggle immediately. On the next app launch, the previous persisted value (or the default) will be restored. The user's toggle action is not rolled back.

### Partial AsyncStorage data

If AsyncStorage contains a `'theme-storage'` key with a malformed or partial JSON value (e.g., from a previous version), `JSON.parse` will either succeed partially or throw. In the throw case, the `getItem` function returns `null`, and Zustand treats this as "no stored value" — the default `isDark: true` is used. This is safe and graceful.

### TypeScript type errors

If a developer adds a token to the `Theme` interface but forgets to add it to one of the theme objects, TypeScript will emit a compile-time error. This is a zero-runtime-cost correctness guarantee.

---

## Testing Strategy

This feature involves a mix of pure logic (store behavior, theme selection, token values) and UI rendering (screen styles, toggle state). The testing approach combines property-based tests for universal behaviors and example-based unit tests for specific configurations.

### Property-Based Testing

**Library:** [fast-check](https://github.com/dubzzz/fast-check) — the standard PBT library for TypeScript/JavaScript, suitable for testing pure store logic and data-layer behavior without requiring a native test runner.

**Minimum iterations:** 100 per property test.

**Property tests to implement:**

| Property | fast-check Arbitraries | What to assert |
|---|---|---|
| P1: toggleTheme is pure negation | `fc.boolean()` for initial state, `fc.integer({ min: 1, max: 20 })` for n toggles | `isDark === (initial XOR (n % 2 === 1))` |
| P2: Persistence round-trip | `fc.boolean()` for isDark value | Stored → rehydrated value equals original |
| P3: useTheme returns correct theme | `fc.boolean()` for isDark | Returns `darkTheme` iff `isDark === true` |
| P4: Theme interface completeness | Token key list | Both theme objects have defined values for all keys |
| P5: Screen container uses theme.bg | `fc.boolean()` for isDark, each screen | `backgroundColor === theme.bg` |
| P6: Toggle visual matches isDark | `fc.boolean()` for isDark | Toggle rendered position matches isDark |
| P7: Gradient colors invariant | `fc.boolean()` for isDark | LinearGradient always `["#00FFFF", "#7C3AED"]` |
| P8: Tab bar tokens applied | `fc.boolean()` for isDark | tabBarStyle uses theme.tabBar / theme.tabBarBorder |
| P9: ambientOpacity controls alpha | `fc.boolean()` for isDark | Blob alpha equals `theme.ambientOpacity` |

**Tag format:** `// Feature: mobile-light-dark-theme, Property N: <description>`

**Note on P5, P6, P7, P8, P9:** These properties test React rendering behavior and require a test renderer (e.g., `@testing-library/react-native`). fast-check is used to drive the `isDark` input; the rendering assertions use React Native Testing Library.

### Unit / Example-Based Tests

| Criterion | Test |
|---|---|
| 1.2 Default isDark is true | `getState().isDark === true` with empty AsyncStorage |
| 1.5 Missing storage defaults to true | Mock AsyncStorage to return null, verify isDark === true |
| 2.3 darkTheme exact values | Assert `darkTheme.bg === '#060A14'`, `darkTheme.accent === '#00F0FF'`, etc. |
| 2.4 lightTheme exact values | Assert `lightTheme.bg === '#F8FAFC'`, `lightTheme.accent === '#0891B2'`, etc. |
| 3.1 useTheme return shape | Verify returned object has `theme` (object) and `isDark` (boolean) fields |
| 3.4 useTheme re-renders on toggle | Render component, toggle, verify re-render |
| 4.2 Profile reads isDark from store | Render Profile, verify toggle state matches store |
| 4.7 Label is "Dark Mode" | Verify label text is always "Dark Mode" |

### Integration Tests

| Concern | Test |
|---|---|
| Toggle surviving app restart | Set isDark to false → simulate app close → reopen → verify isDark is false |
| Tab bar re-themes on toggle | Render TabLayout, toggle theme, verify tabBarStyle updates |

### What NOT to unit test

- TypeScript type completeness (verified at compile time)
- `StyleSheet.create()` migration completeness (verified by code review)
- Exact pixel rendering of glow blobs (covered by the ambientOpacity property test)

### Testing exclusions

Property-based testing is **not** used for:
- AsyncStorage connectivity or device storage capacity (integration/smoke tests only)
- Gradient text color correctness beyond the P7 property (two-value space makes PBT equivalent to exhaustive testing)
