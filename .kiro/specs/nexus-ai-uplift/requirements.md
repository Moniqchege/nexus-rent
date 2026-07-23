# Requirements Document

## Introduction

This document specifies the requirements for the **Nexus AI Uplift** — a suite of nine AI-powered features layered onto the existing Nexus Rent property management platform targeting the Kenyan and broader East African market.

The platform currently consists of:
- **Backend**: Node.js / Express / TypeScript with Prisma ORM (MySQL)
- **Frontend**: Next.js admin/landlord dashboard
- **Mobile**: React Native / Expo tenant-facing app

The AI Uplift replaces several hardcoded, rule-based, or mock implementations with real machine-learning and LLM-backed capabilities. All LLM calls are server-side; no API keys are exposed to client or mobile code. Features are designed to function reliably on low-bandwidth connections common in the Kenyan market. M-Pesa is treated as the primary payment method.

---

## Glossary

- **AI_Service**: The new `src/services/aiService.ts` module that wraps all LLM API calls and caching logic.
- **AI_Router**: The new Express router mounted at `/api/ai` that exposes all AI endpoints.
- **Chatbot**: The `mobile/app/chatbot.tsx` screen and its backend counterpart; branded "Nexus Orion".
- **LLM**: Large Language Model — either OpenAI GPT-4o-mini or Google Gemini 1.5 Flash.
- **LLM_Provider**: The selected LLM vendor (OpenAI or Gemini), configured via environment variables.
- **Orion**: The tenant-facing AI chatbot assistant within the Nexus Rent mobile app.
- **TenantScore**: A computed numeric score (0–100) summarising a tenant's payment and lease compliance behaviour.
- **TenantScore_Model**: The new `TenantScore` Prisma model that persists computed scores and their metadata.
- **RentSuggestion**: A structured object containing a suggested rent range (min/max in KES), a confidence value, and supporting rationale.
- **AnomalyFlag**: A record representing a detected payment anomaly, with severity label and description.
- **AnomalyFlag_Model**: The new `PaymentAnomaly` Prisma model that persists flagged anomalies.
- **MaintenancePrediction**: A structured record predicting an upcoming maintenance event for a property.
- **MaintenancePrediction_Model**: The new `MaintenancePrediction` Prisma model that persists maintenance predictions.
- **RenewalRiskScore**: A computed score (0–100) estimating the probability that a tenant will not renew their lease.
- **RenewalRisk_Model**: The new `LeaseRenewalRisk` Prisma model persisting renewal risk scores.
- **NotificationSegment**: A tenant segment label produced by the smart targeting system (e.g., `OVERDUE`, `UNRESPONSIVE`, `AT_RISK`, `HEALTHY`).
- **AISummary**: A 3–5 sentence natural-language financial summary for a given landlord's portfolio month.
- **LeaseSummary**: A plain-English (and optionally Swahili) summary of a tenant's lease document.
- **CronLog**: The existing `CronLog` Prisma model used to record cron job execution results.
- **Cache**: An in-memory or Redis-backed store used to avoid re-running expensive AI computations on every request.
- **KES**: Kenyan Shilling — the currency used in all monetary computations.
- **M-Pesa**: Safaricom's mobile money service, the primary payment method for tenants on the platform.
- **Swahili**: One of Kenya's two official languages; required for all tenant-facing AI outputs.
- **System_Prompt**: The instruction block prepended to an LLM conversation that injects tenant context (property, rent, schedule, lease).
- **Landlord**: A `User` whose properties are related via `Property.landlordId`.
- **Tenant**: A `User` who appears in `UserProperty` with a `Tenant` role.
- **RentSchedule**: The existing Prisma model tracking per-tenant rent due dates, amounts, statuses, and late fees.
- **Expense**: The existing Prisma model tracking property maintenance and operating costs.
- **Lease**: The existing Prisma model capturing lease terms, dates, and signed document URLs.

---

## Requirements

### Requirement 1: LLM-Backed Chatbot (Orion Upgrade)

