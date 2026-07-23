# Requirements Document

## Introduction

The AI Intelligence Overhaul introduces a fully integrated AI capability layer across the Nexus Rent platform. The backend core — `aiService.ts` (LLM orchestration) and `ai.ts` (six AI-driven routes) — is **already implemented**. The `/api/ai` router is already mounted in `index.ts`. The mobile chatbot (`chatbot.tsx`) already calls the live API with auth token and falls back to local logic.

The remaining work is:

1. Surface and polish AI endpoints in the **React/Next.js admin dashboard** — expenses anomaly feed, notifications AI writing assistant, leases renewal panel, and ensuring the AI insights page is fully wired.
2. Connect the **profile bot button** (`profilebot.tsx`) and profile tab in the mobile app so FAQ interactions route through the live chatbot endpoint.
3. Harden the **backend edge cases** identified during code review: anomaly detection uses a 60-day window instead of the specified 3-month rolling average; the lease renewal window starts at day 50 instead of day 60; and the LLM JSON response parsing has no schema validation guard.

---

## Glossary

- **AI_Service**: The backend `aiService.ts` helper that calls Gemini (primary) then OpenAI (fallback) via axios.
- **AI_Router**: The `ai.ts` Express router mounted at `/api/ai/*`.
- **LLM**: Large Language Model; either Gemini 1.5 Flash or GPT-4o-mini.
- **Nexus_Orion**: The AI assistant persona name exposed to tenants.
- **Anomaly_Feed**: The UI widget on the expenses dashboard that displays financial anomaly alerts.
- **AI_Writing_Assistant**: The compose-panel sidebar in `SendNotifications.tsx` that drafts notification content via the `/api/ai/notifications/draft` endpoint.
- **Renewal_Panel**: The lease expiry intelligence banner/panel on `leases/page.tsx`.
- **Flight_Risk**: A tenant flagged as likely to not renew despite having a low risk score and long tenure.
- **Chatbot**: The tenant-facing conversational assistant screen (`chatbot.tsx`) in the mobile app.
- **Profilebot**: The floating FAQ button (`profilebot.tsx`) that routes to the Chatbot screen.
- **Dashboard**: The React/Next.js admin and manager frontend.
- **Mobile_App**: The React Native/Expo tenant-facing application.
- **Prisma**: The ORM used to query MySQL; all database access goes through `db` from `src/db/prisma.ts`.
- **Confidence_Score**: A numeric value between 0.0 and 1.0 representing the system's certainty in a detected anomaly.
- **Risk_Score**: A normalized integer between 1 and 100 representing tenant financial risk.
- **Rolling_Average**: A 3-month backward-looking moving average over expense amounts per property-category pair.

---

## Requirements

### Requirement 1: LLM Orchestration Service

**User Story:** As a backend developer, I want a reliable LLM helper function, so that all AI features share a consistent, dual-redundant call path with clear error surfacing.

#### Acceptance Criteria

1. THE AI_Service SHALL expose a `callLLM(systemPrompt: string, userPrompt: string): Promise<string>` function that returns the trimmed text content from the provider response.
2. WHEN a Gemini API key is present in environment variables, THE AI_Service SHALL call the Gemini 1.5 Flash model first.
3. IF the Gemini call fails, returns an empty response, or the Gemini API key is absent, THEN THE AI_Service SHALL attempt the OpenAI GPT-4o-mini model as a fallback.
4. WHEN both LLM providers fail or neither API key is configured, THE AI_Service SHALL throw an error with a descriptive message.
5. THE AI_Service SHALL enforce a 10-second timeout on each individual provider call.
6. IF a provider call fails or returns an empty response, THE AI_Service SHALL log a `console.warn` identifying which provider failed before attempting the next; IF the provider key is absent, THE AI_Service SHALL log a `console.log` before skipping to the fallback.

---

### Requirement 2: Tenant Chatbot Endpoint

