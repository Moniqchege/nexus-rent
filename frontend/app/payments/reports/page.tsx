"use client";

import { useState } from "react";
import { MOCK_EXPENSES, PROPERTIES, fmt } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton, MetricCard } from "../_lib/components";
import type { Expense } from "../_lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Maintenance: "#f97316",
  Insurance:   "#60a5fa",
  Utilities:   "#00ff87",
  Admin:       "#ef4444",
};

export default function ReportsPage() {
  const expenses = MOCK_EXPENSES;
  const revenue = 284000, arrears = 47000;
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const pl = revenue - totalExp;

  const grouped = expenses.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = { total: 0, items: [] as Expense[] };
    acc[e.category].total += e.amount;
    acc[e.category].items.push(e);
    return acc;
  }, {} as Record<string, { total: number; items: Expense[] }>);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const momData = [
    { month: "Jan", revenue: 196, expenses: 62, pl: 134 },
    { month: "Feb", revenue: 214, expenses: 71, pl: 143 },
    { month: "Mar", revenue: 253, expenses: 68, pl: 185 },
    { month: "Apr", revenue: 284, expenses: 83, pl: 201 },
  ];
  const maxVal = 300;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters / export */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Property</div>
          <select style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, minWidth: 180 }}>
            <option style={{ background: "#1a1a2e" }}>All Properties</option>
            {PROPERTIES.map((p) => <option key={p} style={{ background: "#1a1a2e" }}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Month</div>
          <input type="month" defaultValue="2026-04" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13 }} />
        </div>
        <NeonButton variant="primary">📊 KRA CSV →</NeonButton>
        <NeonButton variant="ghost">P&amp;L Report →</NeonButton>
        <NeonButton variant="ghost">📥 Full Export →</NeonButton>
      </div>

      {/* Summary metrics */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Revenue"  value={`KES ${(revenue / 1000).toFixed(0)}K`}  accent="linear-gradient(90deg,#00ff87,#0ea5e9)" sparkData={[196,214,253,284]} sparkColor="#00ff87" />
        <MetricCard label="Arrears"  value={`KES ${(arrears / 1000).toFixed(0)}K`}  accent="linear-gradient(90deg,#ef4444,#f97316)" />
        <MetricCard label="Expenses" value={`KES ${(totalExp / 1000).toFixed(0)}K`} accent="linear-gradient(90deg,#fbbf24,#f97316)" sparkData={[62,71,68,83]} sparkColor="#f97316" />
        <MetricCard label="Net P&L"  value={`KES ${(pl / 1000).toFixed(0)}K`} sub="+8.6% vs Mar" accent="linear-gradient(90deg,#6366f1,#00ff87)" sparkData={[134,143,185,201]} sparkColor="#00ff87" />
      </div>

      {/* MoM bar chart */}
      <GlassPanel>
        <SectionTag>📈 Month-over-Month (KES thousands)</SectionTag>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, marginTop: 16, padding: "0 8px" }}>
          {momData.map((m) => (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
                {[
                  { val: m.revenue,  color: "#00ff87" },
                  { val: m.expenses, color: "#f97316" },
                  { val: m.pl,       color: "#6366f1" },
                ].map((bar, i) => (
                  <div key={i} style={{ flex: 1, height: `${(bar.val / maxVal) * 80}px`, background: bar.color, borderRadius: "3px 3px 0 0", opacity: 0.8, boxShadow: `0 0 6px ${bar.color}40`, transition: "height .4s" }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{m.month}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, alignSelf: "flex-start", marginTop: -4, marginLeft: 12 }}>
            {[["Revenue","#00ff87"],["Expenses","#f97316"],["P&L","#6366f1"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />{l}
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Grouped expense table */}
      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>🧾 Expenses — April 2026 (Grouped)</SectionTag>
        </div>
        {Object.entries(grouped).map(([cat, group]) => {
          const color = CATEGORY_COLORS[cat] || "#a78bfa";
          const isOpen = expanded[cat];
          return (
            <div key={cat}>
              <div onClick={() => setExpanded((e) => ({ ...e, [cat]: !e[cat] }))}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "background .1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}40` }}>{cat}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(group.total)}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              {isOpen && group.items.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 10px 36px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(0,0,0,0.1)" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{e.description}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{e.property} · {e.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>Total Expenses</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 2 }}>{fmt(totalExp)}</div>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <NeonButton variant="ghost" style={{ fontSize: 12 }}>+ Add Expense →</NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}