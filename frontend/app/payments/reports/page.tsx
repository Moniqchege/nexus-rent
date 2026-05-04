"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fmt } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton, MetricCard } from "../_lib/components";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReportCSV(csv: string): ReportSummary | null {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return null;
    const [, , revenue, arrears, expenses, pl] = lines[1].split(",");
    const parse = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
    return { revenue: parse(revenue), arrears: parse(arrears), expenses: parse(expenses), pl: parse(pl) };
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

  // ── GET /api/properties ───────────────────────────────────────────────────
  // Must resolve first — fetchSummary and fetchMom depend on the numeric IDs
  useEffect(() => {
    setLoadingProperties(true);
    api
      .get("/api/properties")
      .then((res) => setProperties(res.data ?? []))
      .catch((e: any) => setError(e?.response?.data?.error ?? e?.message ?? "Failed to load properties"))
      .finally(() => setLoadingProperties(false));
  }, []);

  // ── Single property+month report fetch ───────────────────────────────────
  // Always uses p.id (number) so the endpoint gets e.g. propertyId=2, not "Green Park"
  const fetchReportForProperty = useCallback(async (pid: number, m: string): Promise<ReportSummary> => {
    const res = await api.get("/api/payments/reports", {
      params: { propertyId: pid, month: m },
      responseType: "text",
    });
    return parseReportCSV(res.data) ?? { revenue: 0, arrears: 0, expenses: 0, pl: 0 };
  }, []);

  // ── GET /api/payments/reports — summary metrics ───────────────────────────
  // Skips until properties are loaded so the fan-out has real IDs to work with
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
      const params: Record<string, string> = { status: "paid" };
      if (propertyId !== "all") params.propertyId = propertyId;
      const res = await api.get("/api/payments", { params });
      setPayments(res.data.payments ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? "Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [propertyId]);

  // ── GET /api/payments/reports × 4 months — MoM chart ────────────────────
  // Same guard: skips until properties are loaded
  const fetchMom = useCallback(async () => {
    if (loadingProperties || properties.length === 0) return;
    setLoadingMom(true);
    try {
      const months = Array.from({ length: MONTHS_BACK }, (_, i) => monthLabel(MONTHS_BACK - 1 - i));
      const results = await Promise.all(
        months.map(async (m) => {
          try {
            let r: ReportSummary;
            if (propertyId !== "all") {
              r = await fetchReportForProperty(Number(propertyId), m);
            } else {
              const all = await Promise.all(properties.map((p) => fetchReportForProperty(p.id, m)));
              r = sumSummaries(all);
            }
            return { month: m, revenue: r.revenue, expenses: r.expenses, pl: r.pl };
          } catch {
            return { month: m, revenue: 0, expenses: 0, pl: 0 };
          }
        })
      );
      setMomData(results);
    } finally {
      setLoadingMom(false);
    }
  }, [propertyId, properties, loadingProperties, fetchReportForProperty]);

  // ── Trigger data fetches once properties are ready, and on filter changes ─
  useEffect(() => {
    if (loadingProperties) return;
    fetchSummary();
    fetchPayments();
    fetchMom();
  }, [loadingProperties, fetchSummary, fetchPayments, fetchMom]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const revenue  = summary?.revenue  ?? 0;
  const arrears  = summary?.arrears  ?? 0;
  const totalExp = summary?.expenses ?? 0;
  const pl       = summary?.pl       ?? 0;

  const grouped = payments.reduce((acc, p) => {
    const key = p.method.charAt(0).toUpperCase() + p.method.slice(1);
    if (!acc[key]) acc[key] = { total: 0, items: [] as Payment[] };
    acc[key].total += p.amount;
    acc[key].items.push(p);
    return acc;
  }, {} as Record<string, { total: number; items: Payment[] }>);

  const maxVal = Math.max(...momData.map((m) => m.revenue), 1);

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
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Month</div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 13 }}
          />
        </div>
        <NeonButton 
        variant="ghost" 
        onClick={() => { fetchSummary(); fetchPayments(); fetchMom(); }}
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
        <MetricCard label="Revenue"  value={loadingSummary ? "…" : `KES ${(revenue / 1000).toFixed(0)}K`}  accent="linear-gradient(90deg,#00ff87,#0ea5e9)" sparkData={momData.map((m) => m.revenue / 1000)} sparkColor="#00ff87" />
        <MetricCard label="Arrears"  value={loadingSummary ? "…" : `KES ${(arrears / 1000).toFixed(0)}K`}  accent="linear-gradient(90deg,#ef4444,#f97316)" />
        <MetricCard label="Expenses" value={loadingSummary ? "…" : `KES ${(totalExp / 1000).toFixed(0)}K`} accent="linear-gradient(90deg,#fbbf24,#f97316)" sparkData={momData.map((m) => m.expenses / 1000)} sparkColor="#f97316" />
        <MetricCard label="Net P&L"  value={loadingSummary ? "…" : `KES ${(pl / 1000).toFixed(0)}K`}       accent="linear-gradient(90deg,#6366f1,#00ff87)" sparkData={momData.map((m) => m.pl / 1000)} sparkColor="#00ff87" />
      </div>

      {/* MoM bar chart */}
      <GlassPanel>
        <SectionTag>📈 Month-over-Month (KES thousands)</SectionTag>
        {loadingMom ? (
          <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 16 }}>
            Loading chart…
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, marginTop: 16, padding: "0 8px" }}>
            {momData.map((m) => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
                  {[{ val: m.revenue, color: "#00ff87" }, { val: m.expenses, color: "#f97316" }].map((bar, i) => (
                    <div key={i} title={`KES ${bar.val.toLocaleString()}`} style={{ flex: 1, height: `${Math.max(2, (bar.val / maxVal) * 80)}px`, background: bar.color, borderRadius: "3px 3px 0 0", opacity: 0.8, boxShadow: `0 0 6px ${bar.color}40`, transition: "height .4s" }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{shortMonth(m.month)}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, alignSelf: "flex-start", marginTop: -4, marginLeft: 12 }}>
              {[["Revenue","#00ff87"],["Expenses","#f97316"]].map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />{l}
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Grouped payments table */}
      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTag>🧾 Payments — {shortMonth(month)} {month.slice(0, 4)} (by Method)</SectionTag>
          {loadingPayments && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Loading…</span>}
        </div>

        {!loadingPayments && payments.length === 0 ? (
          <div style={{ padding: "24px 20px", color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center" }}>
            No payments found for this period.
          </div>
        ) : (
          Object.entries(grouped).map(([method, group]) => {
            const color = methodColor(method);
            const isOpen = expanded[method];
            return (
              <div key={method}>
                <div
                  onClick={() => setExpanded((e) => ({ ...e, [method]: !e[method] }))}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "background .1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}40` }}>{method}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{group.items.length} payment{group.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(group.total)}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isOpen && group.items.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 10px 36px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(0,0,0,0.1)" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{p.tenant?.name ?? "Unknown Tenant"}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {p.property?.title ?? "—"} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-KE") : p.createdAt?.slice(0, 10)}
                        {p.referenceId && <> · <span style={{ fontFamily: "monospace" }}>{p.referenceId.slice(0, 20)}</span></>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            );
          })
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>Total Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 2 }}>{fmt(revenue)}</div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}