**User Story:** As a tenant, I want to ask questions about my lease, rent, and property through a chat interface, so that I can get immediate, context-aware answers without contacting a landlord.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/ai/chat` with a valid auth token and a `message` string between 1 and 2000 characters, THE AI_Router SHALL return a JSON object with a non-empty `reply` field.
2. THE AI_Router SHALL inject the requesting tenant's active lease (or a "no active lease" notice if absent), up to 3 upcoming rent schedule entries, up to 5 most recent payments, and property details as a serialized system prompt context before querying the LLM.
3. THE AI_Router SHALL instruct the LLM to respond as an assistant named "Nexus Orion" using a system prompt that constrains it to lease, rent, payment, and property topics.
4. IF the LLM call fails or returns an empty string, THEN THE AI_Router SHALL generate a local deterministic reply by matching the lowercased message against keywords: "rent" → rent amount, "lease" → lease dates, "payment" → payment history, "property" → property name; unmatched queries SHALL return a generic assistance message.
5. IF the `message` field is absent or empty from the request body, THEN THE AI_Router SHALL return a 400 status with an error message.
6. IF the authenticated user is not found in the database, THEN THE AI_Router SHALL return a 404 status.
7. IF the tenant has no active lease, THE AI_Router SHALL still proceed and include a "no active lease found" notice in the system context rather than returning an error.

---

### Requirement 3: Rent Pricing Recommendation Engine

**User Story:** As a property manager, I want AI-generated rent pricing suggestions for each property, so that I can make data-driven decisions about rent adjustments.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/ai/pricing/recommend` with a valid integer `propertyId` query parameter, THE AI_Router SHALL return a pricing recommendation object containing `suggestedRent` (number ≥ 0), `demandScore` (integer 0–100), `churnRisk` (integer 0–100), and `explanation` (string) fields.
2. WHEN building the LLM prompt, THE AI_Router SHALL aggregate payment consistency ratio, total maintenance expenses, average review rating, and property score.
3. IF the LLM fails or returns a response that cannot be parsed as a JSON object with all four required fields within range, THEN THE AI_Router SHALL apply a deterministic fallback calculation using review sentiment multipliers and expense impact ratios, returning the same four fields within the same bounds.
4. IF `propertyId` is not supplied or is not a valid integer, THEN THE AI_Router SHALL default to the property with the lowest `id` value in the database; IF no properties exist, THE AI_Router SHALL return a 404 status.
5. IF the requested property does not exist, THEN THE AI_Router SHALL return a 404 status.
6. WHEN returning a recommendation, THE AI_Router SHALL include `propertyId`, `title`, and `currentRent` alongside the AI-generated fields in the response.

---

### Requirement 4: AI Insights Dashboard Page — Rent Pricing Panel

**User Story:** As an admin or property manager, I want the AI insights page to display live rent pricing recommendations per property, so that I can evaluate and act on AI-generated pricing intelligence from the dashboard.

#### Acceptance Criteria

1. WHEN the AI Insights page loads, THE Dashboard SHALL fetch all properties from `/api/properties`, auto-select the first property returned, and render a property selector dropdown populated with the fetched list.
2. IF the `/api/properties` call fails, THE Dashboard SHALL render an error message in place of the selector and omit the Heatmap, Prediction Chart, and Decision Panel entirely.
3. IF the properties list is empty, THE Dashboard SHALL hide the property selector and display a "No properties available" message in place of the panels.
4. WHEN a property is selected, THE Dashboard SHALL query `/api/ai/pricing/recommend?propertyId=X` and bind `demandScore` to the Heatmap overlay badge, and bind `suggestedRent`, `churnRisk`, and `explanation` to the Prediction Chart and Decision Panel cards.
5. THE Dashboard SHALL display the `suggestedRent`, a `churnRisk` percentage bar scaled from 0 to 100, and the `explanation` summary from the API response in the Decision Panel.
6. WHILE pricing data is loading, THE Dashboard SHALL display a loading indicator in place of the results panels.
7. IF the pricing API call fails on a subsequent property selection, THE Dashboard SHALL retain the last successfully loaded data in the panels and log the error to the console; IF it is the initial load after property selection, THE Dashboard SHALL display an inline error message and clear the panels.

---

### Requirement 5: Tenant Risk Scoring Engine

