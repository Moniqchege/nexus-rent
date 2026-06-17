"use client";

import { useState, useEffect, useCallback, useMemo, CSSProperties } from "react";
import { fmt } from "../_lib/data";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import MonthPickerPopup from "@/app/components/ui/Monthpickerpopup";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportSummary {
  revenue: number;
  arrears: number;
  expenses: number;
  pl: number;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  referenceId: string;
  paidAt?: string;
  createdAt: string;
  tenant: { name: string };
  property: { title: string };
}

interface Property {
  id: number;
  title: string;
}

interface Expense {
  id: number;
  propertyId: number;
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentStatus: string;
  mpesaPaidTo?: string;
  property: { id: number; title: string };
  vendorAccount?: { id: number; name: string; identifier: string };
}

interface Schedule {
  id: number;
  amount: number;
  status: string;
  dueDate: string;
  allocatedAmount?: number;
  lateFeeAmount?: number;
  tenant?: { name: string };
  property?: { title: string };
  tenantId?: number;
  propertyId?: number;
}

interface ScheduleGroup {
  total: number;
  items: Schedule[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReportCSV(csv: string): ReportSummary | null {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;
    const row = lines[1];
    const matches = row.match(/ksh\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+(?:\.[0-9]+)?)/g);
    if (!matches || matches.length < 4) return null;

    const parseKES = (s: string) => {
      const numeric = s.replace(/[^0-9.,]/g, "");
      const normalized = numeric.replace(/,/g, "");
      return parseFloat(normalized) || 0;
    };

    return { revenue: parseKES(matches[0]), arrears: parseKES(matches[1]), expenses: parseKES(matches[2]), pl: parseKES(matches[3]) };
  } catch {
    return null;
  }
}

function sumSummaries(all: ReportSummary[]): ReportSummary {
  return all.reduce(
    (acc, r) => ({
      revenue:  acc.revenue  + r.revenue,
      arrears:  acc.arrears  + r.arrears,
      expenses: acc.expenses + r.expenses,
      pl:       acc.pl       + r.pl,
    }),
    { revenue: 0, arrears: 0, expenses: 0, pl: 0 },
  );
}

const MONTHS_BACK = 4;

function monthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7);
}

function shortMonth(ym: string) {
  const [, m] = ym.split("-");
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1];
}

function categoryColor(cat: string) {
  switch (cat.toLowerCase()) {
    case "maintenance":  return { bg: "#f97316", light: "#ffedd5" };
    case "utilities":    return { bg: "#3b82f6", light: "#dbeafe" };
    case "salaries":     return { bg: "#8b5cf6", light: "#f3e8ff" };
    case "insurance":    return { bg: "#f59e0b", light: "#fef3c7" };
    case "repairs":      return { bg: "#ef4444", light: "#fee2e2" };
    default:             return { bg: "#6b7280", light: "#f3f4f6" };
  }
}

function scheduleStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "overdue":   return { bg: "#ef4444", light: "#fee2e2" };
    case "partial":   return { bg: "#f59e0b", light: "#fef3c7" };
    case "scheduled": return { bg: "#3b82f6", light: "#dbeafe" };
    case "paid":      return { bg: "#10b981", light: "#d1fae5" };
    default:          return { bg: "#6b7280", light: "#f3f4f6" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [propertyId, setPropertyId] = useState<string>("all");
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [momData, setMomData] = useState<{ month: string; revenue: number; expenses: number; pl: number }[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingMom, setLoadingMom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expandedExpenses, setExpandedExpenses] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const router = useRouter();

  // ── GET /api/properties ───────────────────────────────────────────────────
  useEffect(() => {
    setLoadingProperties(true);
    api
      .get("/api/properties")
      .then((res) => setProperties(res.data ?? []))
      .catch((e: any) => setError(e?.response?.data?.error ?? e?.message ?? "Failed to load properties"))
      .finally(() => setLoadingProperties(false));
  }, []);

  const fetchReportForProperty = useCallback(async (pid: number, m: string): Promise<ReportSummary> => {
    const res = await api.get("/api/payments/reports", {
      params: { propertyId: pid, month: m },
      responseType: "text",
    });
    return parseReportCSV(res.data) ?? { revenue: 0, arrears: 0, expenses: 0, pl: 0 };
  }, []);

  const fetchSummary = useCallback(async () => {
    if (loadingProperties || properties.length === 0) return;
    setLoadingSummary(true);
    setError(null);
    try {
      if (propertyId !== "all") {
        setSummary(await fetchReportForProperty(Number(propertyId), month));
      } else {
        const all = await Promise.all(properties.map((p) => fetchReportForProperty(p.id, month)));
        setSummary(sumSummaries(all));
      }
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load summary");
    } finally {
      setLoadingSummary(false);
    }
  }, [propertyId, month, properties, loadingProperties, fetchReportForProperty]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const params: Record<string, string> = { status: "paid", month };
      if (propertyId !== "all") params.propertyId = propertyId;
      const res = await api.get("/api/payments", { params });
      setPayments(res.data.payments ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [propertyId, month]); 

  const fetchExpensesForMonth = useCallback(async (m: string, pid: string): Promise<number> => {
    const params: Record<string, string> = { month: m };
    if (pid !== "all") params.propertyId = pid;
    const res = await api.get("/api/expenses", { params });
    const items: Expense[] = res.data?.expenses ?? [];
    return items
      .filter((e) => e.date.slice(0, 7) === m)
      .reduce((sum, e) => sum + e.amount, 0);
  }, []);

  const fetchMom = useCallback(async () => {
    if (loadingProperties || properties.length === 0) return;
    setLoadingMom(true);
    try {
      const months = Array.from({ length: MONTHS_BACK }, (_, i) => monthLabel(MONTHS_BACK - 1 - i));
      const results = await Promise.all(
        months.map(async (m) => {
          try {
            let revenue = 0;
            let pl = 0;

            if (propertyId !== "all") {
              const r = await fetchReportForProperty(Number(propertyId), m);
              revenue = r.revenue;
              pl = r.pl;
            } else {
              const all = await Promise.all(properties.map((p) => fetchReportForProperty(p.id, m)));
              const summed = sumSummaries(all);
              revenue = summed.revenue;
              pl = summed.pl;
            }

            const expenses = await fetchExpensesForMonth(m, propertyId);

            return { month: m, revenue, expenses, pl };
          } catch {
            return { month: m, revenue: 0, expenses: 0, pl: 0 };
          }
        })
      );
      setMomData(results);
    } finally {
      setLoadingMom(false);
    }
  }, [propertyId, properties, loadingProperties, fetchReportForProperty, fetchExpensesForMonth]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params: Record<string, string> = {};
      if (propertyId !== "all") params.propertyId = propertyId;
      params.month = month; 
      const res = await api.get("/api/expenses", { params });
      setExpenses(res.data?.expenses ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load expenses");
    } finally {
      setLoadingExpenses(false);
    }
  }, [propertyId, month]);

  const fetchArrears = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const params: Record<string, string> = {};
      if (propertyId !== "all") params.propertyId = propertyId;
      const res = await api.get("/api/payments/schedules", { params });
      setSchedules(res.data?.schedules ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load arrears");
    } finally {
      setLoadingSchedules(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (loadingProperties) return;
    fetchSummary();
    fetchPayments();
    fetchMom();
    fetchExpenses(); 
    fetchArrears();
  }, [loadingProperties, fetchSummary, fetchPayments, fetchMom, fetchExpenses, fetchArrears]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const revenue  = summary?.revenue  ?? 0;
  const arrears  = summary?.arrears  ?? 0;
  const totalExp = summary?.expenses ?? 0;
  const pl       = summary?.pl       ?? 0;

  const realExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredExpenses = expenses.filter((e) => e.date.slice(0, 7) === month);

  const grouped = payments.reduce((acc, p) => {
    const key = p.method.charAt(0).toUpperCase() + p.method.slice(1);
    if (!acc[key]) acc[key] = { total: 0, items: [] as Payment[] };
    acc[key].total += p.amount;
    acc[key].items.push(p);
    return acc;
  }, {} as Record<string, { total: number; items: Payment[] }>);

  const groupedExpenses = expenses.reduce((acc, e) => {
    const key = e.category;
    if (!acc[key]) acc[key] = { total: 0, items: [] as Expense[] };
    acc[key].total += e.amount;
    acc[key].items.push(e);
    return acc;
  }, {} as Record<string, { total: number; items: Expense[] }>);

  const filteredSchedules = useMemo(
  () => schedules.filter((s) => s.dueDate && s.dueDate.slice(0, 7) === month),
  [schedules, month]
);

const groupedSchedules = useMemo(() => {
  return filteredSchedules.reduce((acc, s) => {
    const allocated = s.allocatedAmount ?? 0;
    const lateFee = s.lateFeeAmount ?? 0;
    const isFullyPaid = allocated >= s.amount;

    let key: string;
    let outstanding: number;

    if (s.status === "overdue" && !isFullyPaid) {
      key = "Overdue";
      outstanding = Math.max(0, s.amount + lateFee - allocated);
    } else if (allocated > 0 && !isFullyPaid) {
      key = "Partial";
      outstanding = s.amount - allocated;
    } else if (s.status === "scheduled") {
      key = "Scheduled";
      outstanding = s.amount;
    } else {
      key = "Paid";
      outstanding = s.amount;
    }

    if (!acc[key]) acc[key] = { total: 0, items: [] as typeof schedules };
    acc[key].total += outstanding;
    acc[key].items.push(s);
    return acc;
  }, {} as Record<string, { total: number; items: typeof schedules }>);
}, [filteredSchedules]);

const scheduleTotal = useMemo(
  () => Object.values(groupedSchedules).reduce((sum, g) => sum + g.total, 0),
  [groupedSchedules]
);

  const arrearsBySchedule = useMemo(() => {
    return schedules
      .filter((s) => s.status === "overdue" || s.status === "partial")
      .reduce((sum, s) => {
        const totalDue = s.amount + (s.lateFeeAmount ?? 0);
        const paid     = s.allocatedAmount ?? 0;
        return sum + Math.max(0, totalDue - paid);
      }, 0);
  }, [schedules]);

  const maxVal = Math.max(
    1,
    ...momData.map((m) => Math.max(m.revenue, m.expenses, Math.abs(m.pl)))
  );

  const propertyOptions = useMemo(() => [
    { label: "All Properties", value: "all" },
    ...properties.map((p) => ({ label: p.title, value: String(p.id) })),
  ], [properties]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({ month });
    if (propertyId !== "all") params.set("propertyId", propertyId);
    window.open(`/api/payments/reports?${params}`, "_blank");
  };

  const getChangePercent = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return (((current - prev) / prev) * 100).toFixed(1);
  };

  const prevMonthData = momData[momData.length - 2];
  const currMonthData = momData[momData.length - 1];

  const cardBase: CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  border: "1px solid rgba(15, 23, 42, 0.06)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
  position: "relative",
  overflow: "hidden",
};

