"use client";

import { useState } from "react";
import { GlassPanel, SectionTag, NeonButton, StatusBadge } from "../_lib/components";

export default function AutomationPage() {
  const [cronStates, setCronStates] = useState<Record<string, boolean>>({
    lateFees: true, schedules: true, reminders: true, webhook: true,
  });
  const [runLog, setRunLog] = useState<Record<string, string>>({});

  const triggerRun = (key: string) => {
    setRunLog((l) => ({ ...l, [key]: `Manual run at ${new Date().toLocaleTimeString()}` }));
  };

  const crons = [
    { key: "lateFees",  name: "Apply Late Fees",       fn: "applyLateFees()",            schedule: "Daily 09:00",  lastRun: "Today 09:00",   lastStatus: "success" },
    { key: "schedules", name: "Generate Schedules",     fn: "generateMonthlySchedules()", schedule: "1st of month", lastRun: "Apr 1 00:01",   lastStatus: "success" },
    { key: "reminders", name: "Due Reminders",          fn: "sendDueReminders()",         schedule: "3-day advance",lastRun: "Mar 29 08:00",  lastStatus: "success" },
    { key: "webhook",   name: "Stripe Webhook",         fn: "payment_intent.succeeded",   schedule: "Real-time",    lastRun: "5 mins ago",    lastStatus: "listening" },
  ];

  const flow = [
    { step: "Payment received",  detail: "M-Pesa callback / Stripe webhook / manual verify" },
    { step: "Idempotency check", detail: "ensureNotProcessed(referenceId)" },
    { step: "FIFO allocation",   detail: "allocatePayment() — oldest schedule first" },
    { step: "Partial / Overpayment", detail: "Remainder → tenant.creditBalance" },
    { step: "Receipt emailed",   detail: "sendReceipt(paymentId) via SMTP" },
  ];

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassPanel>
          <SectionTag>⚙️ Cron Jobs</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {crons.map((c) => (
              <div key={c.key} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 2 }}>{c.fn}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{c.schedule} · Last: {c.lastRun}</div>
                  </div>
                  <div onClick={() => setCronStates((s) => ({ ...s, [c.key]: !s[c.key] }))}
                    style={{ width: 36, height: 20, borderRadius: 10, background: cronStates[c.key] ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.1)", border: `1px solid ${cronStates[c.key] ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.2)"}`, cursor: "pointer", position: "relative", transition: "all .2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: cronStates[c.key] ? "#00ff87" : "rgba(255,255,255,0.4)", top: 2, left: cronStates[c.key] ? 18 : 2, transition: "left .2s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <StatusBadge status={c.lastStatus === "success" ? "paid" : c.lastStatus === "listening" ? "partial" : "pending"} />
                  <NeonButton variant="ghost" onClick={() => triggerRun(c.key)} style={{ fontSize: 10, padding: "4px 8px" }}>▶ Run Now</NeonButton>
                  {runLog[c.key] && <span style={{ fontSize: 10, color: "#00ff87" }}>✓ {runLog[c.key]}</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTag>💰 Late Fee Policy</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {[
              ["Grace period", "7 days",            "#fbbf24"],
              ["Rate",         "5% of rent",         "#f97316"],
              ["Trigger",      "applyLateFees()",    "#a78bfa"],
              ["FIFO",         "Fees paid first",    "#00ff87"],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
                <span style={{ fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            Override per-tenant via <code style={{ color: "#a78bfa", fontFamily: "monospace" }}>Lease.graceDays</code> &amp; <code style={{ color: "#a78bfa", fontFamily: "monospace" }}>Lease.lateFeePercent</code>
          </div>
          <NeonButton variant="ghost" style={{ marginTop: 12, fontSize: 12 }}>Update Policy →</NeonButton>
        </GlassPanel>
      </div>

      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassPanel>
          <SectionTag>🔄 Reconciliation Flow</SectionTag>
          <div style={{ position: "relative", marginTop: 12 }}>
            <div style={{ position: "absolute", left: 7, top: 14, bottom: 14, width: 1, background: "rgba(99,102,241,0.3)" }} />
            {flow.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0" }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: i === flow.length - 1 ? "#00ff87" : "#6366f1", boxShadow: `0 0 8px ${i === flow.length - 1 ? "#00ff87" : "#6366f1"}80`, flexShrink: 0, marginTop: 2, zIndex: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{f.step}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: 2 }}>{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTag>📬 Comms (Apr)</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {[
              ["Email reminders", "24 sent", "#a78bfa"],
              ["Overdue notices",  "6 sent",  "#ef4444"],
              ["Receipts issued",  "31 sent", "#00ff87"],
              ["SMS (M-Pesa)",     "18 auto", "#60a5fa"],
              ["Failed sends",     "0",       "rgba(255,255,255,0.3)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span style={{ fontWeight: 600, color: color as string }}>{val}</span>
              </div>
            ))}
          </div>
          <NeonButton variant="ghost" style={{ marginTop: 12, fontSize: 12 }}>Send Reminders Now →</NeonButton>
        </GlassPanel>
      </div>
    </div>
  );
}