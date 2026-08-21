# Requirements Document

## Introduction

This feature adds a user-togglable light/dark theme system to the Nexus Rent mobile app (React Native / Expo Router). The app currently uses a hardcoded dark theme throughout all screens. The goal is to preserve the existing dark theme exactly, introduce a complementary light theme, wire the existing "Dark Mode" toggle on the Profile screen to a persisted Zustand store, and propagate the active theme to every screen via a shared `useTheme()` hook that returns typed token objects.

## Glossary

- **Theme_Store**: The Zustand store (`store/themeStore.ts`) that holds `isDark: boolean` and exposes `toggleTheme()`. Persisted to AsyncStorage under key `'theme-storage'`.
- **Theme**: The TypeScript interface (`lib/theme.ts`) defining all design-token keys that both `darkTheme` and `lightTheme` must satisfy.
- **Dark_Theme**: The `darkTheme` token object — exact hex values that match the current hardcoded colors throughout the app.
- **Light_Theme**: The `lightTheme` token object — new high-contrast values suitable for use on light backgrounds.
- **useTheme**: The React hook exported from `lib/theme.ts` that reads `isDark` from `Theme_Store` and returns `{ theme: Theme; isDark: boolean }`.
- **Screen**: Any `.tsx` component under `app/` that renders a full-screen UI (tabs, modals, auth flows, and nested pages).
- **Token**: A single named color slot in the `Theme` interface (e.g., `bg`, `text`, `accent`).
- **Profile_Screen**: `app/(tabs)/profile.tsx` — contains the "Dark Mode" preference toggle.
- **Tab_Layout**: `app/(tabs)/_layout.tsx` — renders the bottom tab bar and its styling.
- **Ambient_Glow**: The decorative semi-transparent blobs used as background glows; their opacity must be reduced in light mode.
- **Gradient_Text**: Text rendered via `MaskedView` + `LinearGradient` (e.g., app title, screen headings); gradient colors are unchanged in light mode.
- **AsyncStorage**: The React Native key-value persistence layer used to survive app restarts.

---

## Requirements

### Requirement 1: Theme Store

**User Story:** As a developer, I want a single source of truth for the active theme preference so that every screen can read and react to theme changes consistently.

#### Acceptance Criteria

1. THE `Theme_Store` SHALL export a Zustand store created with the `persist` middleware targeting AsyncStorage under the key `'theme-storage'`.
2. THE `Theme_Store` SHALL expose a boolean state field `isDark` with a default value of `true`.
3. THE `Theme_Store` SHALL expose a `toggleTheme()` action that sets `isDark` to the logical negation of its current value.
4. WHEN the app is launched after a previous session, THE `Theme_Store` SHALL rehydrate `isDark` from AsyncStorage; screens SHALL be permitted to render with the default theme value during rehydration.
5. IF AsyncStorage does not contain a stored value for `'theme-storage'`, THEN THE `Theme_Store` SHALL initialise `isDark` to `true`.

---

### Requirement 2: Theme Token Definitions

**User Story:** As a developer, I want a typed `Theme` interface and two complete token objects so that I can reference design values by name instead of hardcoded hex strings.

#### Acceptance Criteria

1. THE `lib/theme.ts` module SHALL export a TypeScript interface named `Theme` that declares every token key listed in the Glossary section of this document.
2. THE `Theme` interface SHALL include all of the following token keys: `bg`, `bgCard`, `bgInput`, `bgInputDark`, `border`, `borderAccent`, `text`, `textSub`, `textMuted`, `textDim`, `accent`, `accentPurple`, `accentGreen`, `accentRed`, `accentWarn`, `tabBar`, `tabBarBorder`, `ambientOpacity`.
3. THE `lib/theme.ts` module SHALL export a `darkTheme` object that satisfies the `Theme` interface and uses the exact dark-mode token values specified in the architecture context.
4. THE `lib/theme.ts` module SHALL export a `lightTheme` object that satisfies the `Theme` interface and uses the exact light-mode token values specified in the architecture context.
5. WHEN a new token key is added to the `Theme` interface, THE TypeScript compiler SHALL emit a type error if either `darkTheme` or `lightTheme` does not provide a value for that key.

---

### Requirement 3: useTheme Hook

**User Story:** As a developer, I want a single `useTheme()` hook so that any screen can access the active theme tokens and the current mode flag with one import.

#### Acceptance Criteria