**User Story:** As a property manager, I want to retrieve a normalized risk score for any tenant, so that I can assess financial reliability for renewal and compliance decisions.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/ai/risk-score/:tenantId` with a valid integer tenant ID, THE AI_Router SHALL return a JSON object containing `riskScore` (integer 1–100), `riskCategory` ("Low", "Medium", or "High"), and `explanation` (string).
2. THE AI_Router SHALL compute the risk score deterministically using: overdue rent schedule count × 10 points each (capped at 40), late payment count × 5 points each (capped at 30), a +15 point bonus when average late fee exceeds 1000, and low-rating review count (rating ≤ 2) × 15 points each (capped at 15); the total SHALL be clamped to the range 1–100.
3. THE AI_Router SHALL classify risk as "High" when the score exceeds 65, "Medium" when it exceeds 30, and "Low" otherwise.
4. THE AI_Router SHALL request a one-sentence explanation from the LLM summarizing the risk evaluation.
5. IF the LLM call fails, THEN THE AI_Router SHALL supply a fallback explanation: "Tenant has [N] overdue payment(s) on record." when overdue count > 0, or "Tenant payment history is in good standing." when overdue count is 0.
6. IF the provided `tenantId` is not a valid integer, THEN THE AI_Router SHALL return a 400 status with an error message.
7. IF no tenant with the given ID exists, THEN THE AI_Router SHALL return a 404 status.

---

### Requirement 6: Financial Anomaly Detection Engine

**User Story:** As a property manager or accountant, I want the system to automatically detect unusual spending patterns and duplicate invoices, so that I can investigate and prevent financial losses.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/ai/expenses/anomalies`, THE AI_Router SHALL scan all Expense records and return a list of structured anomaly alert objects, each containing `id`, `propertyId`, `propertyTitle`, `severity`, `message`, and `confidenceScore`; IF no anomalies are detected, THE AI_Router SHALL return an empty array.
2. IF an expense amount exceeds 2 standard deviations above the 90-day rolling average for its property-category pair, THEN THE AI_Router SHALL flag it as a spending spike, using only expense records dated within the past 90 days (not 60 days) to compute the mean and standard deviation.
3. THE AI_Router SHALL silently exclude a property-category pair from spike evaluation when that pair has fewer than 3 expense records within the 90-day window.
4. IF a spending spike amount exceeds 3 standard deviations above the 90-day rolling mean for that property-category pair, THEN THE AI_Router SHALL classify it as "CRITICAL" severity; otherwise THE AI_Router SHALL classify it as "WARNING".
5. IF two expenses share the same `propertyId`, `amount`, `category`, and at least one matching vendor identifier (`vendorName` or `vendorAccountId`) within a 7-day window, THEN THE AI_Router SHALL flag them as a duplicate invoice with "WARNING" severity; expenses with both `vendorName` null and `vendorAccountId` null SHALL be excluded from duplicate detection.
6. WHEN a vendor identifier match is evaluated for duplicate detection, THE AI_Router SHALL match on `vendorAccountId` when it is non-null, and fall back to matching on `vendorName` when `vendorAccountId` is null.
7. THE AI_Router SHALL assign a `confidenceScore` of 0.88 to spending spikes and 0.95 to duplicate invoice detections.

---

### Requirement 7: Financial Anomaly Alerts Feed Widget

**User Story:** As an admin or accountant, I want to see AI-detected financial anomalies displayed on the expenses dashboard, so that I can act on suspicious activity without navigating away from my financial view.

#### Acceptance Criteria

1. THE Dashboard SHALL render an "AI Financial Audit Alerts" feed widget within the expenses page, positioned below the existing chart and metrics section.
2. WHEN the expenses page loads, THE Dashboard SHALL fetch anomaly data from `/api/ai/expenses/anomalies` and display up to 50 alerts as list items ordered by severity ("CRITICAL" first).
3. THE Dashboard SHALL display each anomaly with two visually distinct severity badge styles — one for "CRITICAL" and one for "WARNING" — alongside the alert message, the property title, and the confidence score rendered as a decimal between 0.00 and 1.00.
4. WHILE anomaly data is loading, THE Dashboard SHALL display a loading skeleton or spinner within the widget area.
5. IF no anomalies are detected, THE Dashboard SHALL display a positive confirmation message (e.g., "No anomalies detected") within the widget.
6. IF the anomaly API call fails, THE Dashboard SHALL display an error state message within the widget; the existing chart, metrics sections, and expense records above the widget SHALL remain visible and interactive.

---

### Requirement 8: AI Writing Assistant for Notifications

