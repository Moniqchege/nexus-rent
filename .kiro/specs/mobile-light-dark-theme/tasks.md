# Implementation Plan: Mobile Light/Dark Theme

## Overview

Introduce a persisted light/dark theme system across all 21 screens. The dark theme is unchanged — it matches the current hardcoded values exactly. Light mode uses a clean high-contrast palette. A Zustand store backed by AsyncStorage persists the user's choice across restarts. Every screen consumes a `useTheme()` hook that returns typed token objects.

---

## Tasks

- [ ] 1. Create `mobile/store/themeStore.ts`
  - Create the file with a Zustand `persist` store
  - State: `isDark: boolean` defaulting to `true`
  - Action: `toggleTheme()` — flips `isDark`
  - Persist to AsyncStorage under key `'theme-storage'` using the same storage adapter pattern as `authStore.ts`
  - Export `useThemeStore`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Create `mobile/lib/theme.ts`
  - Export `Theme` interface with 18 token keys: `bg`, `bgCard`, `bgInput`, `bgInputDark`, `border`, `borderAccent`, `text`, `textSub`, `textMuted`, `textDim`, `accent`, `accentPurple`, `accentGreen`, `accentRed`, `accentWarn`, `tabBar`, `tabBarBorder`, `ambientOpacity`
  - Export `darkTheme: Theme` with exact current app colors (bg: `#060A14`, bgCard: `#111827`, accent: `#00F0FF`, etc.)
  - Export `lightTheme: Theme` with new light values (bg: `#F8FAFC`, bgCard: `#FFFFFF`, accent: `#0891B2`, etc.)
  - Export `useTheme()` hook that reads `isDark` from `useThemeStore` and returns `{ theme, isDark }`
  - Import `useThemeStore` from `../store/themeStore`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Update `mobile/app/(tabs)/_layout.tsx` — tab bar theming
  - Import `useTheme` from `../../lib/theme`
  - Call `const { theme, isDark } = useTheme();` at the TOP of `TabLayout` component body, BEFORE the `if (!user) return null` guard (Rules of Hooks)
  - Replace hardcoded `tabBarStyle.backgroundColor` (`rgba(6,10,20,0.98)`) with `theme.tabBar`
  - Replace hardcoded `tabBarStyle.borderTopColor` (`rgba(0,240,255,0.15)`) with `theme.tabBarBorder`
  - Replace hardcoded `tabBarActiveTintColor` (`#00F0FF`) with `theme.accent`
  - Replace hardcoded `tabBarInactiveTintColor` (`rgba(0,240,255,0.4)`) with `isDark ? 'rgba(0,240,255,0.4)' : 'rgba(8,145,178,0.4)'`
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 4. Update `mobile/app/(tabs)/profile.tsx` — toggle wiring + full theming
  - Import `useTheme` from `../../lib/theme` and `useThemeStore` from `../../store/themeStore`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Wire Dark Mode toggle: read `isDark` from store; call `toggleTheme()` on press (remove `toggles.darkMode` from local state)
  - Remove `darkMode` key from the `toggles` useState — keep only `rentAlerts`
  - Update `preferenceItems` Dark Mode entry to use `isDark` for its toggle value and `toggleTheme()` for its handler
  - Apply `theme.bg` to container, `theme.bgCard` to cards, `theme.text` / `theme.textMuted` to text, `theme.border` to borders, `theme.accent` to accents
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5. Update `mobile/app/(tabs)/home.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Replace `backgroundColor: "#060A14"` (container) with `theme.bg`
  - Replace ambient glow blob colors: `rgba(124,58,237,0.1)` → `rgba(124,58,237,${theme.ambientOpacity})`, same for cyan glow
  - Replace card backgrounds (`#111827`) with `theme.bgCard`
  - Replace border colors (`#1F2937`) with `theme.border`
  - Replace `#fff` / `#E5E7EB` text with `theme.text`, muted text (`#888`, `#9CA3AF`) with `theme.textMuted` / `theme.textSub`
  - Replace `#00F0FF` / `#00FFFF` accent colors with `theme.accent`
  - Header avatar border color: use `theme.borderAccent`
  - GradientText/GradientTitle: keep `["#00FFFF", "#7C3AED"]` unchanged
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.4, 11.1_