**User Story:** As a tenant, I want to chat with Nexus Orion using natural language in English or Swahili, so that I can get accurate, contextual answers about my rent, lease, and property without the chatbot giving me hardcoded or incorrect information.

#### Acceptance Criteria

1. THE AI_Router SHALL expose a `POST /api/ai/chat` endpoint that accepts a JSON body containing `{ message: string, conversationHistory?: Array<{ role: string, content: string }> }`.
2. WHEN a tenant sends a chat message, THE AI_Service SHALL inject a System_Prompt containing the tenant's current property details, rent amount, next due date, RentSchedule status, and active Lease terms before forwarding the conversation to the LLM_Provider.
3. WHEN the LLM_Provider returns a response, THE AI_Router SHALL return a JSON body `{ reply: string }` with an HTTP 200 status within 8 seconds under normal network conditions.
4. THE AI_Service SHALL keep all LLM_Provider API keys in server-side environment variables and SHALL NOT expose them in any response body, log line, or client-side bundle.
5. WHEN a tenant's message is written in Swahili, THE AI_Service SHALL instruct the LLM_Provider to respond in Swahili.
6. WHEN a tenant's message mixes Swahili and English (code-switching), THE AI_Service SHALL instruct the LLM_Provider to respond in the same mixed register.
7. THE Chatbot mobile screen SHALL call `POST /api/ai/chat` for all user messages and SHALL NOT invoke the local `getBotResponse()` function for any message after the upgrade.
8. IF the `POST /api/ai/chat` endpoint returns an error or times out, THE Chatbot SHALL display a user-friendly error message in the language of the last user message without crashing.
9. THE AI_Router SHALL require a valid authentication token on `POST /api/ai/chat` and SHALL return HTTP 401 for unauthenticated requests.
10. THE AI_Service SHALL truncate conversation history to the most recent 10 messages before sending to the LLM_Provider, to limit token usage and response latency on low-bandwidth connections.

---

### Requirement 2: Tenant Risk Scoring

**User Story:** As a landlord, I want each tenant to have a computed risk score rather than a hardcoded placeholder, so that I can quickly assess tenant reliability and make informed decisions about lease renewals and late fee enforcement.

#### Acceptance Criteria

1. THE AI_Service SHALL compute a TenantScore for a given tenant by combining the following weighted signals: on-time payment rate (40%), number of overdue incidents (20%), average days late per overdue payment (20%), total late fee accumulation (10%), and lease compliance flag (10%).
2. THE TenantScore SHALL be an integer in the range [0, 100], where 100 represents perfect payment behaviour and 0 represents maximum risk.
3. THE AI_Service SHALL persist computed TenantScore records in the TenantScore_Model, including `tenantId`, `score`, `breakdown` (JSON), and `computedAt` timestamp.
4. THE AI_Router SHALL expose a `GET /api/ai/tenant-score/:tenantId` endpoint that returns the most recently cached TenantScore for the given tenant.
5. WHEN no cached TenantScore exists for a tenant, THE AI_Router SHALL compute the score on-demand before returning it.
6. WHEN a new Payment record with `status = 'paid'` is created for a tenant, THE AI_Service SHALL invalidate and recompute that tenant's TenantScore asynchronously within 60 seconds.
7. THE Backend Cron System SHALL include a daily job that recomputes TenantScore records for all tenants whose score is older than 24 hours.
8. THE Frontend landlord dashboard SHALL display the TenantScore retrieved from `GET /api/ai/tenant-score/:tenantId` instead of the hardcoded "94/100" value.
9. THE Mobile home screen SHALL display the authenticated tenant's own TenantScore retrieved from `GET /api/ai/tenant-score/:tenantId` with a descriptive label (e.g., "Excellent", "Good", "Fair", "At Risk").
10. IF the tenant has fewer than 2 completed RentSchedule records, THE AI_Service SHALL return a TenantScore of `null` with a `{ reason: "insufficient_data" }` field rather than computing an unreliable score.

---

### Requirement 3: AI Financial Summaries