const getCardAccent = (color: string): CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  background: color,
  borderRadius: "16px 0 0 16px",
});

const metricIcons = {
  revenue: "trending_up",
  arrears: "schedule",
  expenses: "payments",
  profit: "account_balance_wallet",
};

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Metric Cards - Stich AI style */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 22 }}>
          
          {/* Revenue Card */}
          <div style={{ ...cardBase, paddingLeft: 20 }}>
            <div style={getCardAccent("#4f46e5")} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ width: 35, height: 25, borderRadius: 10, background: "rgba(99, 102, 241, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                 <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {metricIcons.revenue}
                </span>
              </div>
              <div style={{ backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#16a34a" }}>
                +{getChangePercent(revenue, prevMonthData?.revenue || revenue)}%
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Revenue
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {loadingSummary ? "…" : `ksh ${(revenue / 1000).toFixed(0)}K`}
            </h3>
          </div>

          {/* Arrears Card */}
          <div style={{ ...cardBase, paddingLeft: 20 }}>
            <div style={getCardAccent("#ef4444")} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ width: 35, height: 25, borderRadius: 10, backgroundColor: "rgba(99, 102, 241, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {metricIcons.arrears}
                </span>
              </div>
              <div style={{ backgroundColor: "#fee2e2", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#991b1b" }}>
                +{getChangePercent(arrearsBySchedule, summary?.arrears || arrearsBySchedule)}%
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Arrears
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {loadingSchedules ? "…" : `ksh ${(arrearsBySchedule / 1000).toFixed(0)}K`}
            </h3>
          </div>

          {/* Expenses Card */}
          <div style={{ ...cardBase, paddingLeft: 20 }}>
            <div style={getCardAccent("#f97316")} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ width: 35, height: 25, borderRadius: 10, backgroundColor: "#fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {metricIcons.expenses}
                </span>
              </div>
              <div style={{ backgroundColor: "#fee2e2", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#991b1b" }}>
                +{getChangePercent(realExpensesTotal, prevMonthData?.expenses || realExpensesTotal)}%
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Expenses
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {loadingExpenses ? "…" : `ksh ${(realExpensesTotal / 1000).toFixed(0)}K`}
            </h3>
          </div>

          {/* Net P&L Card */}
          <div style={{ ...cardBase, paddingLeft: 20 }}>
            <div style={getCardAccent("#10b981")} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ width: 35, height: 25, borderRadius: 10, backgroundColor: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {metricIcons.profit}
                </span>
              </div>
              <div style={{ backgroundColor: "#dcfce7", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#16a34a" }}>
                +{getChangePercent(pl, prevMonthData?.pl || pl)}%
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Net Profit
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>
              {loadingSummary ? "…" : `ksh ${(pl / 1000).toFixed(0)}K`}
            </h3>
          </div>

        </div>
         {/* Filters & Actions */}
        <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
              Property
            </label>
            <CustomDropdown
              options={propertyOptions}
              value={propertyId}
              onChange={(val) => setPropertyId(val)}
              labelKey="label"
              valueKey="value"
              minWidth="180px"
            />
          </div>

          <div style={{ width: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
              Month
            </label>
            <MonthPickerPopup
              label=""
              value={month}
              onChange={setMonth}
              placeholder="Select month"
            />
          </div>

          <button
            onClick={() => { fetchSummary(); fetchPayments(); fetchMom(); fetchExpenses(); }}
            style={{
              padding: "13px 24px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
              color: "#374151",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
          >
            ↺ Refresh
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              backgroundColor: "var(--neon-blue)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4338ca"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
          >
             KRA Report
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, marginBottom: 24 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Month-over-Month Chart */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          marginBottom: 22
        }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Revenue vs Expenses
            </h3>
            <p style={{ fontSize: 11, color: "#6b7280" }}>
              Comparison across the last 4 months
            </p>
          </div>

          {loadingMom ? (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
              Loading chart…
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16, height: 280, alignItems: "flex-end", paddingBottom: 12 }}>
              {momData.map((m, i) => {
                const revenueH = (m.revenue / maxVal) * 220;
                const expensesH = (m.expenses / maxVal) * 220;
                
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 220, width: "50%" }}>
                      {/* Revenue Bar */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>
                          {(m.revenue / 1000).toFixed(0)}K
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: revenueH,
                            backgroundColor: "#4f46e5",
                            borderRadius: "8px 8px 0 0",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>

                      {/* Expenses Bar */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#d1d5db", marginBottom: 4 }}>
                          {(m.expenses / 1000).toFixed(0)}K
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: expensesH,
                            backgroundColor: "#f2bb46",
                            borderRadius: "8px 8px 0 0",
                            transition: "all 0.3s"
                          }}
                        />
                      </div>
                    </div>

                    {/* Month Label */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                      {shortMonth(m.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, backgroundColor: "#4f46e5", borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Revenue</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, backgroundColor: "#f2bb46", borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Expenses</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
    Rent Schedule Analytics - Two Column Layout (Table + Pie Chart)
    ═════════════════════════════════════════════════════════════════════ */}
<div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 200px", gap: 6, marginTop: 32 }}>

  {/* LEFT: Recent Schedules Table */}
  <div style={{
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    overflow: "hidden"
  }}>
    <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
        Rent Schedules
      </h3>
      <button
  onClick={() => router.push("/payments/schedules")}
  style={{
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    backgroundColor: "#fff",
    color: "var(--neon-blue)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "var(--neon-blue)";
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.borderColor = "var(--neon-blue)";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(79,70,229,0.15)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#fff";
    e.currentTarget.style.color = "var(--neon-blue)";
    e.currentTarget.style.borderColor = "#e5e7eb";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }}
>
  View All
</button>
      </div>
      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
        All schedules due in {shortMonth(month)}
      </p>
    </div>

    {loadingSchedules ? (
      <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
        Loading schedules…
      </div>
    ) : filteredSchedules.length === 0 ? (
      <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
        No schedules found for this period.
      </div>
    ) : (
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.2fr 0.9fr 0.8fr",
          gap: 16,
          padding: "11px 24px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: 10,
          fontWeight: 700,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          <div>Due Date</div>
          <div>Tenant</div>
          <div>Amount</div>
          <div>Status</div>
        </div>

        {filteredSchedules.slice(0, 5).map((s) => {
          const colors = scheduleStatusColor(s.status);
          return (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "0.9fr 1.2fr 0.9fr 0.8fr",
                gap: 16,
                alignItems: "center",
                padding: "10px 24px",
                borderBottom: "1px solid #e5e7eb",
                transition: "all 0.2s"
              }}
              onMouseEnter={(evt) => evt.currentTarget.style.backgroundColor = "#f9fafb"}
              onMouseLeave={(evt) => evt.currentTarget.style.backgroundColor = "#fff"}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                {new Date(s.dueDate).toLocaleDateString("en-KE")}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                  {s.tenant?.name ?? `Tenant ${s.tenantId}`}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>
                  {s.property?.title ?? `Property ${s.propertyId}`}
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>
                {fmt(s.amount)}
              </div>

              <div>
                <span style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  backgroundColor: colors.light,
                  color: colors.bg,
                  border: `1px solid ${colors.bg}30`
                }}>
                  {s.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* RIGHT: Schedule Breakdown Pie Chart */}
  <div style={{
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }}>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 24, alignSelf: "flex-start" }}>
      Schedule Breakdown
    </h3>

    {loadingSchedules ? (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        Loading…
      </div>
    ) : Object.keys(groupedSchedules).length === 0 ? (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", textAlign: "center", fontSize: 12 }}>
        No schedules to display
      </div>
    ) : (
      <>
        <div style={{ position: "relative", width: 180, height: 180, marginBottom: 24 }}>
          <svg viewBox="0 0 180 180" style={{ width: "100%", height: "100%" }}>
            {(() => {
              let offset = 0;
              const entries = Object.entries(groupedSchedules);
              const total = entries.reduce((sum, [, g]) => sum + g.total, 0);

              return entries.map(([status, group], idx) => {
                const colors = scheduleStatusColor(status);
                const percentage = total > 0 ? (group.total / total) * 100 : 0;
                const circumference = 2 * Math.PI * 45;
                const strokeDashoffset = circumference * (1 - percentage / 100);
                const rotation = total > 0 ? (offset / total) * 360 : 0;

                const circle = (
                  <circle
                    key={`${status}-${idx}`}
                    cx="90"
                    cy="90"
                    r="45"
                    fill="none"
                    stroke={colors.bg}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: "90px 90px",
                      transition: "all 0.3s"
                    }}
                  />
                );
                offset += group.total;
                return circle;
              });
            })()}
          </svg>

          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#111827" }}>
              {fmt(scheduleTotal)}
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>
              Total
            </div>
          </div>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(groupedSchedules)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([status, group]) => {
              const colors = scheduleStatusColor(status);
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                    <span style={{ fontSize: 8, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#111827", textAlign: "right" }}>
                    {fmt(group.total)}
                  </div>
                </div>
              );
            })}
        </div>
      </>
    )}
  </div>
</div>

        {/* ═════════════════════════════════════════════════════════════════════
            REFACTORED: Expense Analytics - Two Column Layout (Table + Pie Chart)
            ═════════════════════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 200px", gap: 6, marginTop: 22}}>
          
          {/* LEFT: Recent Expenses Table */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            overflow: "hidden"
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb"
            }}>
              <div
                style={{
                 display: "flex",
                 justifyContent: "space-between",
                 alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Recent Expenses
              </h3>
             <button
  onClick={() => router.push("/payments/schedules")}
  style={{
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    backgroundColor: "#fff",
    color: "var(--neon-blue)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "var(--neon-blue)";
    e.currentTarget.style.color = "#fff";
    e.currentTarget.style.borderColor = "var(--neon-blue)";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(79,70,229,0.15)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#fff";
    e.currentTarget.style.color = "var(--neon-blue)";
    e.currentTarget.style.borderColor = "#e5e7eb";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }}
>
  View All
</button>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              All expenses for {shortMonth(month)}
            </p>
            </div>

            {loadingExpenses ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                Loading expenses…
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                No expenses found for this period.
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr 0.9fr 0.8fr",
                  gap: 16,
                  padding: "11px 24px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  <div>Date</div>
                  <div>Category</div>
                  <div>Total</div>
                  <div>Status</div>
                </div>

                {/* Rows - Show top 8 recent expenses */}
                {filteredExpenses.slice(0, 5).map((e) => {
                  const colors = categoryColor(e.category);
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1.2fr 0.9fr 0.8fr",
                        gap: 16,
                        alignItems: "center",
                        padding: "10px 24px",
                        borderBottom: "1px solid #e5e7eb",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(evt) => evt.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseLeave={(evt) => evt.currentTarget.style.backgroundColor = "#fff"}
                    >
                      {/* Date */}
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                        {new Date(e.date).toLocaleDateString("en-KE")}
                      </div>

                      {/* Category Badge */}
                      <div>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: colors.light,
                          color: colors.bg,
                          border: `1px solid ${colors.bg}30`
                        }}>
                          {e.category}
                        </span>
                      </div>

                      {/* Amount */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>
                        {fmt(e.amount)}
                      </div>

                      {/* Status Badge */}
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: e.paymentStatus === "paid" ? "#dcfce7" : "#fee2e2",
                            color: e.paymentStatus === "paid" ? "#16a34a" : "#991b1b",
                            border: `1px solid ${e.paymentStatus === "paid" ? "#bbf7d0" : "#fecaca"}`
                          }}
                        >
                          {e.paymentStatus ? e.paymentStatus.toUpperCase() : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Expense Breakdown Pie Chart */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e5e7eb",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 24, alignSelf: "flex-start" }}>
              Expense Breakdown
            </h3>

            {loadingExpenses ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                Loading…
              </div>
            ) : Object.keys(groupedExpenses).length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", textAlign: "center", fontSize: 12 }}>
                No expenses to display
              </div>
            ) : (
              <>
                {/* Donut Chart - SVG */}
                <div style={{ position: "relative", width: 180, height: 180, marginBottom: 24 }}>
                  <svg viewBox="0 0 180 180" style={{ width: "100%", height: "100%" }}>
                    {(() => {
                      let offset = 0;
                      const categoryEntries = Object.entries(groupedExpenses);
                      const total = categoryEntries.reduce((sum, [, group]) => sum + group.total, 0);
                      
                      return categoryEntries.map(([category, group], idx) => {
                        const colors = categoryColor(category);
                        const percentage = (group.total / total) * 100;
                        const circumference = 2 * Math.PI * 45;
                        const strokeDashoffset = circumference * (1 - percentage / 100);
                        const rotation = (offset / total) * 360;
                        
                        const circle = (
                          <circle
                            key={`${category}-${idx}`}
                            cx="90"
                            cy="90"
                            r="45"
                            fill="none"
                            stroke={colors.bg}
                            strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{
                              transform: `rotate(${rotation}deg)`,
                              transformOrigin: "90px 90px",
                              transition: "all 0.3s"
                            }}
                          />
                        );
                        offset += group.total;
                        return circle;
                      });
                    })()}
                  </svg>
                  
                  {/* Center Text */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#111827" }}>
                      {fmt(realExpensesTotal)}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>
                      Total
                    </div>
                  </div>
                </div>

                {/* Category List */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.entries(groupedExpenses)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 4)
                    .map(([category, group]) => {
                      const colors = categoryColor(category);
                      return (
                        <div key={category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                            <span style={{ fontSize: 8, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {category}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#111827", textAlign: "right" }}>
                            -{fmt(group.total)}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* View All Expenses Link */}
                {Object.keys(groupedExpenses).length > 4 && (
                  <button
                    onClick={() => {
                      setExpandedExpenses(
                        Object.keys(groupedExpenses).reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
                      );
                    }}
                    style={{
                      marginTop: 16,
                      padding: 0,
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    View All Expenses →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}