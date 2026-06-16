"use client";

import { useState, useEffect } from "react";
import {
  fmt,
  METHOD_LABEL,
  METHOD_COLOR,
  METHOD_ICON,
} from "../_lib/data";

import {
  getPayments,
  getRentSchedules,
  getPaymentReport,
} from "../../lib/payments";

import type { PayMethod, PayStatus } from "../_lib/types";
import type { Payment, RentSchedule } from "../../../types/payment";

// ─── helpers ────────────────────────────────────────────────────────────────
function sumByStatus(payments: Payment[], status: string) {
  return payments
    .filter((p) => p.status === status)
    .reduce((s, p) => s + p.amount, 0);
}
function countByStatus(payments: Payment[], status: string) {
  return payments.filter((p) => p.status === status).length;
}

// ─── mock cash-flow data (replace with real endpoint when ready) ─────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const INFLOW  = [5200, 6800, 4900, 9600, 5100, 4200, 3800];
const OUTFLOW = [3100, 4200, 3600, 5800, 3900, 2900, 2600];

// ─── tiny SVG area chart ─────────────────────────────────────────────────────
function AreaChart({
  data,
  color,
  fill,
  width = 560,
  height = 200,
}: {
  data: number[];
  color: string;
  fill: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data) * 1.1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  const poly = pts.join(" ");
  const area = `${pts[0]} ${poly} ${width},${height} 0,${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={fill} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── METHOD icons (simple SVG stand-ins) ─────────────────────────────────────
const METHOD_SVG: Record<string, string> = {
  bank_transfer: "account_balance",
  credit_card: "credit_card",
  cash: "sync",
};

// ─── STATUS badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:      { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
    pending:   { bg: "#fef9c3", color: "#ca8a04", label: "Processing" },
    overdue:   { bg: "#fee2e2", color: "#dc2626", label: "Critical" },
  };
  const cfg = map[status] ?? { bg: "#f1f5f9", color: "#475569", label: status };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── PROPERTY status badge ─────────────────────────────────────────────────
function PropBadge({ label }: { label: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Healthy:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    Warning:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    Critical: { bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
  };
  const cfg = map[label] ?? { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 8,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {label}
    </span>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [schedules, setSchedules]   = useState<RentSchedule[]>([]);
  const [activityFilter, setActivityFilter] = useState<"all" | PayStatus>("all");
  const [chartRange, setChartRange] = useState<"7" | "30">("7");

  useEffect(() => {
    async function load() {
      const [p, s] = await Promise.all([getPayments(), getRentSchedules()]);
      setPayments(p);
      setSchedules(s);
    }
    load();
  }, []);

  const collected = sumByStatus(payments, "paid");
  const arrears   = sumByStatus(payments, "overdue");
  const pending   = sumByStatus(payments, "pending");
  const expenses  = 128900; // placeholder until endpoint exists
  const total     = collected + arrears + pending;
  const rate      = total ? ((collected / total) * 100).toFixed(1) : "0.0";

  const methodTotals = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);
  const methodEntries = Object.entries(methodTotals) as [PayMethod, number][];

  // property summary derived from payments
  const propertyMap = new Map<string, { id: number; title: string; revenue: number; occupancy: string; status: string }>();
  payments.forEach((p) => {
    const key = String(p.propertyId);
    if (!propertyMap.has(key)) {
      propertyMap.set(key, {
        id: p.propertyId,
        title: p.property?.title ?? `Property ${p.propertyId}`,
        revenue: 0,
        occupancy: "—",
        status: "Healthy",
      });
    }
    const entry = propertyMap.get(key)!;
    if (p.status === "paid") entry.revenue += p.amount;
    if (p.status === "overdue") entry.status = "Critical";
    else if (p.status === "pending" && entry.status !== "Critical") entry.status = "Warning";
  });
  const propertyRows = Array.from(propertyMap.values());

  const filteredActivity = payments
    .filter((p) => activityFilter === "all" || p.status === activityFilter)
    .slice(0, 5);

  function handleDownloadReport(propertyId: number) {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    getPaymentReport(propertyId, month);
  }

  // avg inflow / outflow
  const avgIn  = Math.round(INFLOW.reduce((a, b) => a + b, 0) / INFLOW.length);
  const avgOut = Math.round(OUTFLOW.reduce((a, b) => a + b, 0) / OUTFLOW.length);

  // ─── styles ───────────────────────────────────────────────────────────────
  const S = {
    card: {
      background: "#ffffff",
      border: "1px solid #e8eaf0",
      borderRadius: 14,
      padding: 18,
      boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
    } as React.CSSProperties,

    label: {
      fontSize: 10,
      textTransform: "uppercase" as const,
      letterSpacing: "0.09em",
      color: "#94a3b8",
      fontWeight: 600,
    } as React.CSSProperties,

    h3: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    } as React.CSSProperties,

    sub: {
      fontSize: 11,
      color: "#94a3b8",
      marginTop: 2,
    } as React.CSSProperties,
  };

  return (
    <div style={{ padding: "18px 20px 32px", background: "#f6f7fb", minHeight: "100%" }}>

      {/* ── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            label: "Collected",
            value: `$${(collected / 1000).toFixed(1)}K`,
            sub: "+12% from last month",
            accent: "#0f172a",
          },
          {
            label: "Arrears",
            value: `$${(arrears / 1000).toFixed(1)}K`,
            sub: `${countByStatus(payments, "overdue")} overdue properties`,
            accent: "#e11d48",
          },
          {
            label: "Pending",
            value: `$${(pending / 1000).toFixed(1)}K`,
            sub: "Expected by EOM",
            accent: "#f59e0b",
          },
          {
            label: "Expenses",
            value: `$${(expenses / 1000).toFixed(1)}K`,
            sub: "Maintenance & Utilities",
            accent: "#f59e0b",
          },
          {
            label: "Collection Rate",
            value: `${rate}%`,
            sub: "Target: 95%",
            accent: "#0f172a",
          },
        ].map((m, i) => (
          <div key={i} style={S.card}>
            <div style={S.label}>{m.label}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: m.accent,
                margin: "6px 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              {m.value}
            </div>
            <div style={S.sub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* activity tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#e2e8f0",
            borderRadius: 10,
            padding: 3,
          }}
        >
          {(["all", "paid", "pending", "overdue"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActivityFilter(f)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: activityFilter === f ? "#ffffff" : "transparent",
                color: activityFilter === f ? "#0f172a" : "#64748b",
                boxShadow: activityFilter === f ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All Activity" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Pay",       icon: "north_east",  primary: true },
            { label: "Schedules", icon: "event_repeat", primary: false },
            { label: "Reports",   icon: "bar_chart",    primary: false },
          ].map((btn) => (
            <button
              key={btn.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                border: btn.primary ? "none" : "1px solid #e2e8f0",
                background: btn.primary ? "var(--neon-blue, #4f46e5)" : "#ffffff",
                color: btn.primary ? "#ffffff" : "#374151",
                cursor: "pointer",
                boxShadow: btn.primary ? "0 2px 8px rgba(79,70,229,0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {btn.icon}
              </span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ROW: chart + right column ───────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* Cash Flow Chart */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={S.h3}>Cash Flow Overview</div>
              <div style={{ ...S.sub, marginTop: 4 }}>Daily movement of inflows and outflows.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(["7", "30"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: chartRange === r ? "#0f172a" : "#fff",
                    color: chartRange === r ? "#fff" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {r} Days
                </button>
              ))}
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: 6,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#64748b" }}>download</span>
              </button>
            </div>
          </div>

          {/* Y-axis labels + chart */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", paddingBottom: 24, minWidth: 38, textAlign: "right" }}>
              {[10000, 7500, 5000, 2500, 0].map((v) => (
                <span key={v}>{v.toLocaleString()}</span>
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ position: "relative", height: 200 }}>
                {/* grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${(i / 4) * 100}%`,
                      borderTop: "1px dashed #e8eaf0",
                    }}
                  />
                ))}
                {/* outflow area */}
                <div style={{ position: "absolute", inset: 0 }}>
                  <AreaChart data={OUTFLOW} color="#93c5fd" fill="url(#fill-93c5fd)" />
                </div>
                {/* inflow area */}
                <div style={{ position: "absolute", inset: 0 }}>
                  <AreaChart data={INFLOW} color="#4f46e5" fill="url(#fill-4f46e5)" />
                </div>
              </div>

              {/* X-axis */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#94a3b8",
                  marginTop: 8,
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
              >
                {DAYS.map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>

          {/* legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            {[
              { dot: "#4f46e5", label: "Avg. Inflow:", val: `$${avgIn.toLocaleString()}` },
              { dot: "#93c5fd", label: "Avg. Outflow:", val: `$${avgOut.toLocaleString()}` },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot }} />
                {l.label} <strong>{l.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Recent Transactions */}
          <div style={{ ...S.card, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={S.h3}>Recent Transactions</div>
                <div style={S.sub}>Latest financial activity.</div>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#94a3b8" }}>filter_list</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredActivity.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#4f46e5" }}>
                        {METHOD_SVG[p.method] ?? "payment"}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                        {p.tenant?.name ?? p.property?.title ?? "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        {new Date(p.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: p.status === "paid" ? "#0f172a" : "#e11d48",
                      }}
                    >
                      {p.status === "paid" ? "+" : "-"}{fmt(p.amount)}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>

            <button
              style={{
                width: "100%",
                marginTop: 12,
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 600,
                color: "#4f46e5",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              View Full History
            </button>
          </div>

          {/* Smart Insights */}
          <div
            style={{
              borderRadius: 14,
              padding: 18,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* subtle bg arrow */}
            <div
              style={{
                position: "absolute",
                right: 16,
                top: 12,
                opacity: 0.25,
                fontSize: 60,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                pointerEvents: "none",
              }}
            >
              ↗
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Smart Insights</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 14 }}>Based on your activity.</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, fontWeight: 600 }}>
                <span>Monthly Spending Limit</span>
                <span>72%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "72%", background: "#f97316", borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
              You&apos;ve saved{" "}
              <span style={{ textDecoration: "underline" }}>$420.00</span>{" "}
              more this week compared to previous month.
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 14,
        }}
      >
        {/* Method Breakdown */}
        <div style={S.card}>
          <div style={{ ...S.h3, marginBottom: 14 }}>Method Breakdown</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {methodEntries.length > 0 ? (
              methodEntries.map(([method, amount]) => (
                <div
                  key={method}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#4f46e5" }}>
                      {METHOD_SVG[method] ?? "payment"}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {METHOD_LABEL[method]}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      {countByStatus(payments.filter((p) => p.method === method), "paid")} tx
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {fmt(amount)}
                  </div>
                </div>
              ))
            ) : (
              /* fallback skeleton rows */
              [
                { icon: "account_balance", label: "Bank Transfer", sub: "142 tx", val: "$542,000" },
                { icon: "credit_card",     label: "Credit Card",   sub: "89 tx",  val: "$210,500" },
                { icon: "sync",            label: "Cash/Check",    sub: "24 tx",  val: "$89,200" },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#4f46e5" }}>{row.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{row.label}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.sub}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.val}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Property Summary */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={S.h3}>Property Summary</div>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
              Batch Export
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Property Name", "Occupancy", "Revenue", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Action" ? "center" : "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      paddingBottom: 10,
                      borderBottom: "1px solid #e8eaf0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(propertyRows.length > 0
                ? propertyRows
                : [
                    { id: 1, title: "Skyline Residences", occupancy: "42/45", revenue: 124500, status: "Healthy" },
                    { id: 2, title: "Green Valley Apts",  occupancy: "28/30", revenue: 82100,  status: "Warning"  },
                    { id: 3, title: "The Grand Plaza",    occupancy: "110/110", revenue: 342000, status: "Healthy" },
                    { id: 4, title: "Oakwood Heights",    occupancy: "15/20", revenue: 42800,  status: "Critical" },
                  ]
              ).map((row, i) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {row.title}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, color: "#475569" }}>
                    {typeof row.occupancy === "string" ? row.occupancy : "—"}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    ${row.revenue.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <PropBadge label={row.status} />
                  </td>
                  <td style={{ padding: "12px 0", textAlign: "center" }}>
                    <button
                      onClick={() => handleDownloadReport(row.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}