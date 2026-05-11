"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fmt } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton, MetricCard } from "../_lib/components";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import MonthPickerPopup from "@/app/components/ui/Monthpickerpopup";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReportCSV(csv: string): ReportSummary | null {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;
    // Extract KES amounts directly (handles commas from toLocaleString like 1,234,567)
    const row = lines[1];
    const matches = row.match(/KES\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+(?:\.[0-9]+)?)/g);
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

function methodColor(method: string) {
  switch (method.toLowerCase()) {
    case "mpesa":  return "#00ff87";
    case "card":   return "#6366f1";
    case "airtel": return "#f97316";
    case "bank":   return "#60a5fa";
    default:       return "#a78bfa";
  }
}

function categoryColor(cat: string) {
  switch (cat.toLowerCase()) {
    case "maintenance":  return "#f97316";
    case "utilities":    return "#60a5fa";
    case "salaries":     return "#a78bfa";
    case "insurance":    return "#fbbf24";
    case "repairs":      return "#ef4444";
    default:             return "#94a3b8";
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

  // ── GET /api/properties ───────────────────────────────────────────────────
  useEffect(() => {
    setLoadingProperties(true);
    api
      .get("/api/properties")
      .then((res) => setProperties(res.data ?? []))
      .catch((e: any) => setError(e?.response?.data?.error ?? e?.message ?? "Failed to load properties"))
      .finally(() => setLoadingProperties(false));
  }, []);

  // ── Single property+month report fetch ───────────────────────────────────
  const fetchReportForProperty = useCallback(async (pid: number, m: string): Promise<ReportSummary> => {
    const res = await api.get("/api/payments/reports", {
      params: { propertyId: pid, month: m },
      responseType: "text",
    });
    return parseReportCSV(res.data) ?? { revenue: 0, arrears: 0, expenses: 0, pl: 0 };
  }, []);

  // ── GET /api/payments/reports — summary metrics ───────────────────────────
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

  // ── GET /api/payments?status=paid ────────────────────────────────────────
const fetchPayments = useCallback(async () => {
  setLoadingPayments(true);
  try {
    const params: Record<string, string> = { status: "paid", month }; // ← add month
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

  // ── GET /api/payments/reports × 4 months — MoM chart ────────────────────
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

          const expenses = await fetchExpensesForMonth(m, propertyId); // ← real expenses

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

  // ── Trigger data fetches once properties are ready, and on filter changes ─
  useEffect(() => {
    if (loadingProperties) return;
    fetchSummary();
    fetchPayments();
    fetchMom();
    fetchExpenses(); 
  }, [loadingProperties, fetchSummary, fetchPayments, fetchMom, fetchExpenses]);

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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Filters / export */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ width: 300 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Property</div>
          <CustomDropdown
            options={propertyOptions}
            value={propertyId}
            onChange={(val) => setPropertyId(val)}
            labelKey="label"
            valueKey="value"
            minWidth="200px"
          />
        </div>
        <div style={{ width: 300 }}>
          <MonthPickerPopup
          label="Month"
          value={month}
          onChange={setMonth}
          placeholder="Select month"
        />
        </div>
        <NeonButton 
        variant="ghost" 
        onClick={() => { fetchSummary(); fetchPayments(); fetchMom(); fetchExpenses(); }}
        style={{padding: "13px 16px", width: "140px"}}
        >
          {loadingSummary ? "⟳ Loading…" : "↺ Refresh"}
        </NeonButton>
        <NeonButton
        variant="primary"
        onClick={handleExportCSV}
        style={{
         background: "linear-gradient(to right,var(--neon-blue),var(--neon-purple))",
         color: "white",
         border: "none",
         borderRadius: 12,
         padding: "12px 16px",
         fontWeight: 600,
         cursor: "pointer",
         width: "140px",
         fontSize: 13,
         textDecoration: "none",
         display: "inline-block",
        }}
       >
  📊 KRA Report
</NeonButton>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary metrics */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard 
        label="Revenue"  
        value={loadingSummary ? "…" : `KES ${(revenue / 1000).toFixed(0)}K`}  
        accent="linear-gradient(90deg,#00ff87,#0ea5e9)" 
        sparkData={momData.map((m) => m.revenue / 1000)} 
        sparkColor="#00ff87" 
        />

        <MetricCard 
        label="Arrears"  
        value={loadingSummary ? "…" : `KES ${(arrears / 1000).toFixed(0)}K`}  
        accent="linear-gradient(90deg,#ef4444,#f97316)" 
        />

        <MetricCard
          label="Expenses"
          value={loadingExpenses ? "…" : `KES ${(realExpensesTotal / 1000).toFixed(0)}K`}
          accent="linear-gradient(90deg,#fbbf24,#f97316)"
          sparkData={momData.map((m) => m.expenses / 1000)}
          sparkColor="#f97316"
        />

        <MetricCard 
        label="Net P&L"  
        value={loadingSummary ? "…" : `KES ${(pl / 1000).toFixed(0)}K`}       
        accent="linear-gradient(90deg,#6366f1,#00ff87)" 
        sparkData={momData.map((m) => m.pl / 1000)} sparkColor="#00ff87" 
        />
      </div>

      {/* MoM bar chart */}
  <GlassPanel>
  {/* Header */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
    }}
  >
    <div>
      <SectionTag>📈 Month-over-Month</SectionTag>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "rgba(255,255,255,0.38)",
          lineHeight: 1.5,
        }}
      >
        Monthly revenue and operational expenses comparison.
      </div>
    </div>
  </div>

  {loadingMom ? (
    <div
      style={{
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
      }}
    >
      Loading chart…
    </div>
  ) : (
    <div
      style={{
        marginTop: 8,
        position: "relative",
      }}
    >
      {/* Chart Area */}
      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        {/* Y AXIS */}
        <div
          style={{
            width: 52,
            height: 240,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingBottom: 28,
          }}
        >
          {[1, 0.75, 0.5, 0.25, 0].map((v, idx) => {
            const amount = maxVal * v;

            return (
              <div
                key={idx}
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.38)",
                  textAlign: "right",
                  paddingRight: 8,
                  transform: "translateY(6px)",
                }}
              >
                {amount >= 1000
                  ? `K${Math.round(amount / 1000)}k`
                  : `K${Math.round(amount)}`}
              </div>
            );
          })}
        </div>

        {/* GRAPH */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: 240,
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "0 10px 28px 14px",
          }}
        >
          {/* Horizontal Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${t * 100}%`,
                borderTop:
                  idx === 4
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px dashed rgba(255,255,255,0.06)",
              }}
            />
          ))}

          {/* Bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 8,
              height: "100%",
              position: "relative",
              zIndex: 2,
            }}
          >
            {momData.map((m) => {
              const revenueH = Math.max(
                6,
                (m.revenue / maxVal) * 180
              );

              const expensesH = Math.max(
                6,
                (m.expenses / maxVal) * 180
              );

              return (
                <div
                  key={m.month}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  {/* VALUES */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-end",
                      width: "100%",
                      height: 180,
                    }}
                  >
                    {/* Revenue */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#00ff87",
                          marginBottom: 6,
                          fontWeight: 700,
                        }}
                      >
                        {fmt(m.revenue)}
                      </div>

                      <div
                        title={`Revenue: ${fmt(m.revenue)}`}
                        style={{
                          width: "100%",
                          height: revenueH,
                          borderRadius: "10px 10px 4px 4px",
                          background:
                            "linear-gradient(to top, rgba(0,255,135,0.75), rgba(0,255,135,1))",
                          boxShadow:
                            "0 0 16px rgba(0,255,135,0.25)",
                          position: "relative",
                          overflow: "hidden",
                          transition: "height .4s ease",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Expenses */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#f97316",
                          marginBottom: 6,
                          fontWeight: 700,
                        }}
                      >
                        {fmt(m.expenses)}
                      </div>

                      <div
                        title={`Expenses: ${fmt(m.expenses)}`}
                        style={{
                          width: "100%",
                          height: expensesH,
                          borderRadius: "10px 10px 4px 4px",
                          background:
                            "linear-gradient(to top, rgba(249,115,22,0.75), rgba(249,115,22,1))",
                          boxShadow:
                            "0 0 16px rgba(249,115,22,0.22)",
                          position: "relative",
                          overflow: "hidden",
                          transition: "height .4s ease",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Month */}
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: ".03em",
                    }}
                  >
                    {shortMonth(m.month)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 18,
          paddingLeft: 58,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              background: "#00ff87",
              boxShadow: "0 0 10px rgba(0,255,135,0.4)",
            }}
          />
          Revenue
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              background: "#f97316",
              boxShadow: "0 0 10px rgba(249,115,22,0.4)",
            }}
          />
          Expenses
        </div>
      </div>
    </div>
  )}
