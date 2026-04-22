"use client";

import { useState, useEffect } from "react";
import { fmt, timeAgo, METHOD_LABEL, METHOD_COLOR, METHOD_ICON } from "../_lib/data";
import {
  GlassPanel, SectionTag, MetricCard, CollectionGauge, StatusBadge,
} from "../_lib/components";
import { getPayments, getRentSchedules, getPaymentReport } from "../../lib/payments";
import type { PayMethod, PayStatus } from "../_lib/types";
import type { Payment, RentSchedule } from "../../../types/payment";

// ── Derived helpers ────────────────────────────────────────────────────────────

function sumByStatus(payments: Payment[], status: string) {
  return payments.filter((p) => p.status === status).reduce((s, p) => s + p.amount, 0);
}

function countByStatus(payments: Payment[], status: string) {
  return payments.filter((p) => p.status === status).length;
}

// ── Skeleton shimmer ───────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 16, radius = 6 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [schedules, setSchedules]     = useState<RentSchedule[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | PayStatus>("all");

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [paymentsData, schedulesData] = await Promise.all([
          getPayments(),
          getRentSchedules(),
        ]);
        if (!cancelled) {
          setPayments(paymentsData);
          setSchedules(schedulesData);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load payments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const collected = sumByStatus(payments, "paid");
  const arrears   = sumByStatus(payments, "overdue");
  const pending   = sumByStatus(payments, "pending");
  const total     = collected + arrears + pending;
  const rate      = total > 0 ? Math.round((collected / total) * 100) : 0;

  const methodTotals = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  // Unique property names/ids from payments
  const propertyEntries = Array.from(
    payments.reduce((map, p) => {
      const key = String(p.propertyId);
      if (!map.has(key)) map.set(key, p.property?.title ?? `Property ${p.propertyId}`);
      return map;
    }, new Map<string, string>())
  );

  const filteredActivity = payments.filter(
    (p) => activityFilter === "all" || p.status === activityFilter
  );

  // ── Sparkline data derived from real payments (last 12 months placeholder) ──
  // The backend doesn't expose a time-series endpoint yet, so we compute a simple
  // 12-bucket sparkline from whatever payments we have, bucketed by month.
  function buildSparkline(status: string): number[] {
    const now  = new Date();
    const buckets: number[] = Array(12).fill(0);
    payments
      .filter((p) => p.status === status)
      .forEach((p) => {
        const d = new Date(p.createdAt);
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthsAgo >= 0 && monthsAgo < 12) buckets[11 - monthsAgo] += p.amount / 1000;
      });
    return buckets;
  }

  // ── Report download ──────────────────────────────────────────────────────────

  function handleDownloadReport(propertyId: number) {
    const now  = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    getPaymentReport(propertyId, month);
  }

  // ── Error state ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <GlassPanel style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Failed to load payments</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a78bfa", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
        >
          Retry
        </button>
      </GlassPanel>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Metric row ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flex: "1 1 150px", minWidth: 140, height: 100, borderRadius: 14, overflow: "hidden" }}>
                <Skeleton h={100} radius={14} />
              </div>
            ))
          ) : (
            <>
              <MetricCard
                label="Collected (This Month)"
                value={`KES ${(collected / 1000).toFixed(0)}K`}
                sub={`${countByStatus(payments, "paid")} payments`}
                accent="linear-gradient(90deg,#00ff87,#0ea5e9)"
                sparkData={buildSparkline("paid")}
                sparkColor="#00ff87"
              />
              <MetricCard
                label="Arrears"
                value={`KES ${(arrears / 1000).toFixed(0)}K`}
                sub={`${countByStatus(payments, "overdue")} tenants`}
                accent="linear-gradient(90deg,#ef4444,#f97316)"
                sparkData={buildSparkline("overdue")}
                sparkColor="#ef4444"
              />
              <MetricCard
                label="Pending"
                value={`KES ${(pending / 1000).toFixed(0)}K`}
                sub={`${countByStatus(payments, "pending")} unconfirmed`}
                accent="linear-gradient(90deg,#fbbf24,#f97316)"
              />
              {/* Expenses & P&L still need a dedicated backend endpoint — kept as placeholders */}
              <MetricCard label="Expenses (This Month)" value="—"    sub="No expense endpoint yet" accent="linear-gradient(90deg,#f97316,#ef4444)" />
              <MetricCard label="Net P&L"               value="—"    sub="After all expenses"       accent="linear-gradient(90deg,#00ff87,#6366f1)" />
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* ── Gauge + By Method ── */}
          <GlassPanel style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 16 }}>
            <SectionTag>📊 Collection Rate</SectionTag>
            {loading ? (
              <Skeleton h={120} radius={60} w={120} />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CollectionGauge pct={rate} />
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>By Method</div>
                  {(Object.entries(methodTotals) as [PayMethod, number][]).map(([method, amount]) => {
                    const pct = collected > 0 ? Math.round((amount / collected) * 100) : 0;
                    return (
                      <div key={method} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 5 }}>
                            <span>{METHOD_ICON[method]}</span>{METHOD_LABEL[method]}
                          </span>
                          <span style={{ color: METHOD_COLOR[method], fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: METHOD_COLOR[method], borderRadius: 2, boxShadow: `0 0 6px ${METHOD_COLOR[method]}60` }} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(methodTotals).length === 0 && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", paddingTop: 8 }}>No paid transactions yet</div>
                  )}
                </div>
              </>
            )}
          </GlassPanel>

          {/* ── Activity Feed ── */}
          <GlassPanel style={{ flex: 1, minWidth: 320, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTag>⚡ Recent Activity</SectionTag>
              <div style={{ display: "flex", gap: 4 }}>
                {(["all", "paid", "pending", "overdue", "partial"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    style={{
                      background: activityFilter === f ? "rgba(99,102,241,0.2)" : "transparent",
                      border: activityFilter === f ? "1px solid rgba(99,102,241,0.5)" : "1px solid transparent",
                      color: activityFilter === f ? "#a78bfa" : "rgba(255,255,255,0.35)",
                      borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 10, alignItems: "center" }}>
                    <Skeleton w={34} h={34} radius={10} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skeleton w="50%" h={12} />
                      <Skeleton w="70%" h={10} />
                    </div>
                    <Skeleton w={60} h={14} />
                  </div>
                ))
              ) : filteredActivity.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  No activity matching this filter
                </div>
              ) : (
                filteredActivity.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${METHOD_COLOR[p.method as PayMethod]}15`, border: `1px solid ${METHOD_COLOR[p.method as PayMethod]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                        {METHOD_ICON[p.method as PayMethod]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{p.tenant?.name ?? "—"}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          {p.property?.title ?? `Property ${p.propertyId}`} · {METHOD_LABEL[p.method as PayMethod]}{p.paidAt ? ` · ${timeAgo(p.paidAt)}` : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.status === "paid" ? "#00ff87" : p.status === "overdue" ? "#ef4444" : "#fbbf24" }}>
                        {p.status === "paid" ? "+" : ""}{fmt(p.amount)}
                      </div>
                      <StatusBadge status={p.status as PayStatus} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          {/* ── By Property ── */}
          <GlassPanel style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionTag>🏢 By Property</SectionTag>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton h={12} w="60%" />
                  <Skeleton h={3} />
                </div>
              ))
            ) : propertyEntries.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", paddingTop: 8 }}>No properties found</div>
            ) : (
              propertyEntries.map(([propId, propTitle], i) => {
                const propPayments = payments.filter((p) => String(p.propertyId) === propId);
                const propCollected = sumByStatus(propPayments, "paid");
                const propTotal = propPayments.reduce((s, p) => s + p.amount, 0);
                const pct = propTotal > 0 ? Math.round((propCollected / propTotal) * 100) : 0;
                const colors = ["#00ff87", "#60a5fa", "#a78bfa", "#fb923c"];
                const color = colors[i % colors.length];
                return (
                  <div
                    key={propId}
                    style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "border-color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}40`)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
                    onClick={() => handleDownloadReport(Number(propId))}
                    title="Click to download report"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{propTitle}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{propPayments.length} payments · click for report</div>
                  </div>
                );
              })
            )}
          </GlassPanel>

        </div>
      </div>
    </>
  );
}