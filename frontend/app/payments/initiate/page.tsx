"use client";

import { useState } from "react";
import { MOCK_TENANTS, fmt, METHOD_LABEL, METHOD_COLOR } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton } from "../_lib/components";
import {
  initiateMpesaSTK,
  createStripeSession,
  initiateBankTransfer,
} from "../../lib/payments";
import type { PayMethod, Tenant } from "../_lib/types";

type ActionState = "idle" | "loading" | "success" | "error";

export default function InitiatePage() {
  const [method, setMethod]               = useState<PayMethod>("mpesa");
  const [tenantSearch, setTenantSearch]   = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(MOCK_TENANTS[0]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [amount, setAmount]               = useState("28500");
  const [phone, setPhone]                 = useState("254712345678");
  const [ref, setRef]                     = useState("APT-A1-MAY26");

  // M-Pesa state
  const [mpesaState, setMpesaState]       = useState<ActionState>("idle");
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState("");
  const [mpesaError, setMpesaError]       = useState("");

  // Card state
  const [cardState, setCardState]         = useState<ActionState>("idle");
  const [cardClientSecret, setCardClientSecret] = useState("");
  const [cardError, setCardError]         = useState("");

  // Bank state
  const [bankState, setBankState]         = useState<ActionState>("idle");
  const [bankRef, setBankRef]             = useState("");
  const [bankError, setBankError]         = useState("");

  const tenantResults = MOCK_TENANTS.filter(
    (t) =>
      tenantSearch.length > 0 &&
      (t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.unit.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.property.toLowerCase().includes(tenantSearch.toLowerCase()))
  );

  const selectTenant = (t: Tenant) => {
    setSelectedTenant(t);
    setTenantSearch(t.name);
    setShowDropdown(false);
    setAmount(String(t.rent));
    setPhone(`254${t.phone.slice(1)}`);
    setRef(`${t.unit.replace(/\s/g, "")}-MAY26`);
    resetAllStates();
  };

  const switchMethod = (m: PayMethod) => {
    setMethod(m);
    resetAllStates();
  };

  const resetAllStates = () => {
    setMpesaState("idle"); setMpesaCheckoutId(""); setMpesaError("");
    setCardState("idle");  setCardClientSecret(""); setCardError("");
    setBankState("idle");  setBankRef(""); setBankError("");
  };

  // ── M-Pesa ────────────────────────────────────────────────────────────────
  const handleMpesaSubmit = async () => {
    if (!selectedTenant) return;
    setMpesaState("loading");
    setMpesaError("");
    try {
      const res = await initiateMpesaSTK({
        phone,
        amount: Number(amount),
        accountRef: ref,
        propertyId: selectedTenant.propertyId,
        tenantId: selectedTenant.id,
        description: `Rent payment - ${ref}`,
      });
      setMpesaCheckoutId(res.data?.checkoutRequestId ?? "");
      setMpesaState("success");
    } catch (err: any) {
      setMpesaError(err?.response?.data?.error || err?.message || "STK push failed");
      setMpesaState("error");
    }
  };

  // ── Card ──────────────────────────────────────────────────────────────────
  const handleCardSubmit = async () => {
    if (!selectedTenant) return;
    setCardState("loading");
    setCardError("");
    try {
      const { clientSecret } = await createStripeSession({
        propertyId: selectedTenant.propertyId,
        tenantId: selectedTenant.id,
        amount: Number(amount),
        accountRef: ref,
      });
      setCardClientSecret(clientSecret);
      setCardState("success");
    } catch (err: any) {
      setCardError(err?.response?.data?.error || err?.message || "Failed to create payment intent");
      setCardState("error");
    }
  };

  // ── Bank ──────────────────────────────────────────────────────────────────
  const handleBankSubmit = async () => {
    if (!selectedTenant) return;
    setBankState("loading");
    setBankError("");
    try {
      const res = await initiateBankTransfer({
        propertyId: selectedTenant.propertyId,
        tenantId: selectedTenant.id,
        amount: Number(amount),
        accountRef: ref,
      });
      setBankRef(res.data?.referenceId ?? ref);
      setBankState("success");
    } catch (err: any) {
      setBankError(err?.response?.data?.error || err?.message || "Failed to generate bank reference");
      setBankState("error");
    }
  };

  // ── Shared sub-components ─────────────────────────────────────────────────
  const ErrorBanner = ({ msg }: { msg: string }) => (
    <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13 }}>
      ❌ {msg}
    </div>
  );

  const Spinner = () => (
    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", marginLeft: 6 }} />
  );

  const methods: { key: PayMethod; icon: string; name: string; sub: string }[] = [
    { key: "mpesa",  icon: "📱", name: "M-Pesa",       sub: "STK Push / Paybill" },
    { key: "airtel", icon: "📲", name: "Airtel Money",  sub: "STK Push" },
    { key: "card",   icon: "💳", name: "Card / Wallet", sub: "Visa · MC · Apple Pay" },
    { key: "bank",   icon: "🏦", name: "Bank Transfer", sub: "Equity · KCB · Co-op" },
  ];

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd" }}>
          ℹ️ Payments trigger auto-reconciliation. M-Pesa &amp; Card receipts are issued instantly. Bank transfers require manual verification.
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* ── Tenant Selector (unchanged — you'll wire this later) ── */}
          <GlassPanel style={{ flex: "0 0 280px" }}>
            <SectionTag>👤 Select Tenant</SectionTag>
            <div style={{ position: "relative", marginTop: 4 }}>
              <input
                value={tenantSearch}
                onChange={(e) => { setTenantSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search name, unit or property…"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              {showDropdown && tenantResults.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, zIndex: 50, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {tenantResults.map((t) => (
                    <div key={t.id} onClick={() => selectTenant(t)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "background .1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.property} · {t.unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTenant && (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {selectedTenant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{selectedTenant.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{selectedTenant.property} · {selectedTenant.unit}</div>
                  </div>
                </div>
                {[
                  ["Monthly Rent",   fmt(selectedTenant.rent),         "#fff"],
                  ["Outstanding",    fmt(selectedTenant.outstanding),   selectedTenant.outstanding > 0 ? "#ef4444" : "#00ff87"],
                  ["Credit Balance", fmt(selectedTenant.creditBalance), "#60a5fa"],
                  ["Last Payment",   selectedTenant.paymentHistory[0]?.date || "—", "rgba(255,255,255,0.5)"],
                  ["Avg Delay",      `${selectedTenant.avgDelayDays} days`, selectedTenant.avgDelayDays > 5 ? "#f97316" : "#00ff87"],
                  ["Preferred",      METHOD_LABEL[selectedTenant.preferredMethod], METHOD_COLOR[selectedTenant.preferredMethod]],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: c as string }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* ── Payment Form ── */}
          <GlassPanel style={{ flex: 1, minWidth: 300 }}>
            <SectionTag>💳 Payment Method</SectionTag>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
              {methods.map((m) => (
                <div key={m.key} onClick={() => switchMethod(m.key)}
                  style={{ border: method === m.key ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)", background: method === m.key ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: method === m.key ? "0 0 20px rgba(99,102,241,0.2)" : "none" }}>
                  <div style={{ fontSize: 22 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: method === m.key ? "#a78bfa" : "#fff", marginTop: 5 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Shared fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Amount (KES)", value: amount,        onChange: (v: string) => setAmount(v),  type: "number" },
                { label: "Reference",    value: ref,           onChange: (v: string) => setRef(v),     type: "text"   },
                { label: "Description",  value: "May 2026 Rent",                                       type: "text"   },
                { label: "Period",       value: "2026-05",                                              type: "month"  },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</div>
                  <input type={f.type} defaultValue={f.value} onChange={(e) => f.onChange?.(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>

            {/* ── M-Pesa panel ── */}
            {method === "mpesa" && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Phone (2547xxxxxxxx)</div>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", width: 220 }} />
                </div>

                <NeonButton
                  variant="primary"
                  onClick={handleMpesaSubmit}
                  disabled={mpesaState === "loading" || mpesaState === "success" || !selectedTenant}
                >
                  {mpesaState === "loading" ? <>Sending…<Spinner /></> : "📱 Send STK Push →"}
                </NeonButton>

                {mpesaState === "success" && (
                  <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
                    <div style={{ fontWeight: 700, color: "#00ff87", marginBottom: 4 }}>✓ STK Push Sent</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      Prompt sent to <strong style={{ color: "#fff" }}>{phone}</strong>. Will auto-reconcile on callback.
                    </div>
                    {mpesaCheckoutId && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                        Checkout ID: {mpesaCheckoutId}
                      </div>
                    )}
                  </div>
                )}
                {mpesaState === "error" && <ErrorBanner msg={mpesaError} />}
              </div>
            )}

            {/* ── Airtel panel (not wired yet) ── */}
            {method === "airtel" && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 13 }}>
                ⚠️ Airtel Money integration coming soon. Endpoint scaffolded at <code style={{ fontFamily: "monospace" }}>POST /api/payments/airtel</code>
              </div>
            )}

            {/* ── Card panel ── */}
            {method === "card" && (
              <div>
                <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 12, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd", fontSize: 13 }}>
                  A Stripe PaymentIntent will be created with <code>automatic_payment_methods: enabled</code> — supports Visa, Mastercard, Apple Pay, Google Pay.
                </div>

                <NeonButton
                  variant="primary"
                  onClick={handleCardSubmit}
                  disabled={cardState === "loading" || cardState === "success" || !selectedTenant}
                >
                  {cardState === "loading" ? <>Creating…<Spinner /></> : "💳 Create Payment Intent →"}
                </NeonButton>

                {cardState === "success" && (
                  <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)" }}>
                    <div style={{ fontWeight: 700, color: "#00ff87", marginBottom: 6 }}>✓ Payment Intent Created</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {cardClientSecret.slice(0, 40)}…
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      Pass <code style={{ color: "#a78bfa" }}>clientSecret</code> to your Stripe Elements / Payment Element component to render the card form.
                    </div>
                  </div>
                )}
                {cardState === "error" && <ErrorBanner msg={cardError} />}
              </div>
            )}

            {/* ── Bank panel ── */}
            {method === "bank" && (
              <div>
                <NeonButton
                  variant="primary"
                  onClick={handleBankSubmit}
                  disabled={bankState === "loading" || bankState === "success" || !selectedTenant}
                >
                  {bankState === "loading" ? <>Generating…<Spinner /></> : "🏦 Generate Bank Reference →"}
                </NeonButton>

                {bankState === "success" && bankRef && (
                  <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)" }}>
                    <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>Bank Transfer Instructions</div>
                    {[["Bank", "Equity Bank"], ["Account", "0123456789"], ["Reference", bankRef], ["Amount", fmt(parseInt(amount) || 0)]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
                        <span style={{ fontFamily: "monospace", color: "#fff" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      Verify via <code style={{ color: "#a78bfa", fontFamily: "monospace" }}>PUT /api/payments/:id/verify</code>
                    </div>
                  </div>
                )}
                {bankState === "error" && <ErrorBanner msg={bankError} />}
              </div>
            )}

          </GlassPanel>
        </div>
      </div>
    </>
  );
}