</GlassPanel>

      {/* Grouped expenses table */}
<GlassPanel
  style={{
    padding: 0,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
  }}
>
  {/* Header */}
  <div
    style={{
      padding: "18px 22px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
    }}
  >
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".12em",
          color: "rgba(255,255,255,0.35)",
          marginBottom: 5,
        }}
      >
        Expense Analytics
      </div>

      <SectionTag>
        💸 Expenses — {shortMonth(month)} {month.slice(0, 4)}
      </SectionTag>
    </div>

    {loadingExpenses && (
      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        Loading…
      </span>
    )}
  </div>

  {/* Table Header */}
  {!loadingExpenses && expenses.length > 0 && (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.7fr 0.8fr 0.8fr 0.8fr auto",
        gap: 12,
        padding: "8px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.38)",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>Category</div>
      <div>Items</div>
      <div>Total</div>
      <div>Expand</div>
    </div>
  )}

  {/* Empty State */}
  {!loadingExpenses && expenses.length === 0 ? (
    <div
      style={{
        padding: "32px 20px",
        color: "rgba(255,255,255,0.3)",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      No expenses found for this period.
    </div>
  ) : (
    Object.entries(groupedExpenses).map(([category, group]) => {
      const color = categoryColor(category);
      const isOpen = expandedExpenses[category];

      return (
        <div
          key={category}
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Category Row */}
          <div
            onClick={() =>
              setExpandedExpenses((e) => ({
                ...e,
                [category]: !e[category],
              }))
            }
            style={{
              display: "grid",
              gridTemplateColumns: "1.7fr 0.8fr 0.8fr 0.8fr auto",
              gap: 12,
              alignItems: "center",
              padding: "8px 10px",
              fontSize: "10",
              cursor: "pointer",
              transition: "all .18s ease",
              background: isOpen
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.015)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isOpen
                ? "rgba(255,255,255,0.04)"
                : "rgba(255,255,255,0.015)";
            }}
          >
            {/* Category */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 12px ${color}`,
                }}
              />

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: `${color}15`,
                  color,
                  border: `1px solid ${color}40`,
                }}
              >
                {category}
              </span>
            </div>

            {/* Items */}
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
              }}
            >
              {group.items.length}
            </div>

            {/* Total */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {fmt(group.total)}
            </div>

            {/* Expand Button */}
            <button
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: isOpen
                  ? "1px solid rgba(0,255,135,0.35)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: isOpen
                  ? "rgba(0,255,135,0.12)"
                  : "rgba(255,255,255,0.03)",
                color: isOpen ? "#00ff87" : "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .2s ease",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {isOpen ? "−" : "+"}
            </button>
          </div>

          {/* Expanded Rows */}
          {isOpen &&
            group.items.map((e, idx) => (
              <div
                key={e.id}
                style={{
                  padding: "14px 24px 14px 52px",
                  background:
                    idx % 2 === 0
                      ? "rgba(0,0,0,0.14)"
                      : "rgba(255,255,255,0.015)",
                  borderTop: "1px solid rgba(255,255,255,0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    {e.description}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 5,
                      fontSize: 10,
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    <span>{e.property?.title ?? "—"}</span>

                    <span>
                      {new Date(e.date).toLocaleDateString("en-KE")}
                    </span>

                    {e.vendorAccount && (
                      <span
                        style={{
                          fontFamily: "monospace",
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {e.vendorAccount.identifier}
                      </span>
                    )}

                    {e.paymentStatus && (
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontWeight: 700,
                          background:
                            e.paymentStatus === "paid"
                              ? "rgba(0,255,135,0.12)"
                              : "rgba(239,68,68,0.12)",
                          color:
                            e.paymentStatus === "paid"
                              ? "#00ff87"
                              : "#ef4444",
                          border: `1px solid ${
                            e.paymentStatus === "paid"
                              ? "rgba(0,255,135,0.25)"
                              : "rgba(239,68,68,0.25)"
                          }`,
                        }}
                      >
                        {e.paymentStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {fmt(e.amount)}
                </div>
              </div>
            ))}
        </div>
      );
    })
  )}

  {/* Footer */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 22px",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      background:
        "linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
        letterSpacing: ".08em",
      }}
    >
      
    </div>

    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        Total Expenses
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
          marginTop: 3,
        }}
      >
        {fmt(realExpensesTotal)}
      </div>
    </div>
  </div>
</GlassPanel>
    </div>
  );
}