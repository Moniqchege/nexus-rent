"use client";

import { useState } from "react";
import { MOCK_PAYMENTS, SPARKLINE_DATA, fmt, timeAgo, PROPERTIES } from "../_lib/data";
import { METHOD_LABEL, METHOD_COLOR, METHOD_ICON } from "../_lib/data";
import {
  GlassPanel, SectionTag, MetricCard, CollectionGauge, StatusBadge,
} from "../_lib/components";
import type { PayMethod, PayStatus } from "../_lib/types";

export default function OverviewPage() {
  const payments = MOCK_PAYMENTS;
  const [activityFilter, setActivityFilter] = useState<"all" | PayStatus>("all");

  const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const arrears   = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const pending   = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const rate = Math.round((collected / (collected + arrears + pending)) * 100);

  const methodTotals = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + p.amount; return acc; }, {} as Record<string, number>);

  const filteredActivity = payments.filter(
    (p) => activityFilter === "all" || p.status === activityFilter
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Metric row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
        <MetricCard label="Collected (Apr)" value={`KES ${(collected / 1000).toFixed(0)}K`} sub="+12% vs Mar" accent="linear-gradient(90deg,#00ff87,#0ea5e9)" sparkData={SPARKLINE_DATA.collected} sparkColor="#00ff87" />
        <MetricCard label="Arrears"          value={`KES ${(arrears / 1000).toFixed(0)}K`}   sub={`${payments.filter((p) => p.status === "overdue").length} tenants`} accent="linear-gradient(90deg,#ef4444,#f97316)" sparkData={[12,18,14,22,19,25,21,28,24,31,28,32]} sparkColor="#ef4444" />
        <MetricCard label="Pending"          value={`KES ${(pending / 1000).toFixed(0)}K`}   sub={`${payments.filter((p) => p.status === "pending").length} unconfirmed`} accent="linear-gradient(90deg,#fbbf24,#f97316)" />
        <MetricCard label="Expenses (Apr)"   value="KES 83K"   sub="−22% vs Mar" accent="linear-gradient(90deg,#f97316,#ef4444)" sparkData={[62,74,88,71,95,82,91,78,86,93,88,83]} sparkColor="#f97316" />
        <MetricCard label="Net P&L"          value="KES 201K"  sub="After all expenses" accent="linear-gradient(90deg,#00ff87,#6366f1)" sparkData={[140,158,145,171,163,182,175,192,181,198,194,201]} sparkColor="#00ff87" />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Gauge + By Method */}
        <GlassPanel style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionTag>📊 Collection Rate</SectionTag>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CollectionGauge pct={rate} />
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>By Method</div>
            {(Object.entries(methodTotals) as [PayMethod, number][]).map(([method, amount]) => {
              const pct = Math.round((amount / collected) * 100);
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
          </div>
        </GlassPanel>

        {/* Activity Feed */}
        <GlassPanel style={{ flex: 1, minWidth: 320, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTag>⚡ Recent Activity</SectionTag>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all","paid","pending","overdue","partial"] as const).map((f) => (
                <button key={f} onClick={() => setActivityFilter(f)} style={{ background: activityFilter === f ? "rgba(99,102,241,0.2)" : "transparent", border: activityFilter === f ? "1px solid rgba(99,102,241,0.5)" : "1px solid transparent", color: activityFilter === f ? "#a78bfa" : "rgba(255,255,255,0.35)", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {filteredActivity.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${METHOD_COLOR[p.method]}15`, border: `1px solid ${METHOD_COLOR[p.method]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    {METHOD_ICON[p.method]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{p.tenantName}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{p.property} · {p.unit} · {METHOD_LABEL[p.method]}{p.paidAt ? ` · ${timeAgo(p.paidAt)}` : ""}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.status === "paid" ? "#00ff87" : p.status === "overdue" ? "#ef4444" : "#fbbf24" }}>
                    {p.status === "paid" ? "+" : ""}{fmt(p.amount)}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {filteredActivity.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No activity matching this filter
              </div>
            )}
          </div>
        </GlassPanel>

        {/* By Property */}
        <GlassPanel style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionTag>🏢 By Property</SectionTag>
          {PROPERTIES.map((prop, i) => {
            const propPayments = payments.filter((p) => p.property === prop);
            const propCollected = propPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
            const propTotal = propPayments.reduce((s, p) => s + p.amount, 0);
            const pct = propTotal > 0 ? Math.round((propCollected / propTotal) * 100) : 0;
            const colors = ["#00ff87","#60a5fa","#a78bfa","#fb923c"];
            return (
              <div key={prop} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{prop}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors[i] }}>{pct}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[i], borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{propPayments.length} payments</div>
              </div>
            );
          })}
        </GlassPanel>
      </div>
    </div>
  );
}