**User Story:** As a landlord, I want to see a natural-language summary of my portfolio's monthly financial performance instead of static numbers, so that I can quickly understand what is going well and what needs attention without reading raw data tables.

#### Acceptance Criteria

1. THE AI_Router SHALL expose a `GET /api/ai/summary` endpoint that accepts query parameters `{ landlordId: number, month: string (YYYY-MM) }`.
2. WHEN the endpoint is called, THE AI_Service SHALL query the database for all Payment records (paid, partial, overdue) and Expense records within the specified month for the landlord's properties.
3. THE AI_Service SHALL pass a structured data payload (total collected, total expected, collection rate, count of overdue tenants, total expenses, net income) to the LLM_Provider and instruct it to produce a 3–5 sentence plain-English AISummary.
4. THE AISummary SHALL explicitly mention any tenants with overdue status and SHALL highlight months where collection rate exceeds 95%.
5. THE AI_Service SHALL cache the AISummary for each `(landlordId, month)` pair for a minimum of 60 minutes to avoid redundant LLM calls.
6. WHEN cached data exists for a `(landlordId, month)` pair, THE AI_Router SHALL return the cached AISummary without calling the LLM_Provider.
7. THE Frontend admin dashboard SHALL render the AISummary text in place of hardcoded financial insight statistics.
8. IF the landlord has no payment or expense data for the requested month, THE AI_Service SHALL return a summary indicating no transactions were recorded rather than calling the LLM_Provider with empty data.
9. THE AI_Router SHALL require a valid authentication token on `GET /api/ai/summary` and SHALL return HTTP 401 for unauthenticated requests.
10. THE AISummary response payload SHALL not exceed 500 characters to ensure readability on mobile dashboard widgets.

---

### Requirement 4: AI Rent Pricing Engine

**User Story:** As a landlord, I want the AI Insights page to suggest a real data-driven rent range for my properties, so that I can price competitively in the Kenyan market rather than relying on a mock UI.

#### Acceptance Criteria

1. THE AI_Router SHALL expose a `POST /api/ai/rent-suggestion` endpoint that accepts a JSON body containing: `{ propertyId?: number, location: string, beds: number, baths: number, sqft?: number, amenities?: string[], currentRent?: number }`.
2. WHEN the endpoint is called, THE AI_Service SHALL build a prompt that includes the property attributes, the Kenyan neighbourhood context, and any comparable properties found in the platform's own database for the same location.
3. THE AI_Service SHALL instruct the LLM_Provider to return a structured JSON object `{ minKES: number, maxKES: number, confidence: number, rationale: string }` representing the RentSuggestion.
4. THE RentSuggestion `minKES` and `maxKES` values SHALL be denominated in KES and SHALL be realistic for the Kenyan residential rental market (minimum KES 5,000, maximum KES 500,000 per month).
5. THE AI_Service SHALL cache RentSuggestion results keyed by a hash of the input attributes for a minimum of 24 hours.
6. THE Frontend AI Insights page SHALL call `POST /api/ai/rent-suggestion` with the selected property's attributes and render the returned `minKES`, `maxKES`, `confidence`, and `rationale` fields in the Decision Panel, replacing the hardcoded USD values.
7. IF the LLM_Provider returns a value outside the valid KES range defined in AC4, THE AI_Service SHALL clamp the returned values to the valid range and add a `clamped: true` flag to the response.
8. THE AI_Router SHALL require a valid authentication token on `POST /api/ai/rent-suggestion` and SHALL return HTTP 401 for unauthenticated requests.
9. WHEN `propertyId` is provided, THE AI_Service SHALL automatically populate `location`, `beds`, `baths`, `sqft`, and `amenities` from the corresponding Property record if those fields are not explicitly provided in the request body.

---

### Requirement 5: Lease Summariser

**User Story:** As a tenant, I want to tap "Summarise My Lease" and receive a plain-English (and optionally Swahili) summary of my lease document, so that I understand my key obligations, dates, and rights without having to read dense legal language.

#### Acceptance Criteria