1. THE `lib/theme.ts` module SHALL export a `useTheme()` hook that reads `isDark` from `Theme_Store` and returns an object with shape `{ theme: Theme; isDark: boolean }`.
2. WHEN `isDark` is `true`, THE `useTheme` hook SHALL return `darkTheme` as the `theme` value.
3. WHEN `isDark` is `false`, THE `useTheme` hook SHALL return `lightTheme` as the `theme` value.
4. WHEN `toggleTheme()` is called in any component, THE `useTheme` hook SHALL cause all mounted screens that call `useTheme()` to re-render with the updated theme object within a single React render cycle.

---

### Requirement 4: Profile Screen Toggle Wiring

**User Story:** As a user, I want the "Dark Mode" toggle on the Profile screen to reflect my persisted preference and update it instantly so that my choice is saved across sessions.

#### Acceptance Criteria

1. WHEN the Profile screen mounts, THE `Profile_Screen` SHALL read `isDark` from `Theme_Store` to determine the initial visual state of the "Dark Mode" toggle.
2. WHEN the user presses the "Dark Mode" toggle, THE `Profile_Screen` SHALL call `toggleTheme()` from `Theme_Store` instead of updating local component state.
3. THE `Profile_Screen` SHALL remove the `toggles.darkMode` local state field and replace all references to it with `isDark` from `Theme_Store`.
4. WHILE `isDark` is `true`, THE "Dark Mode" toggle SHALL display in the ON (green) position.
5. WHILE `isDark` is `false`, THE "Dark Mode" toggle SHALL display in the OFF position.
6. THE toggle visual state SHALL always match the value of `isDark` from `Theme_Store`; if a temporary mismatch occurs due to render timing, THE `Profile_Screen` SHALL correct the toggle position on the next render cycle.
7. THE label of the "Dark Mode" toggle item SHALL remain "Dark Mode" regardless of the current theme.

---

### Requirement 5: Screen Theming — Auth and Unauthenticated Screens

**User Story:** As a user, I want the login, OTP, password reset, and forgot-password screens to respect my theme preference so that the app feels consistent from the moment I open it.

#### Acceptance Criteria

1. THE following screens SHALL call `useTheme()` and apply theme tokens to all background, text, card, input, and border styles: `app/login.tsx`, `app/otp.tsx`, `app/reset-password.tsx`, `app/forgot-password.tsx`.
2. WHEN `isDark` is `false`, THE backgrounds of the auth screens SHALL use `theme.bg` (`#F8FAFC`) instead of the hardcoded `#060A14`.
3. WHEN `isDark` is `false`, THE card containers on auth screens SHALL use `theme.bgCard` (`#FFFFFF`) and `theme.border` (`#E2E8F0`).
4. WHEN `isDark` is `false`, THE primary text on auth screens SHALL use `theme.text` (`#0F172A`).
5. WHEN `isDark` is `false`, THE accent color on auth screens (e.g., button borders, links) SHALL use `theme.accent` (`#0891B2`).

---

### Requirement 6: Screen Theming — Tab Screens

**User Story:** As a user, I want all main tab screens to adapt to my theme preference so that the entire authenticated experience is cohesive.

#### Acceptance Criteria

1. THE following screens SHALL call `useTheme()` and apply `theme` tokens to all hardcoded color values: `app/(tabs)/home.tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/payments.tsx`, `app/(tabs)/explore.tsx`, `app/(tabs)/alerts.tsx`.
2. WHEN `isDark` is `false`, THE container background of each tab screen SHALL use `theme.bg`.
3. WHEN `isDark` is `false`, THE card and section backgrounds SHALL use `theme.bgCard` and `theme.border`.
4. WHEN `isDark` is `false`, THE primary text SHALL use `theme.text` and secondary/muted text SHALL use `theme.textSub` and `theme.textMuted` respectively.
5. WHEN `isDark` is `false`, THE tab screens SHALL use `theme.accent` (`#0891B2`) in place of every hardcoded `#00F0FF` or `#00FFFF` value.

---

### Requirement 7: Screen Theming — Modal Screens

**User Story:** As a user, I want the edit-profile and change-password modals to match the active theme so that opening a modal does not jarr with a different color scheme.

#### Acceptance Criteria

1. THE following screens SHALL call `useTheme()` and apply `theme` tokens: `app/(modals)/edit-profile.tsx`, `app/(modals)/change-password.tsx`.
2. WHEN `isDark` is `false`, THE modal screen background SHALL use `theme.bg` and form inputs SHALL use `theme.bgInput` as their background color.
3. WHEN `isDark` is `false`, THE read-only fields in the edit-profile modal SHALL use `theme.bgInputDark` as their background color.

---

### Requirement 8: Screen Theming — Nested and Flow Screens

