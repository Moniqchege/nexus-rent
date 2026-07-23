# Implementation Plan: AI Intelligence Overhaul

## Overview

Seven surgical changes: three backend bug fixes in `ai.ts`, three frontend UI additions surfacing existing AI endpoints, and one mobile wiring task. All tasks are fully independent and can be executed in parallel. No new endpoints, services, or database schemas are needed.

## Tasks

- [x] 1. Fix anomaly detection: extend window to 90 days and scope the record guard to the window
  - In `backend/src/routes/ai.ts`, locate the anomaly detection block (around line 161)
  - Change the cutoff from `cutOff.getDate() - 60` to `cutOff.getDate() - 90`
  - After filtering to `windowRecords`, move the `< 3` guard to check `windowRecords.length < 3` instead of `list.length < 3`
  - Compute mean, variance, and stdDev using only `windowRecords` amounts; also iterate `windowRecords` in the spike-check loop
  - _Requirements: 6.2, 6.3_

- [x] 2. Fix lease renewal query window: correct the day offsets to 60–90
  - In `backend/src/routes/ai.ts`, locate the `minEnd` / `maxEnd` date construction (around line 242)
  - Change `today.getDate() + 50` to `today.getDate() + 60` for `minEnd`
  - Change `today.getDate() + 100` to `today.getDate() + 90` for `maxEnd`
  - _Requirements: 10.1_

- [x] 3. Fix notification draft endpoint: add JSON schema validation after JSON.parse
  - In `backend/src/routes/ai.ts`, locate the notification draft handler's `JSON.parse` call
  - After `const parsed = JSON.parse(cleanedJson)`, add a validation block: check `typeof parsed.title === 'string' && parsed.title.trim().length > 0 && typeof parsed.message === 'string' && parsed.message.trim().length > 0`
  - If the check fails, `throw new Error('LLM response missing required title or message fields')` so execution falls into the existing `catch` block and triggers the local template fallback
  - Do not change the catch block or the fallback logic — only add the guard inside the try block
  - _Requirements: 9.3_

- [x] 4. Add AI Financial Audit Alerts widget to the expenses page
  - Open `frontend/app/payments/expenses/page.tsx`
  - Add `anomalies`, `anomalyLoading`, and `anomalyError` state variables; on mount fetch `GET /api/ai/expenses/anomalies`
  - Position the widget below the existing metrics/chart section — the widget must not affect the expense table or filters above it
  - While loading, render a spinner; on empty array, render "No anomalies detected"; on error, render an error message
  - Sort results client-side: CRITICAL first, then WARNING; display at most 50 items
  - Each row shows: a two-toned severity badge (distinct styles for CRITICAL vs WARNING), the `propertyTitle`, the `message`, and `confidenceScore` formatted as a decimal (e.g., 0.88)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 5. Add AI Writing Assistant collapsible panel to SendNotifications
  - Open `frontend/app/components/notifications/SendNotifications.tsx`
  - Add local state: `aiPanelOpen` (boolean), `aiTemplateType` (string), `aiContext` (string, max 500 chars), `aiGenerating` (boolean), `aiError` (string | null)
  - Render the collapsible panel inside the Compose Message column, above the existing title and message fields; a chevron button toggles open/closed
  - Inside the panel: a template type `<select>` with options "Rent Increase", "Maintenance Outage", "Survey"; a `<textarea>` for free-text context capped at 500 chars
  - The generate button is disabled when `aiTemplateType` is falsy or `aiContext.trim()` is empty, and also while `aiGenerating` is true
  - On click, POST `{ templateType: aiTemplateType, landlordInput: aiContext }` to `/api/ai/notifications/draft`
  - On success, call the existing `setTitle(draft.title)` and `setMessage(draft.message)` state setters; on failure, set `aiError` and display it inline inside the panel without touching the form fields
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 6. Add AI Renewal Assistant panel to the leases page
  - Open `frontend/app/leases/page.tsx`
  - Add `renewals`, `renewalLoading`, and `renewalError` state variables; on mount fetch `GET /api/ai/leases/renewals`
  - Render the panel above the existing `DynamicTable`; table must remain visible and unaffected by panel errors
  - While loading, show a loading indicator; on empty array, show "No renewals due in the next 60–90 days"; on error, show an error message
  - For each record display: tenant name, property title, tenure as `{tenureMonths} months`, a risk badge using the precedence rule — amber if `isFlightRisk`, red if `!isFlightRisk && riskCategory === "High"`, green otherwise — and the `incentive` text
  - Quick-action button navigates to `/notifications/send?tenant={tenantName}&template=Lease+Renewal`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 7. Wire FloatingBotButton into the mobile profile tab
  - Open `mobile/app/(tabs)/profile.tsx`
  - Import `FloatingBotButton` from `profilebot.tsx` (resolve the correct relative import path)
  - Render `<FloatingBotButton />` inside the profile screen's root view so it appears as a floating button overlaid on the profile tab
  - Verify the button is visible and tapping it navigates to `/chatbot` as already implemented in `profilebot.tsx`
  - _Requirements: 13.1, 13.2, 13.3_

## Notes

- Tasks 1, 2, and 3 are backend-only and touch only `backend/src/routes/ai.ts`; they are fully independent of each other and can run in parallel
- Tasks 4, 5, and 6 are frontend-only Next.js additions; they each touch a different file and are fully independent of each other and of the backend fixes
- Task 7 is a mobile-only wiring change; it is independent of all other tasks
- No new npm packages, Prisma migrations, or API endpoints are required by any task
- The existing `catch` block in the notification draft handler (task 3) already handles fallback — do not modify it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3", "4", "5", "6", "7"] }
  ]
}
```