1. THE AI_Router SHALL expose a `POST /api/ai/lease-summary` endpoint that accepts `{ leaseId: number, language?: "en" | "sw" | "both" }`, defaulting to `"en"`.
2. WHEN the endpoint is called, THE AI_Service SHALL locate the signed lease document via the Lease record's `signedDocumentUrl` field and extract its text content.
3. THE AI_Service SHALL pass the extracted lease text to the LLM_Provider with instructions to produce a LeaseSummary covering: key start and end dates, monthly rent amount and escalation clauses, early termination conditions and penalties, maintenance responsibilities, and deposit terms.
4. WHEN `language = "sw"` or `language = "both"`, THE AI_Service SHALL instruct the LLM_Provider to produce the LeaseSummary in Swahili, or produce both English and Swahili versions respectively.
5. THE AI_Service SHALL cache the LeaseSummary for each `(leaseId, language)` pair and SHALL return the cached result for subsequent requests without re-extracting or re-calling the LLM_Provider.
6. THE Mobile app SHALL present a "Summarise My Lease" button in the tenant's lease view that calls `POST /api/ai/lease-summary` and renders the returned summary text.
7. IF the Lease record has no `signedDocumentUrl`, THE AI_Router SHALL return HTTP 404 with `{ error: "no_lease_document" }`.
8. IF the lease document is not a PDF or the text extraction returns fewer than 100 characters, THE AI_Service SHALL return an error `{ error: "unreadable_document" }` rather than sending empty content to the LLM_Provider.
9. THE LeaseSummary response payload for each language SHALL not exceed 1000 characters to remain lightweight on mobile data connections.
10. THE AI_Router SHALL require a valid authentication token and SHALL verify that the requesting tenant is a member of the specified Lease before returning the summary.

---

### Requirement 6: Payment Anomaly Detection

**User Story:** As a landlord, I want the system to automatically flag unusual payment behaviour, so that I am alerted to potential M-Pesa fraud or payment manipulation before it causes financial loss.

#### Acceptance Criteria

1. THE AI_Service SHALL compute a per-tenant payment baseline from the last 6 months of Payment records, capturing: mean payment amount, standard deviation of payment amount, and typical payment day-of-month distribution.
2. WHEN a new Payment record is created with `method = "mpesa"` and `status = "paid"`, THE AI_Service SHALL evaluate the payment against the tenant's baseline and create an AnomalyFlag_Model record if any of the following conditions are met: the amount deviates from the mean by more than 2 standard deviations; the payment timestamp falls outside the tenant's typical payment window by more than 5 days; or the referenceId pattern does not match the standard M-Pesa transaction ID format.
3. THE AnomalyFlag_Model record SHALL include: `tenantId`, `paymentId`, `severity` (one of `LOW`, `MEDIUM`, `HIGH`), `reason` (string), and `detectedAt` timestamp.
4. THE AI_Router SHALL expose a `GET /api/ai/anomalies` endpoint that accepts `{ landlordId: number, propertyId?: number, severity?: string }` as query parameters and returns all unresolved AnomalyFlag records for the landlord's properties.
5. THE Frontend landlord dashboard SHALL display AnomalyFlag records on a dedicated alerts panel with severity colour coding and SHALL allow the landlord to mark anomalies as resolved.
6. THE AI_Router SHALL expose a `PATCH /api/ai/anomalies/:id/resolve` endpoint that sets an `resolvedAt` timestamp on the AnomalyFlag_Model record.
7. THE Backend Cron System SHALL run the anomaly detection scan daily across all Payment records from the previous 24 hours and create AnomalyFlag_Model records for any newly detected anomalies.
8. WHEN a tenant has fewer than 3 completed Payment records, THE AI_Service SHALL skip anomaly baseline computation for that tenant and SHALL not create AnomalyFlag_Model records.
9. THE AI_Service SHALL assign severity `HIGH` when a payment deviates from the mean by more than 3 standard deviations, `MEDIUM` for 2–3 standard deviations, and `LOW` for pattern-timing anomalies that do not involve amount deviation.

---

### Requirement 7: Predictive Maintenance