**User Story:** As a user, I want the audit log, chatbot, contacts, property detail, and payment flow screens to respect my theme so that every part of the app feels unified.

#### Acceptance Criteria

1. THE following screens SHALL call `useTheme()` before any conditional logic or early returns, and SHALL apply `theme` tokens to all hardcoded color values: `app/audit-trails.tsx`, `app/chatbot.tsx`, `app/contacts/index.tsx`, `app/contacts/[slug]/index.tsx`, `app/pay/method.tsx`, `app/pay/mpesa.tsx`, `app/pay/card.tsx`, `app/pay/bank.tsx`, `app/properties/[id].tsx`.
2. WHEN `isDark` is `false`, EACH of the screens listed in criterion 1 SHALL use `theme.bg` for the container background and `theme.bgCard` for card surfaces.
3. WHEN `isDark` is `false`, EACH of the screens listed in criterion 1 SHALL use `theme.text`, `theme.textSub`, and `theme.textMuted` for the appropriate text hierarchy.

---

### Requirement 9: Tab Bar Theming

**User Story:** As a user, I want the bottom tab bar to reflect the active theme so that the navigation bar does not clash with the screen background.

#### Acceptance Criteria

1. THE `Tab_Layout` SHALL call `useTheme()` and pass `theme.tabBar` and `theme.tabBarBorder` to `tabBarStyle.backgroundColor` and `tabBarStyle.borderTopColor` respectively; the hook SHALL be called on every render so that theme changes during runtime are reflected immediately.
2. WHEN `isDark` is `true`, THE `Tab_Layout` SHALL apply `tabBarActiveTintColor` equal to `theme.accent` (`#00F0FF`) and `tabBarInactiveTintColor` equal to `rgba(0,240,255,0.4)`.
3. WHEN `isDark` is `false`, THE `Tab_Layout` SHALL apply `tabBarActiveTintColor` equal to `theme.accent` (`#0891B2`) and `tabBarInactiveTintColor` equal to `rgba(8,145,178,0.4)`.
4. THE tab bar icon images SHALL remain unchanged; only tint colors SHALL change between themes.

---

### Requirement 10: Ambient Glow Behavior in Light Mode

**User Story:** As a designer, I want ambient glow blobs to be visually subtle in light mode so that the design language is preserved without overwhelming a light background.

#### Acceptance Criteria

1. THE `Theme` interface SHALL include an `ambientOpacity` token of type `number`.
2. THE `darkTheme` object SHALL set `ambientOpacity` to `0.1` (preserving current behavior).
3. THE `lightTheme` object SHALL set `ambientOpacity` to `0.04`.
4. WHEN any screen renders ambient glow blobs, THE screen SHALL use `theme.ambientOpacity` as the alpha channel of each glow blob's `backgroundColor`.

---

### Requirement 11: Gradient Text Behavior

**User Story:** As a designer, I want gradient text components (MaskedView + LinearGradient) to keep their existing cyan-to-purple gradient in both themes so that the brand identity is preserved.

#### Acceptance Criteria

1. THE `GradientText` and `GradientTitle` components on any screen SHALL retain the `["#00FFFF", "#7C3AED"]` gradient colors in both dark and light mode.
2. THE gradient colors for these components SHALL NOT be replaced with theme tokens.

---

### Requirement 12: Theme Persistence Round-Trip

**User Story:** As a user, I want my theme preference to survive app restarts so that I never have to reconfigure the theme after closing the app.

#### Acceptance Criteria

1. WHEN the user toggles the theme and then closes and reopens the app, THE `Theme_Store` SHALL restore `isDark` to the value that was active when the app was closed.
2. WHEN the app is reopened after the preference has been stored, THE first screen rendered SHALL already apply the persisted theme without a visible flash of the opposite theme.
3. FOR ALL boolean values of `isDark`, storing the value and then rehydrating it SHALL produce the identical boolean value (round-trip property).

---

### Requirement 13: Inline Style Pattern

**User Story:** As a developer, I want a clear convention for applying theme tokens to styles so that the codebase is consistent and future screens can be themed correctly.

#### Acceptance Criteria

1. WHEN a screen component uses theme-dependent color values, THE screen SHALL derive those colors from `useTheme()` using inline style objects; plain object literals are acceptable and `StyleSheet.create()` inside the component body is not required.
2. THE `useTheme()` call SHALL appear at the top of each component function body, before any conditional logic or early returns.
3. IF a screen uses `StyleSheet.create()` at module scope for non-theme-dependent values (e.g., layout, dimensions), THEN those styles MAY remain at module scope even when the same component also uses `useTheme()` for color values.
