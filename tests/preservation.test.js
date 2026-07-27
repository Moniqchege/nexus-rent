import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

test("Preservation 1: Overview page calls getPayments and getRentSchedules", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/overview/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes("getPayments()"), "Overview page imports/calls getPayments()");
  assert.ok(fileContent.includes("getRentSchedules()"), "Overview page imports/calls getRentSchedules()");
  assert.ok(fileContent.includes("loadPayments()"), "Overview page has loadPayments function");
});

test("Preservation 2: Schedules page client-side search and status filter", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/schedules/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes("statusFilter"), "Schedules page maintains statusFilter state");
  assert.ok(fileContent.includes("setStatusFilter"), "Schedules page allows statusFilter toggling");
  assert.ok(fileContent.includes("search.trim()"), "Schedules page filters rows by client-side search query");
});

test("Preservation 3: Cron routes (late-fees, reminders, reminders/manual) intact in backend", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/cron.ts"), "utf8");
  
  assert.ok(fileContent.includes('router.post("/late-fees"'), "POST /api/cron/late-fees handler exists");
  assert.ok(fileContent.includes('router.post("/reminders"'), "POST /api/cron/reminders handler exists");
  assert.ok(fileContent.includes('router.post("/reminders/manual"'), "POST /api/cron/reminders/manual handler exists");
});

test("Preservation 4: Automation page Send Reminders calls manual reminders endpoint", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/automation/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes('api.post("/api/cron/reminders/manual")'), "Send Reminders calls /api/cron/reminders/manual");
  assert.ok(fileContent.includes("handleSendReminders"), "handleSendReminders handler exists");
});

test("Preservation 5: Reports page includes propertyId and month params in CSV export", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/reports/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes("{ month }"), "Export CSV includes month param");
  assert.ok(fileContent.includes("params.propertyId = propertyId") || fileContent.includes('params.set("propertyId"'), "Export CSV includes propertyId param when set");
});

test("Preservation 6: Tenant page loads financials and generates statement PDF", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/tenant/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes("fetchTenantFinancials"), "fetchTenantFinancials function exists");
  assert.ok(fileContent.includes("generateStatementPDF"), "generateStatementPDF function exists");
  assert.ok(fileContent.includes("/statement"), "Calls backend statement endpoint");
});

test("Preservation 7: Reports page triggers fetch callbacks on filter change", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "frontend/app/payments/reports/page.tsx"), "utf8");
  
  assert.ok(fileContent.includes("fetchSummary()"), "Triggers fetchSummary");
  assert.ok(fileContent.includes("fetchPayments()"), "Triggers fetchPayments");
  assert.ok(fileContent.includes("fetchMom()"), "Triggers fetchMom");
  assert.ok(fileContent.includes("fetchExpenses()"), "Triggers fetchExpenses");
  assert.ok(fileContent.includes("fetchArrears()"), "Triggers fetchArrears");
});

test("Preservation 8: GET /api/expenses with no date params returns landlord expenses (3.10)", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/expenses.ts"), "utf8");
  
  assert.ok(fileContent.includes("property: {"), "Scopes expenses by property");
  assert.ok(fileContent.includes("landlordId: authReq.userId!"), "Scopes expenses by landlordId");
  assert.ok(fileContent.includes("db.expense.findMany"), "Executes findMany query");
});

test("Preservation 9: GET /api/leases with no search param returns landlord leases (3.11)", async () => {
  const fileContent = fs.readFileSync(path.join(ROOT, "backend/src/routes/leases.ts"), "utf8");
  
  assert.ok(fileContent.includes("property: { landlordId: authReq.userId }"), "Scopes leases by landlordId");
  assert.ok(fileContent.includes("db.lease.findMany"), "Executes findMany query");
});