**User Story:** As a landlord, I want to see predicted upcoming maintenance events for each property based on historical expense patterns, so that I can budget proactively and avoid unexpected repair costs.

#### Acceptance Criteria

1. THE AI_Service SHALL analyse Expense records grouped by `category` and `propertyId` to identify recurring maintenance patterns, defined as the same expense category appearing 3 or more times within a 12-month window for the same property.
2. WHEN a recurring pattern is detected, THE AI_Service SHALL compute the average interval (in days) between occurrences and create a MaintenancePrediction_Model record with: `propertyId`, `category`, `predictedDate`, `estimatedCostKES`, `confidence`, and `detectedAt`.
3. THE AI_Router SHALL expose a `GET /api/ai/maintenance-predictions/:propertyId` endpoint that returns all active MaintenancePrediction records for the specified property.
4. THE Frontend property detail page SHALL display MaintenancePrediction cards showing the category, predicted date, estimated cost, and confidence level.
5. THE AI_Service SHALL flag a property as a "High Maintenance" property WHEN its average monthly Expense total exceeds the portfolio-wide average by more than 50%.
6. THE AI_Router SHALL expose a `GET /api/ai/maintenance-predictions` endpoint (no propertyId) that returns high-maintenance flags for all properties belonging to the authenticated landlord.
7. THE Backend Cron System SHALL re-run predictive maintenance analysis weekly and update or create MaintenancePrediction_Model records accordingly.
8. THE MaintenancePrediction response payload SHALL include a `daysUntilDue` field derived from the difference between `predictedDate` and the current date.
9. IF a property has fewer than 3 Expense records in any category, THE AI_Service SHALL not generate a MaintenancePrediction for that category on that property.

---

### Requirement 8: Smart Notification Targeting

**User Story:** As a landlord, I want the notifications module to suggest which tenants to target and what action to take, so that I can send the right message to the right tenant at the right time without manually reviewing each tenant's status.

#### Acceptance Criteria

1. THE AI_Router SHALL expose a `GET /api/ai/notification-segments` endpoint that returns a list of tenants for the authenticated landlord, each annotated with a `NotificationSegment` label (`OVERDUE`, `UNRESPONSIVE`, `AT_RISK`, `HEALTHY`).
2. THE AI_Service SHALL assign segments using the following rules: `OVERDUE` — tenant has at least one RentSchedule with `status = "overdue"`; `UNRESPONSIVE` — tenant has received 3 or more reminders in the last 30 days with no resulting Payment; `AT_RISK` — tenant's TenantScore is below 60; `HEALTHY` — none of the above conditions apply.
3. THE AI_Service SHALL use the LLM_Provider to generate a recommended notification action string for each non-HEALTHY tenant, such as "Send a firm overdue payment reminder" or "Schedule a call — tenant has not responded to 3 reminders."
4. THE Frontend notifications module SHALL display the segmented tenant list with segment labels and AI-recommended actions, allowing the landlord to select tenants from a pre-filtered segment before composing a message.
5. THE AI_Service SHALL cache segment results per landlord for 30 minutes to avoid repeated database queries and LLM calls on each page load.
6. THE AI_Router SHALL require a valid authentication token on `GET /api/ai/notification-segments` and SHALL return HTTP 401 for unauthenticated requests.
7. WHEN a landlord sends a notification to a segment-filtered list, THE Backend notification system SHALL record the `segmentLabel` used alongside the Notification record for future engagement tracking.

---

### Requirement 9: Lease Renewal Risk Prediction

**User Story:** As a landlord, I want to be alerted 60 days before a lease expires with an AI-computed renewal risk score and a recommended action, so that I can take proactive steps to retain good tenants or prepare for vacancy.

#### Acceptance Criteria