**User Story:** As a property manager, I want an AI writing assistant panel inside the notification compose view, so that I can generate professional, legally compliant notification drafts without writing from scratch.

#### Acceptance Criteria

1. THE Dashboard SHALL render an "AI Writing Assistant" collapsible panel within the `SendNotifications.tsx` compose view.
2. THE Dashboard SHALL provide a template type selector with at minimum the options "Rent Increase", "Maintenance Outage", and "Survey", and a free-text context input (maximum 500 characters) within the AI Writing Assistant panel.
3. WHEN the user submits a selected template type and non-empty context input, THE Dashboard SHALL POST `{ templateType, landlordInput }` to `/api/ai/notifications/draft` and receive a `title` and `message` JSON object in response.
4. IF the template type is not selected or the context input is empty, THEN THE Dashboard SHALL disable the generate button and not submit the request.
5. WHEN a valid draft response containing non-empty `title` and `message` strings is received, THE Dashboard SHALL overwrite the notification compose form's title and message fields with the AI-generated content.
6. IF the draft API call fails, THE Dashboard SHALL display an inline error message within the AI Writing Assistant panel without modifying the existing compose form content.
7. WHILE the draft is being generated, THE Dashboard SHALL display a loading indicator and disable the generate button to prevent duplicate submissions.
8. IF the compose form's title and message fields have been populated by the AI, THE Dashboard SHALL keep those fields fully editable so the user can modify the AI-generated content.

---

### Requirement 9: Intelligent Notification Drafting Endpoint

**User Story:** As a system, I want a backend endpoint that generates professional notification drafts, so that the writing assistant panel has a reliable, structured source of AI-generated content.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/ai/notifications/draft` with non-empty `templateType` and `landlordInput` string fields, THE AI_Router SHALL return a JSON object with exactly `title` (non-empty string) and `message` (non-empty string) fields.
2. THE AI_Router SHALL instruct the LLM to produce only a raw JSON object without markdown code fences, containing exactly the `title` and `message` keys.
3. THE AI_Router SHALL parse the LLM response as JSON and validate that both `title` and `message` exist as non-empty strings; IF parsing fails or either field is absent or empty, THEN THE AI_Router SHALL apply a local template fallback based on the `templateType`.
4. IF either `templateType` or `landlordInput` is absent or empty in the request body, THEN THE AI_Router SHALL return a 400 status with an error message.
5. THE AI_Router SHALL cover at minimum "Rent Increase", "Maintenance Outage", and "Survey" template types in the local fallback logic; IF the `templateType` does not match any known fallback, THE AI_Router SHALL use a generic fallback template.

---

### Requirement 10: Lease Renewal Intelligence Engine

**User Story:** As a property manager, I want the system to identify leases maturing in 60–90 days, assess each tenant's risk and tenure, and recommend retention strategies, so that I can proactively prevent good-tenant churn.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/ai/leases/renewals`, THE AI_Router SHALL return a list of intelligence objects for all leases where `status = "active"` and `endDate` is ≥ 60 days and ≤ 90 days from today (UTC, inclusive bounds).
2. THE AI_Router SHALL compute the risk score deterministically for each maturing lease's primary tenant (defined as the `LeaseTenant` with the lowest `id` for that lease) using the same formula defined in Requirement 5.
3. IF a tenant's `riskCategory` is "Low" AND their `tenureMonths` is ≥ 12, THEN THE AI_Router SHALL set `isFlightRisk` to `true` for that record; otherwise `isFlightRisk` SHALL be `false`.
4. THE AI_Router SHALL include `leaseId`, `propertyId`, `propertyTitle`, `tenantId`, `tenantName`, `endDate`, `tenureMonths` (calculated as the number of whole months from `startDate` to today using a 30-day-per-month approximation rounded to the nearest integer), `riskScore`, `riskCategory`, `isFlightRisk`, and `incentive` in each response object.
5. IF `isFlightRisk` is `true`, THEN THE AI_Router SHALL set `incentive` to "1-year renewal at 2% below projected market rate plus a complimentary service"; IF `riskCategory` is "High", THEN `incentive` SHALL be "security deposit top-up or co-sign agreement"; OTHERWISE `incentive` SHALL be "complimentary maintenance checklist service".
6. IF no active leases fall in the 60–90 day window, THE AI_Router SHALL return an empty array.

