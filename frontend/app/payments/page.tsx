"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: number;
  tenantName: string;
  property: string;
  amount: number;
  method: "mpesa" | "card" | "bank" | "airtel";
  status: "paid" | "pending" | "overdue" | "partial";
  referenceId: string;
  paidAt?: string;
  createdAt: string;
}

interface RentSchedule {
  id: number;
  tenantName: string;
  property: string;
  dueDate: string;
  amount: number;
  lateFeeAmount?: number;
  allocatedAmount: number;
  status: "scheduled" | "overdue" | "paid" | "partial";
  period: string;
}

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
}

type Tab = "overview" | "initiate" | "schedules" | "tenant" | "automation" | "reports";
type PayMethod = "mpesa" | "airtel" | "card" | "bank";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_PAYMENTS: Payment[] = [
  { id: 1, tenantName: "James Mwangi", property: "Apt 4B", amount: 28500, method: "mpesa", status: "paid", referenceId: "QK3HT72FNZ", paidAt: new Date(Date.now() - 2 * 60000).toISOString(), createdAt: new Date().toISOString() },
  { id: 2, tenantName: "Aisha Ochieng", property: "House 12", amount: 45000, method: "card", status: "paid", referenceId: "pi_3QK7aF2eZvKYlo2C", paidAt: new Date(Date.now() - 47 * 60000).toISOString(), createdAt: new Date().toISOString() },
  { id: 3, tenantName: "Peter Kamau", property: "Apt 7A", amount: 32000, method: "bank", status: "pending", referenceId: "NEXUS-BANK-2-3-483920", createdAt: new Date().toISOString() },
  { id: 4, tenantName: "Grace Njeri", property: "Apt 2C", amount: 28500, method: "mpesa", status: "overdue", referenceId: "", createdAt: new Date().toISOString() },
  { id: 5, tenantName: "David Otieno", property: "Apt 1A", amount: 18000, method: "mpesa", status: "paid", referenceId: "QK3HT72AAA", paidAt: new Date(Date.now() - 3 * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 6, tenantName: "Mary Wanjiku", property: "Studio 3", amount: 15000, method: "card", status: "partial", referenceId: "pi_partial", createdAt: new Date().toISOString() },
];

const MOCK_SCHEDULES: RentSchedule[] = [
  { id: 1, tenantName: "James Mwangi", property: "Apt 4B", dueDate: "2026-04-01", amount: 28500, allocatedAmount: 28500, status: "paid", period: "2026-04" },
  { id: 2, tenantName: "Aisha Ochieng", property: "House 12", dueDate: "2026-04-01", amount: 45000, allocatedAmount: 45000, status: "paid", period: "2026-04" },
  { id: 3, tenantName: "Grace Njeri", property: "Apt 2C", dueDate: "2026-04-01", amount: 28500, lateFeeAmount: 1425, allocatedAmount: 0, status: "overdue", period: "2026-04" },
  { id: 4, tenantName: "Peter Kamau", property: "Apt 7A", dueDate: "2026-04-01", amount: 32000, allocatedAmount: 0, status: "scheduled", period: "2026-04" },
  { id: 5, tenantName: "Mary Wanjiku", property: "Studio 3", dueDate: "2026-04-01", amount: 15000, allocatedAmount: 9000, status: "partial", period: "2026-04" },
  { id: 6, tenantName: "David Otieno", property: "Apt 1A", dueDate: "2026-04-01", amount: 18000, allocatedAmount: 18000, status: "paid", period: "2026-04" },
];

const MOCK_EXPENSES: Expense[] = [
  { id: 1, category: "Maintenance", description: "Plumbing repair Apt 4B", amount: 8500, date: "2026-04-05" },
  { id: 2, category: "Insurance", description: "Property insurance premium", amount: 12000, date: "2026-04-01" },
  { id: 3, category: "Maintenance", description: "Gate motor servicing", amount: 4200, date: "2026-04-12" },
  { id: 4, category: "Utilities", description: "Common area electricity", amount: 6800, date: "2026-04-15" },
  { id: 5, category: "Admin", description: "Agent commission", amount: 11500, date: "2026-04-20" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `KES ${n.toLocaleString()}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const timeAgo = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const METHOD_LABEL: Record<PayMethod, string> = { mpesa: "M-Pesa", airtel: "Airtel", card: "Card", bank: "Bank" };
const METHOD_COLOR: Record<PayMethod, string> = { mpesa: "#00ff87", airtel: "#f97316", card: "#60a5fa", bank: "#a78bfa" };
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  paid:      { bg: "rgba(0,255,135,0.1)",  color: "#00ff87", border: "rgba(0,255,135,0.3)" },
  pending:   { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  overdue:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.3)" },
  partial:   { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
  scheduled: { bg: "rgba(167,139,250,0.1)","color": "#a78bfa", border: "rgba(167,139,250,0.3)" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: "#00ff87", marginRight: 6, boxShadow: "0 0 6px #00ff87",
      animation: "pulse 1.5s infinite",
    }} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      fontSize: 10, fontWeight: 600, letterSpacing: ".04em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status.toUpperCase()}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "18px 20px", flex: 1, minWidth: 130,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: accent || "linear-gradient(to right, #6366f1, #8b5cf6)",
      }} />
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GlassPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      padding: "24px",
      backdropFilter: "blur(12px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 10, fontWeight: 700, letterSpacing: ".12em",
      color: "#a78bfa", textTransform: "uppercase",
      background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
      borderRadius: 6, padding: "4px 10px", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function NeonButton({ children, onClick, variant = "ghost", style }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "success"; style?: React.CSSProperties;
}) {
  const variants = {
    primary: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none" },
    ghost:   { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" },
    danger:  { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
    success: { background: "rgba(0,255,135,0.1)", color: "#00ff87", border: "1px solid rgba(0,255,135,0.3)" },
  };
  return (
    <button onClick={onClick} style={{
      ...variants[variant],
      borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      transition: "all .15s", whiteSpace: "nowrap", ...style,
    }}>
      {children}
    </button>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct === 100 ? "#00ff87" : pct > 0 ? "#60a5fa" : "#374151";
  return (
    <div style={{ height: 5, width: 80, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, boxShadow: pct > 0 ? `0 0 6px ${color}` : "none" }} />
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ payments }: { payments: Payment[] }) {
  const collected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const arrears   = payments.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const pending   = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const rate      = ((collected / (collected + arrears + pending)) * 100).toFixed(1);

  const methodCounts = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Collected (Apr)" value={`KES ${Math.round(collected / 1000)}K`} sub="+12% vs Mar" accent="linear-gradient(90deg,#00ff87,#0ea5e9)" />
        <MetricCard label="Arrears" value={`KES ${Math.round(arrears / 1000)}K`} sub={`${payments.filter(p=>p.status==="overdue").length} tenants`} accent="linear-gradient(90deg,#ef4444,#f97316)" />
        <MetricCard label="Pending" value={`KES ${Math.round(pending / 1000)}K`} sub={`${payments.filter(p=>p.status==="pending").length} unconfirmed`} accent="linear-gradient(90deg,#fbbf24,#f97316)" />
        <MetricCard label="Collection Rate" value={`${rate}%`} sub="Target 95%" accent="linear-gradient(90deg,#6366f1,#8b5cf6)" />
        <MetricCard label="Late Fees" value="KES 2,350" sub="5 tenants" accent="linear-gradient(90deg,#f97316,#ef4444)" />
        <MetricCard label="Net P&L" value="KES 241K" sub="After expenses" accent="linear-gradient(90deg,#00ff87,#6366f1)" />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <GlassPanel style={{ flex: 1, minWidth: 260 }}>
          <SectionTag>📊 Payment Methods</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {(Object.entries(methodCounts) as [PayMethod, number][]).map(([method, amount]) => {
              const pct = Math.round((amount / collected) * 100);
              return (
                <div key={method}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{METHOD_LABEL[method]}</span>
                    <span style={{ color: METHOD_COLOR[method], fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: METHOD_COLOR[method], borderRadius: 2, boxShadow: `0 0 8px ${METHOD_COLOR[method]}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel style={{ flex: 2, minWidth: 320 }}>
          <SectionTag>⚡ Recent Activity</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
            {payments.slice(0, 5).map(p => (
              <div key={p.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: METHOD_COLOR[p.method], boxShadow: `0 0 6px ${METHOD_COLOR[p.method]}` }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{p.tenantName}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.property} · {METHOD_LABEL[p.method]} {p.paidAt ? `· ${timeAgo(p.paidAt)}` : ""}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.status === "paid" ? "#00ff87" : p.status === "overdue" ? "#ef4444" : "#fbbf24" }}>
                    {p.status === "paid" ? "+" : ""}{fmt(p.amount)}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

// ─── Tab: Initiate Payment ──────────────────────────────────────────────────────

function InitiateTab() {
  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [phone, setPhone] = useState("254712345678");
  const [amount, setAmount] = useState("28500");
  const [ref, setRef] = useState("APT4B-APR26");
  const [stkSent, setStkSent] = useState(false);
  const [bankRef, setBankRef] = useState("");

  const handleSTK = () => setStkSent(true);
  const handleBank = () => setBankRef(`NEXUS-BANK-2-3-${Math.floor(Date.now() / 1000).toString().slice(-6)}`);

  const methods: { key: PayMethod; icon: string; name: string; sub: string }[] = [
    { key: "mpesa",  icon: "📱", name: "M-Pesa",     sub: "STK Push / Paybill" },
    { key: "airtel", icon: "📲", name: "Airtel Money", sub: "STK Push" },
    { key: "card",   icon: "💳", name: "Card / Wallet", sub: "Visa · MC · Apple Pay" },
    { key: "bank",   icon: "🏦", name: "Bank Transfer", sub: "Equity · KCB · Co-op" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        padding: "12px 16px", borderRadius: 12, fontSize: 13,
        background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd",
      }}>
        ℹ️ Payments trigger auto-reconciliation. M-Pesa &amp; Card receipts are issued instantly. Bank transfers require manual verification.
      </div>

      <GlassPanel>
        <SectionTag>💳 Select Method</SectionTag>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 12, marginBottom: 20 }}>
          {methods.map(m => (
            <div key={m.key} onClick={() => { setMethod(m.key); setStkSent(false); setBankRef(""); }} style={{
              border: method === m.key ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
              background: method === m.key ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
              borderRadius: 14, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all .15s",
              boxShadow: method === m.key ? "0 0 20px rgba(99,102,241,0.2)" : "none",
            }}>
              <div style={{ fontSize: 24 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: method === m.key ? "#a78bfa" : "#fff", marginTop: 6 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {[
            { label: "Tenant", type: "select", options: ["James Mwangi — Apt 4B", "Aisha Ochieng — House 12", "Peter Kamau — Apt 7A"] },
            { label: "Amount (KES)", type: "number", value: amount, onChange: (v: string) => setAmount(v) },
            { label: "Account Reference", type: "text", value: ref, onChange: (v: string) => setRef(v) },
            { label: "Description", type: "text", value: "April 2026 Rent" },
          ].map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</div>
              {f.type === "select" ? (
                <select style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13 }}>
                  {f.options?.map(o => <option key={o} style={{ background: "#1a1a2e" }}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} defaultValue={f.value} onChange={e => f.onChange?.(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              )}
            </div>
          ))}
        </div>

        {method === "mpesa" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Phone (2547xxxxxxxx)</div>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, width: 240, outline: "none" }} />
            </div>
            <NeonButton variant="primary" onClick={handleSTK}>📱 Send STK Push →</NeonButton>
            {stkSent && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
                <div style={{ fontWeight: 700, color: "#00ff87", marginBottom: 4 }}>✓ STK Push Sent</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>A prompt was sent to <strong style={{ color: "#fff" }}>{phone}</strong>. Payment is <strong style={{ color: "#fbbf24" }}>pending</strong> and will auto-reconcile on callback.</div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>Callback: /api/payments/mpesa/callback</div>
              </div>
            )}
          </div>
        )}

        {method === "card" && (
          <div>
            <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 12, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd", fontSize: 13 }}>
              A Stripe PaymentIntent will be created with <code>automatic_payment_methods: enabled</code> — supports Visa, Mastercard, Apple Pay, and Google Pay.
            </div>
            <NeonButton variant="primary">💳 Create Payment Intent →</NeonButton>
          </div>
        )}

        {method === "airtel" && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13 }}>
            ⚠️ Airtel Money integration is coming soon. Endpoint scaffolded at <code style={{ fontFamily: "monospace" }}>POST /api/payments/airtel</code>
          </div>
        )}

        {method === "bank" && (
          <div>
            <NeonButton variant="primary" onClick={handleBank}>🏦 Generate Bank Reference →</NeonButton>
            {bankRef && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>Bank Transfer Instructions</div>
                {[["Bank","Equity Bank"],["Account","0123456789"],["Reference", bankRef]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
                    <span style={{ fontFamily: "monospace", color: "#fff" }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Verify via <code>PUT /api/payments/:id/verify</code></div>
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

// ─── Tab: Schedules ────────────────────────────────────────────────────────────

function SchedulesTab({ schedules }: { schedules: RentSchedule[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Scheduled", value: schedules.filter(s=>s.status==="scheduled").length, color: "#a78bfa" },
          { label: "Overdue",   value: schedules.filter(s=>s.status==="overdue").length,   color: "#ef4444" },
          { label: "Partial",   value: schedules.filter(s=>s.status==="partial").length,   color: "#fbbf24" },
          { label: "Paid",      value: schedules.filter(s=>s.status==="paid").length,      color: "#00ff87" },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, minWidth: 100, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, textShadow: `0 0 20px ${c.color}60` }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>📅 Rent Schedules</SectionTag>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              <option style={{ background: "#1a1a2e" }}>All statuses</option>
              <option style={{ background: "#1a1a2e" }}>Scheduled</option>
              <option style={{ background: "#1a1a2e" }}>Overdue</option>
              <option style={{ background: "#1a1a2e" }}>Paid</option>
            </select>
            <NeonButton variant="ghost" style={{ fontSize: 10, padding: "6px 12px", border: "1px solid var(--neon-blue)", color: "var(--neon-blue)" }}>Generate May ↗</NeonButton>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="table-head">
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
                {["Tenant","Property","Due Date","Amount","Late Fee","Status","Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--neon-blue)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap" }}>{s.tenantName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{s.property}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{fmtDate(s.dueDate)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{fmt(s.amount)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: s.lateFeeAmount ? "#ef4444" : "rgba(255,255,255,0.3)" }}>{s.lateFeeAmount ? fmt(s.lateFeeAmount) : "—"}</td>
                  {/* <td style={{ padding: "12px 16px" }}><ProgressBar value={s.allocatedAmount} max={s.amount} /></td> */}
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    {s.status === "overdue" && <NeonButton variant="danger" style={{ fontSize: 11, padding: "6px 10px", background: "rgba(0, 240, 255, 0.05)", color: "var(--neon-blue)", border: "1px solid rgba(0, 240, 255, 0.25)", borderRadius: "10px" }}>Remind</NeonButton>}
                    {s.status === "scheduled" && <NeonButton variant="ghost" style={{ fontSize: 11, padding: "6px 10px", background: "rgba(0, 240, 255, 0.05)", color: "var(--neon-blue)", border: "1px solid rgba(0, 240, 255, 0.25)", borderRadius: "10px" }}>Verify</NeonButton>}
                    {s.status === "paid" && <NeonButton variant="success" style={{ fontSize: 11, padding: "6px 10px", background: "rgba(0, 240, 255, 0.05)", color: "var(--neon-blue)", border: "1px solid rgba(0, 240, 255, 0.25)", borderRadius: "10px" }}>Receipt</NeonButton>}
                    {s.status === "partial" && <NeonButton variant="ghost" style={{ fontSize: 11, padding: "6px 10px", background: "rgba(0, 240, 255, 0.05)", color: "var(--neon-blue)", border: "1px solid rgba(0, 240, 255, 0.25)", borderRadius: "10px" }}>Details</NeonButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Tab: Tenant Portal ────────────────────────────────────────────────────────

function TenantTab() {
  const ledger = [
    { date: "Apr 1",  desc: "Rent — Apr 2026", charge: 28500, payment: 0,     balance: 28500 },
    { date: "Apr 3",  desc: "M-Pesa payment",  charge: 0,     payment: 30000, balance: -1500 },
    { date: "Mar 1",  desc: "Rent — Mar 2026", charge: 28500, payment: 0,     balance: 28500 },
    { date: "Mar 2",  desc: "M-Pesa payment",  charge: 0,     payment: 28500, balance: 0 },
    { date: "Feb 1",  desc: "Rent — Feb 2026", charge: 28500, payment: 0,     balance: 28500 },
    { date: "Feb 2",  desc: "Card payment",    charge: 0,     payment: 28500, balance: 0 },
  ];

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <GlassPanel style={{ flex: "0 0 260px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>JM</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>James Mwangi</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Apt 4B · Since Jan 2024</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Outstanding", value: "KES 0", color: "#00ff87" },
            { label: "Credit Balance", value: "KES 1,500", color: "#60a5fa" },
            { label: "Next Due", value: "May 1 · KES 28,500", color: "#fff" },
            { label: "Late Fees (YTD)", value: "KES 0", color: "#fff" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <NeonButton variant="primary" style={{ flex: 1 }}>Pay Now →</NeonButton>
          <NeonButton variant="ghost" style={{ flex: 1 }}>Download →</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel style={{ flex: 1, minWidth: 300, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>📄 Statement of Account</SectionTag>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Date","Description","Charge","Payment","Balance"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.map((r, i) => {
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

// ─── Tab: Automation ───────────────────────────────────────────────────────────

function AutomationTab() {
  const crons = [
    { name: "Apply Late Fees", cron: "applyLateFees()", schedule: "Daily 09:00", status: "active" },
    { name: "Generate Schedules", cron: "generateMonthlySchedules()", schedule: "1st of month", status: "active" },
    { name: "Due Reminders", cron: "sendDueReminders()", schedule: "3-day advance", status: "scheduled" },
    { name: "Stripe Webhook", cron: "payment_intent.succeeded", schedule: "Real-time", status: "listening" },
  ];
  const flow = [
    { step: "Payment received", detail: "M-Pesa callback / Stripe webhook / manual verify" },
    { step: "Idempotency check", detail: "ensureNotProcessed(referenceId)" },
    { step: "FIFO allocation", detail: "allocatePayment() — oldest schedule first" },
    { step: "Partial / Overpayment", detail: "Remainder → tenant.creditBalance" },
    { step: "Receipt emailed", detail: "sendReceipt(paymentId) via SMTP" },
  ];

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassPanel>
          <SectionTag>⚙️ Cron Jobs</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {crons.map(c => (
              <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: 2 }}>{c.cron}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{c.schedule}</div>
                </div>
                <StatusBadge status={c.status === "active" ? "paid" : c.status === "scheduled" ? "pending" : "partial"} />
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTag>💰 Late Fee Policy</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {["Grace period: 7 days","Rate: 5% of rent amount","Auto-applied via applyLateFees()","Included in FIFO allocation"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#00ff87", flexShrink: 0 }}>✓</div>
                {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            Override per-tenant via <code style={{ fontFamily: "monospace", color: "#a78bfa" }}>Lease.graceDays</code> and <code style={{ fontFamily: "monospace", color: "#a78bfa" }}>Lease.lateFeePercent</code>
          </div>
          <NeonButton variant="ghost" style={{ marginTop: 12, fontSize: 12 }}>Update Policy →</NeonButton>
        </GlassPanel>
      </div>

      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassPanel>
          <SectionTag>🔄 Reconciliation Flow</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 12, position: "relative" }}>
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
          <SectionTag>📬 Reminders (Apr)</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {[["Email reminders","24 sent","#a78bfa"],["Overdue notices","6 sent","#ef4444"],["Receipts issued","31 sent","#00ff87"],["SMS (via M-Pesa)","18 auto","#60a5fa"]].map(([label, val, color]) => (
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

// ─── Tab: Reports ──────────────────────────────────────────────────────────────

function ReportsTab({ expenses }: { expenses: Expense[] }) {
  const revenue = 284000, arrears = 47000, totalExp = 43000, pl = revenue - totalExp;
  const CATEGORY_COLORS: Record<string, string> = { Maintenance: "#f97316", Insurance: "#60a5fa", Utilities: "#00ff87", Admin: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Property</div>
          <select style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, minWidth: 180 }}>
            <option style={{ background: "#1a1a2e" }}>All Properties</option>
            <option style={{ background: "#1a1a2e" }}>Apt Complex A</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Month</div>
          <input type="month" defaultValue="2026-04" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13 }} />
        </div>
        <NeonButton variant="primary">📊 KRA CSV →</NeonButton>
        <NeonButton variant="ghost">P&amp;L Report →</NeonButton>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Revenue" value={`KES ${Math.round(revenue/1000)}K`} accent="linear-gradient(90deg,#00ff87,#0ea5e9)" />
        <MetricCard label="Arrears" value={`KES ${Math.round(arrears/1000)}K`} accent="linear-gradient(90deg,#ef4444,#f97316)" />
        <MetricCard label="Expenses" value={`KES ${Math.round(totalExp/1000)}K`} accent="linear-gradient(90deg,#fbbf24,#f97316)" />
        <MetricCard label="Net P&L" value={`KES ${Math.round(pl/1000)}K`} accent="linear-gradient(90deg,#6366f1,#00ff87)" />
      </div>

      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>🧾 Expense Breakdown — April 2026</SectionTag>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Category","Description","Date","Amount"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => {
              const color = CATEGORY_COLORS[e.category] || "#a78bfa";
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}40` }}>{e.category}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{e.description}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fmtDate(e.date)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{fmt(e.amount)}</td>
                </tr>
              );
            })}
            <tr style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <td colSpan={3} style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Total</td>
              <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(expenses.reduce((s,e)=>s+e.amount,0))}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <NeonButton variant="ghost" style={{ fontSize: 12 }}>+ Add Expense →</NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Payments() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const router = useRouter();

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview",   label: "Overview",   icon: "💠" },
    { key: "initiate",   label: "Pay",        icon: "🧊" },
    { key: "schedules",  label: "Schedules",  icon: "🛰️" },
    { key: "tenant",     label: "Tenant",     icon: "👤" },
    { key: "automation", label: "Automation", icon: "⚡" },
    { key: "reports",    label: "Reports",    icon: "📡" },
  ];

  return (
    <div className="dashboard-content">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      {/* Page Tag */}
      <div className="page-tag">💳 PAYMENT MANAGEMENT</div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="section-label">PAYMENTS</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neon-purple)", marginTop: 4 }}>
            <LiveDot />Payment Hub
          </h2>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/payments/new")}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white", border: "none", borderRadius: 12,
              padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            + New Payment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? "rgba(99,102,241,0.15)" : "transparent",
              border: "none",
              borderBottom: activeTab === t.key ? "1px solid #00F0FF" : "2px solid transparent",
              borderRadius: "8px 8px 0 0",
              padding: "8px 28px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? "#a78bfa" : "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              transition: "all .15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview"   && <OverviewTab payments={MOCK_PAYMENTS} />}
      {activeTab === "initiate"   && <InitiateTab />}
      {activeTab === "schedules"  && <SchedulesTab schedules={MOCK_SCHEDULES} />}
      {activeTab === "tenant"     && <TenantTab />}
      {activeTab === "automation" && <AutomationTab />}
      {activeTab === "reports"    && <ReportsTab expenses={MOCK_EXPENSES} />}
    </div>
  );
}