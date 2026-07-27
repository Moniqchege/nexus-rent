import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

test("Bug 1 — Overview hardcoded values", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/overview/page.tsx"), "utf8");
  
  const hasHardcodedExpenses = fileContent.includes("const expenses  = 128900;");
  const hasHardcodedInflow = fileContent.includes("const INFLOW  = [5200, 6800, 4900, 9600, 5100, 4200, 3800];");
  const hasHardcodedOutflow = fileContent.includes("const OUTFLOW = [3100, 4200, 3600, 5800, 3900, 2900, 2600];");

  console.log("Bug 1 Counterexample:", { hasHardcodedExpenses, hasHardcodedInflow, hasHardcodedOutflow });

  assert.strictEqual(hasHardcodedExpenses, false, "BUG CONFIRMED: Overview expenses value is hardcoded 128900");
  assert.strictEqual(hasHardcodedInflow, false, "BUG CONFIRMED: INFLOW array is compile-time constant");
  assert.strictEqual(hasHardcodedOutflow, false, "BUG CONFIRMED: OUTFLOW array is compile-time constant");
});

test("Bug 2 — Schedules missing payments fetch", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/schedules/page.tsx"), "utf8");
  
  const callsSetPaymentsInFetch = fileContent.includes("setPayments(paymentsData)") || fileContent.includes("getPayments()");
  
  console.log("Bug 2 Counterexample:", { callsSetPaymentsInFetch });

  assert.strictEqual(callsSetPaymentsInFetch, true, "BUG CONFIRMED: setPayments/getPayments never called on mount in Schedules page");
});

test("Bug 3 — Tenant client-side-only search & backend missing search param", async () => {
  const feContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/tenant/page.tsx"), "utf8");
  const beContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/leases.ts"), "utf8");

  const feCallsSearchEndpoint = feContent.includes('/api/leases?search=') || feContent.includes('searchLeases');
  const beSupportsSearchParam = beContent.includes("req.query") && beContent.includes("search");

  console.log("Bug 3 Counterexample:", { feCallsSearchEndpoint, beSupportsSearchParam });

  assert.strictEqual(feCallsSearchEndpoint, true, "BUG CONFIRMED: Tenant page only filters leases in-memory, never calls backend search");
  assert.strictEqual(beSupportsSearchParam, true, "BUG CONFIRMED: GET /api/leases ignores search query param");
});

test("Bug 4a — Automation wrong endpoint for Generate Schedules", async () => {
  const feContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/automation/page.tsx"), "utf8");
  const beContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/cron.ts"), "utf8");

  const cronDefCorrectEndpoint = feContent.includes('endpoint: "/api/cron/schedules"');
  const beHasSchedulesCronRoute = beContent.includes('router.post("/schedules"');

  console.log("Bug 4a Counterexample:", { cronDefCorrectEndpoint, beHasSchedulesCronRoute });

  assert.strictEqual(cronDefCorrectEndpoint, true, "BUG CONFIRMED: Generate Schedules points to /api/payments/schedules (GET only)");
  assert.strictEqual(beHasSchedulesCronRoute, true, "BUG CONFIRMED: Backend POST /api/cron/schedules does not exist");
});

test("Bug 4b — SSE unauthenticated and missing GET /api/cron/logs", async () => {
  const feContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/automation/page.tsx"), "utf8");
  const beContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/cron.ts"), "utf8");

  const feUsesPolling = feContent.includes('/api/cron/logs');
  const beHasLogsRoute = beContent.includes('router.get("/logs"');

  console.log("Bug 4b Counterexample:", { feUsesPolling, beHasLogsRoute });

  assert.strictEqual(feUsesPolling, true, "BUG CONFIRMED: Automation uses unauthenticated EventSource /api/cron/sse");
  assert.strictEqual(beHasLogsRoute, true, "BUG CONFIRMED: Backend GET /api/cron/logs does not exist");
});

test("Bug 4c — Refresh Status no-op", async () => {
  const feContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/automation/page.tsx"), "utf8");

  const refreshButtonHasOnClick = feContent.includes('onClick={fetchCronLogs}');
  
  console.log("Bug 4c Counterexample:", { refreshButtonHasOnClick });

  assert.strictEqual(refreshButtonHasOnClick, true, "BUG CONFIRMED: Refresh Status button has no onClick handler");
});

test("Bug 5a — Backend GET /api/expenses date range filter", async () => {
  const beContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/expenses.ts"), "utf8");

  const beSupportsDateParams = beContent.includes("startDate") && beContent.includes("endDate");

  console.log("Bug 5a Counterexample:", { beSupportsDateParams });

  assert.strictEqual(beSupportsDateParams, true, "BUG CONFIRMED: GET /api/expenses ignores startDate and endDate params");
});

test("Bug 5b — KRA download unauthenticated", async () => {
  const feContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/reports/page.tsx"), "utf8");

  const exportUsesAuthenticatedBlob = feContent.includes('responseType: "blob"') || feContent.includes("responseType: 'blob'");

  console.log("Bug 5b Counterexample:", { exportUsesAuthenticatedBlob });

  assert.strictEqual(exportUsesAuthenticatedBlob, true, "BUG CONFIRMED: KRA Report uses unauthenticated window.open");
});