---

### Requirement 11: Lease Renewal AI Panel on Leases Dashboard

**User Story:** As a property manager, I want an AI Renewal Assistant panel on the leases page, so that I can immediately see which tenants are flight risks and take retention action from one place.

#### Acceptance Criteria

1. THE Dashboard SHALL render an "AI Renewal Assistant" panel on the leases page, positioned above the lease table.
2. WHEN the leases page loads, THE Dashboard SHALL fetch data from `/api/ai/leases/renewals` and display each record with the tenant name, property title, tenure displayed as an integer followed by the word "months", a risk category badge, a flight risk flag, and the recommended incentive.
3. THE Dashboard SHALL apply badge precedence as follows: a Flight Risk tenant SHALL display an amber badge regardless of risk category; a non-flight-risk "High" category tenant SHALL display a red badge; all other tenants SHALL display a green badge.
4. WHEN the user clicks the quick-action button on a renewal record, THE Dashboard SHALL navigate to the notification compose view with the tenant's name and a "Lease Renewal" template type pre-populated.
5. IF no leases are maturing in the 60–90 day window, THE Dashboard SHALL display a "No renewals due in the next 60–90 days" empty state message within the panel.
6. IF the renewals API call fails, THE Dashboard SHALL display an error state message within the panel; the lease table below SHALL remain visible and unaffected.
7. WHILE renewal data is loading, THE Dashboard SHALL display a loading indicator within the panel.

---

### Requirement 12: Mobile Chatbot API Integration

**User Story:** As a tenant using the mobile app, I want the chatbot to use real AI responses from the backend, so that I receive accurate, context-aware answers about my specific tenancy.

#### Acceptance Criteria

1. WHEN the tenant sends a message in the Chatbot screen, THE Mobile_App SHALL POST `{ message: string }` with `Content-Type: application/json` to `${API_BASE}/api/ai/chat` with the tenant's Bearer auth token in the `Authorization` header.
2. WHEN a successful 2xx response is received, THE Mobile_App SHALL display the `reply` field from the API response as a bot message bubble.
3. IF the API call returns a non-2xx status or a network-level error occurs, THEN THE Mobile_App SHALL invoke the local `getBotResponse()` function with the tenant's message and display its return value as a bot message bubble without showing an error to the user.
4. IF a 2xx response is received but the `reply` field is absent or empty, THEN THE Mobile_App SHALL fall back to `getBotResponse()` and display its result as the bot message bubble.
5. IF the current conversation has exactly 1 message (the initial bot greeting), THEN THE Mobile_App SHALL display the FAQ chip suggestions; otherwise THE Mobile_App SHALL hide the FAQ chips.

---

### Requirement 13: Mobile Profile Bot Navigation

**User Story:** As a tenant, I want a persistent floating FAQ button on my profile screen, so that I can easily launch the AI chatbot assistant from any profile view.

#### Acceptance Criteria

1. WHILE the profile tab screen is active, THE Mobile_App SHALL render a floating action button labeled "FAQ?" with a minimum touch target of 44 × 44 dp.
2. WHEN the floating FAQ button is tapped, THE Mobile_App SHALL navigate to the `/chatbot` route; IF navigation fails, THE Mobile_App SHALL log the error without crashing the screen.
3. WHILE the profile tab screen is active, THE Mobile_App SHALL position the floating button 16 dp from the right edge and 16 dp from the bottom edge of the safe area inset, with at least 16 dp of clearance above the system navigation bar.

---

### Requirement 14: API Security and Authorization

**User Story:** As a platform operator, I want all AI endpoints to enforce authentication, so that only authorized users can access AI-powered features and tenant data is never exposed to unauthenticated requests.

#### Acceptance Criteria

1. THE AI_Router SHALL apply the `requireAuth` middleware to all six AI endpoints.
2. IF a request to any `/api/ai/*` endpoint is made without a valid auth token, THEN THE AI_Router SHALL return a 401 status.
3. THE AI_Router SHALL use the authenticated user's ID (`req.userId`) to scope all database queries to that user's own data on tenant-specific endpoints (e.g., `/api/ai/chat`).
4. THE AI_Router SHALL not expose raw database records or internal stack traces in error responses returned to clients.