1. THE Backend Cron System SHALL run a daily job that identifies all Lease records with `status = "active"` and `endDate` between 55 and 65 days from the current date.
2. WHEN a qualifying Lease is identified, THE AI_Service SHALL compute a RenewalRiskScore (0–100, where 100 = highest risk of non-renewal) from the following signals: tenant review rating average (if available), late payment frequency over the lease term, number of open or unresolved service requests, and notification engagement rate (ratio of notifications sent to payments triggered).
3. THE AI_Service SHALL persist the RenewalRiskScore in the RenewalRisk_Model with: `leaseId`, `tenantId`, `score`, `riskLevel` (one of `LOW`, `MEDIUM`, `HIGH`), `recommendedAction` (string), `signals` (JSON), and `computedAt`.
4. WHEN a RenewalRiskScore is computed, THE AI_Service SHALL use the LLM_Provider to generate a `recommendedAction` string based on the score and signal breakdown, such as "Offer a 3-month rent freeze incentive" or "Begin vacancy marketing for this unit."
5. THE AI_Router SHALL expose a `GET /api/ai/renewal-risks` endpoint that returns all RenewalRisk_Model records for leases belonging to the authenticated landlord's properties, ordered by `score` descending.
6. THE Frontend landlord dashboard SHALL display a "Lease Renewal Alerts" panel listing tenants with renewal risk scores, their risk level, and the AI-recommended action.
7. THE Backend Cron System SHALL create a Notification record targeting the landlord (not the tenant) when a new RenewalRiskScore is persisted, with a summary of the risk level and lease expiry date.
8. IF a RenewalRiskScore already exists for a `(leaseId, tenantId)` pair computed within the last 7 days, THE AI_Service SHALL not recompute the score and SHALL skip that lease in the cron run.
9. THE AI_Service SHALL assign `riskLevel = "HIGH"` when the RenewalRiskScore exceeds 70, `"MEDIUM"` for scores 40–70, and `"LOW"` for scores below 40.

---

### Requirement 10: AI Infrastructure and Cross-Cutting Constraints

**User Story:** As a developer, I want the AI feature set to be built on a shared, consistent infrastructure, so that all nine AI capabilities are secure, performant, maintainable, and do not break existing platform functionality.

#### Acceptance Criteria

1. THE AI_Service SHALL be implemented as a single TypeScript module at `backend/src/services/aiService.ts` that exports all AI computation functions used by the AI_Router.
2. THE AI_Router SHALL be implemented at `backend/src/routes/ai.ts` and mounted at `/api/ai` in the main Express application (`src/index.ts`).
3. THE AI_Service SHALL support both OpenAI GPT-4o-mini and Google Gemini 1.5 Flash as LLM_Provider options, selectable via the `AI_PROVIDER` environment variable (`"openai"` or `"gemini"`), defaulting to `"openai"`.
4. THE AI_Service SHALL implement an in-memory Cache using a time-keyed map, with per-feature TTL values defined as constants (chat: no caching; summary: 60 min; rent-suggestion: 24 h; lease-summary: indefinite until lease document changes; tenant-score: 24 h; anomalies: recomputed on write; maintenance: 7 days; notification-segments: 30 min; renewal-risk: 7 days).
5. THE AI_Service SHALL enforce a maximum response size of 2KB per LLM call to keep responses lightweight on low-bandwidth connections.
6. ALL new Prisma models introduced by the AI Uplift (TenantScore_Model, AnomalyFlag_Model, MaintenancePrediction_Model, RenewalRisk_Model) SHALL be added to `backend/prisma/schema.prisma` and accompanied by a new Prisma migration file that does not alter or drop any existing tables or columns.
7. THE AI_Service SHALL log all LLM API call durations and token counts to the existing CronLog model using `type = "ai_call"` when called from a cron job, and to the console when called from a request handler.
8. IF the LLM_Provider API returns an error with HTTP status 429 (rate limit), THE AI_Service SHALL retry the request once after a 2-second delay before returning an error to the caller.
9. ALL AI_Router endpoints SHALL validate request inputs and return HTTP 400 with a descriptive `{ error: string }` body for any missing required field.
10. THE AI_Service SHALL never include raw tenant PII (full name, phone number, email) in LLM prompts; references to individual tenants in prompts SHALL use anonymised identifiers (e.g., `tenant_42`) unless the tenant is the authenticated caller in a chatbot session.