- [ ] 6. Update `mobile/app/(tabs)/payments.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Replace `backgroundColor: "#060A14"` container with `theme.bg`
  - Replace ambient glow: `rgba(0,255,163,0.07)` → `rgba(0,255,163,${theme.ambientOpacity})`
  - Replace `#111827` card backgrounds with `theme.bgCard`
  - Replace `#1F2937` borders with `theme.border`
  - Replace text colors: `#fff` → `theme.text`, `#888` → `theme.textMuted`
  - Replace `#00FFFF` accent references with `theme.accent`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Update `mobile/app/(tabs)/explore.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Replace `backgroundColor: "#060A14"` container with `theme.bg`
  - Replace ambient glow: `rgba(0,240,255,0.08)` → `rgba(0,240,255,${theme.ambientOpacity})`
  - Replace `#111827` card backgrounds (`featuredCard`, `listCard`) with `theme.bgCard`
  - Replace `#1F2937` / `#222` borders with `theme.border`
  - Replace `#888`, `#9CA3AF` muted text with `theme.textMuted`
  - Replace search bar `#1F2937` background with `theme.bgCard`, border with `theme.border`
  - Replace area chip `#1F2937` background with `theme.bgCard`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Update `mobile/app/(tabs)/alerts.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Replace container background, card backgrounds, text colors, borders, and accent colors with theme tokens
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Update `mobile/app/(modals)/edit-profile.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component (before any hooks/state)
  - Replace `#060A14` container with `theme.bg`
  - Replace `#111827` inputs with `theme.bgInput`
  - Replace `#0D1421` read-only field with `theme.bgInputDark`
  - Replace `#1F2937` borders with `theme.border`
  - Replace `#fff` text with `theme.text`, `#555` with `theme.textDim`, `#888` with `theme.textMuted`, `#444` with `theme.textDim`
  - Replace `#00F0FF` accent (back icon tint, @ prefix, button border/text) with `theme.accent`
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10. Update `mobile/app/(modals)/change-password.tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component (before any hooks/state)
  - Replace `#060A14` container with `theme.bg`
  - Replace `#111827` input row backgrounds with `theme.bgInput`
  - Replace `#1F2937` borders with `theme.border`
  - Replace `#fff` text with `theme.text`, `#888` with `theme.textMuted`, `#555` with `theme.textDim`
  - Replace `#00F0FF` / `#00FFFF` accent (back icon tint, button border/text, eye icon) with `theme.accent`
  - Replace `#00FFA3` success text with `theme.accentGreen`
  - Replace `#FF3B81` error text with `theme.accentRed`
  - Hero icon circle: `#111827` bg → `theme.bgCard`, `#1F2937` border → `theme.border`
  - _Requirements: 7.1, 7.2_

- [ ] 11. Update `mobile/app/login.tsx`
  - Add `import { useTheme } from '../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of `Login` component
  - Replace `#060A14` container with `theme.bg`
  - Replace glow blobs: `rgba(124,58,237,0.1)` → `rgba(124,58,237,${theme.ambientOpacity})` etc.
  - Replace `#111827` card background with `theme.bgCard`, `#1F2937` border with `theme.border`
  - Replace `#0d1520` input background with `theme.bgInput`
  - Replace `#E5E7EB` / primary text with `theme.text`, `#9CA3AF` with `theme.textSub`, `#4B5563` with `theme.textDim`
  - Replace `#00F0FF` accent with `theme.accent`
  - GradientText component: keep `["#00FFFF", "#7C3AED"]` unchanged
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.4, 11.1_

- [ ] 12. Update `mobile/app/otp.tsx`
  - Add `import { useTheme } from '../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply theme tokens to container, card, inputs, text, borders, and accents
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. Update `mobile/app/reset-password.tsx`
  - Add `import { useTheme } from '../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply theme tokens to container, card, inputs, text, borders, and accents
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14. Update `mobile/app/forgot-password.tsx`
  - Add `import { useTheme } from '../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply theme tokens to container, card, inputs, text, borders, and accents
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15. Update `mobile/app/audit-trails.tsx`
  - Add `import { useTheme } from './lib/theme';` (adjust relative path)
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply `theme.bg`, `theme.bgCard`, `theme.text`, `theme.textMuted`, `theme.border`, `theme.accent` throughout
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 16. Update `mobile/app/chatbot.tsx`
  - Add `import { useTheme } from './lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply theme tokens to container, message bubbles, input, text colors
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 17. Update contacts screens — `mobile/app/contacts/index.tsx` and `mobile/app/contacts/[slug]/index.tsx`
  - Add `import { useTheme } from '../../lib/theme';` in each file
  - Call `const { theme, isDark } = useTheme();` at top of each component
  - Apply `theme.bg`, `theme.bgCard`, `theme.text`, `theme.textMuted`, `theme.border`, `theme.accent` throughout
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 18. Update payment flow screens — `mobile/app/pay/method.tsx`, `pay/mpesa.tsx`, `pay/card.tsx`, `pay/bank.tsx`
  - Add `import { useTheme } from '../../lib/theme';` in each file
  - Call `const { theme, isDark } = useTheme();` at top of each component
  - Apply theme tokens to container, cards, buttons, text, borders throughout each screen
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 19. Update `mobile/app/properties/[id].tsx`
  - Add `import { useTheme } from '../../lib/theme';`
  - Call `const { theme, isDark } = useTheme();` at top of component
  - Apply `theme.bg`, `theme.bgCard`, `theme.text`, `theme.textMuted`, `theme.border`, `theme.accent` throughout
  - GradientTitle: keep `["#00FFFF", "#7C3AED"]` unchanged
  - _Requirements: 8.1, 8.2, 8.3, 11.1_

---

## Notes

- Tasks 1 and 2 MUST be completed before any other task — all screens depend on `useTheme()` from `lib/theme.ts`
- Task 3 (tab bar) MUST be completed before Task 4 (profile toggle) because the tab bar needs to be themed before the toggle that controls it is wired
- Tasks 5–19 can run in parallel once Task 2 is complete
- Never replace the `["#00FFFF", "#7C3AED"]` gradient colors inside `GradientText` / `GradientTitle` / `MaskedView` components — these are brand colors that look good on both backgrounds
- Ambient glow opacity pattern: `rgba(R,G,B,${theme.ambientOpacity})` — NOT a static string
- `useTheme()` MUST be called before any early returns in the component (Rules of Hooks)
- Import path depth varies: tab screens use `../../lib/theme`, top-level screens use `../lib/theme`, nested screens use `../../lib/theme`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3"] },
    { "id": 2, "tasks": ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"] }
  ]
}
```
