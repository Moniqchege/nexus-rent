"use client";

import { useState } from "react";
import { MOCK_TENANTS, fmt, METHOD_LABEL, METHOD_COLOR } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton } from "../_lib/components";
import type { Tenant } from "../_lib/types";

export default function TenantPage() {
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [showSearch, setShowSearch] = useState(false);

  const results = MOCK_TENANTS.filter(
    (t) => search.length > 0 && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const t = selectedTenant;

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* Sidebar */}
      <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 12 }}>
        <GlassPanel style={{ padding: 16 }}>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="🔍  Switch tenant…"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
            {showSearch && results.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {results.map((r) => (
                  <div key={r.id} onClick={() => { setSelectedTenant(r); setSearch(r.name); setShowSearch(false); }}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.property} · {r.unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", boxShadow: "0 0 20px rgba(99,102,241,0.4)", flexShrink: 0 }}>
              {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.property} · {t.unit}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Since {t.since}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
            {[
              ["Outstanding",     fmt(t.outstanding),   t.outstanding > 0 ? "#ef4444" : "#00ff87"],
              ["Credit Balance",  fmt(t.creditBalance),  "#60a5fa"],
              ["Next Due",        t.nextDue,             t.nextDue === "OVERDUE" ? "#ef4444" : "#fff"],
              ["Late Fees (YTD)", fmt(t.lateFees),       t.lateFees > 0 ? "#f97316" : "rgba(255,255,255,0.4)"],
              ["YTD Paid",        fmt(t.ytdPaid),        "#00ff87"],
              ["Avg Payment Delay", `${t.avgDelayDays} days`, t.avgDelayDays > 5 ? "#f97316" : "#00ff87"],
              ["Preferred Method", METHOD_LABEL[t.preferredMethod], METHOD_COLOR[t.preferredMethod]],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                <span style={{ fontWeight: 600, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <NeonButton variant="primary" style={{ flex: 1 }}>Pay Now →</NeonButton>
            <NeonButton variant="ghost"   style={{ flex: 1 }}>Statement →</NeonButton>
          </div>
        </GlassPanel>
      </div>

      {/* Statement Table */}
      <GlassPanel style={{ flex: 1, minWidth: 300, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTag>📄 Statement of Account</SectionTag>
          <NeonButton variant="ghost" style={{ fontSize: 11, padding: "5px 10px" }}>📥 Download PDF</NeonButton>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Date","Description","Charge","Payment","Balance"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.paymentHistory.map((r, i) => {
              const isPayment = r.payment > 0;
              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isPayment ? "rgba(0,255,135,0.02)" : "transparent" }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{r.date}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: isPayment ? "#00ff87" : "#fff" }}>{r.desc}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: r.charge ? "#fff" : "rgba(255,255,255,0.2)" }}>{r.charge ? fmt(r.charge) : "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: r.payment ? "#00ff87" : "rgba(255,255,255,0.2)" }}>{r.payment ? fmt(r.payment) : "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: r.balance < 0 ? "#60a5fa" : r.balance === 0 ? "rgba(255,255,255,0.4)" : "#ef4444" }}>
                    {r.balance < 0 ? `CR ${fmt(-r.balance)}` : r.balance === 0 ? "—" : fmt(r.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}