"use client";

import { useState, useEffect } from "react";
import { fmt, METHOD_LABEL, METHOD_COLOR } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton } from "../_lib/components";
import {
  initiateMpesaSTK,
  createStripeSession,
  initiateBankTransfer,
} from "../../lib/payments";
import api from "@/app/lib/api";
import type { PayMethod } from "../_lib/types";

type ActionState = "idle" | "loading" | "success" | "error";

// Derived from the schedules API response shape
interface ScheduleTenant {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface ScheduleProperty {
  id: number;
  title: string;
  location: string;
}

interface RentSchedule {
  id: number;
  propertyId: number;
  tenantId: number;
  dueDate: string;
  amount: number;
  lateFeeAmount: number | null;
  allocatedAmount: number;
  status: "scheduled" | "overdue" | "paid" | "partial";
  period: string;
  tenant: ScheduleTenant;
  property: ScheduleProperty;
}

// Flattened shape used by the form — one entry per tenant (latest schedule)
interface TenantOption {
  id: number;           // tenantId
  scheduleId: number;
  propertyId: number;
  name: string;
  email: string;
  phone: string;         // raw e.g. "0712345678"
  property: string;      // property title
  location: string;
  rent: number;
  outstanding: number;   // amount - allocatedAmount + lateFee
  status: RentSchedule["status"];
  period: string;
  preferredMethod: PayMethod;
}

// Collapse schedules → one TenantOption per tenantId (pick the most recent/overdue)
function schedulesToOptions(schedules: RentSchedule[]): TenantOption[] {
  const map = new Map<number, TenantOption>();

  // Sort so overdue come first, then by dueDate desc
  const sorted = [...schedules].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  for (const s of sorted) {
    if (map.has(s.tenantId)) continue; // keep first (best) match
    map.set(s.tenantId, {
      id: s.tenantId,
      scheduleId: s.id,
      propertyId: s.propertyId,
      name: s.tenant.name,
      email: s.tenant.email,
      phone: s.tenant.phone,
      property: s.property.title,
      location: s.property.location,
      rent: s.amount,
      outstanding: s.amount - s.allocatedAmount + (s.lateFeeAmount ?? 0),
      status: s.status,
      period: s.period,
      preferredMethod: "mpesa",
    });
  }

  return Array.from(map.values());
}

// Normalise phone → 254xxxxxxxxx for M-Pesa
function toMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

// Current period string e.g. "APT-A1-MAY26"
function buildRef(tenant: TenantOption): string {
  const month = new Date().toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = String(new Date().getFullYear()).slice(2);
  const slug = tenant.property.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `${slug}-${tenant.id}-${month}${year}`;
}

export default function InitiatePage() {
  // ── Tenant loading ────────────────────────────────────────────────────────
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantsError, setTenantsError] = useState("");

  useEffect(() => {
    setLoadingTenants(true);
    api
      .get("/api/payments/schedules")
      .then((res) => {
        const raw: RentSchedule[] = Array.isArray(res.data?.schedules)
          ? res.data.schedules
          : [];
        setTenants(schedulesToOptions(raw));
      })
      .catch(() => setTenantsError("Failed to load tenants"))
      .finally(() => setLoadingTenants(false));
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [method, setMethod]                   = useState<PayMethod>("mpesa");
  const [tenantSearch, setTenantSearch]       = useState("");
  const [selectedTenant, setSelectedTenant]   = useState<TenantOption | null>(null);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [amount, setAmount]                   = useState("0");
  const [phone, setPhone]                     = useState("");
  const [ref, setRef]                         = useState("");

  // Auto-select first tenant once loaded
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      const first = tenants[0];
      setSelectedTenant(first);
      setTenantSearch(first.name);
      setAmount(String(first.rent));
      setPhone(toMpesaPhone(first.phone));
      setRef(buildRef(first));
    }
  }, [tenants]);

  // ── Action states ─────────────────────────────────────────────────────────
  const [mpesaState, setMpesaState]           = useState<ActionState>("idle");
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState("");
  const [mpesaError, setMpesaError]           = useState("");

  const [cardState, setCardState]             = useState<ActionState>("idle");
  const [cardClientSecret, setCardClientSecret] = useState("");
  const [cardError, setCardError]             = useState("");

  const [bankState, setBankState]             = useState<ActionState>("idle");
  const [bankRef, setBankRef]                 = useState("");
  const [bankError, setBankError]             = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tenantResults = tenants.filter(
    (t) =>
      tenantSearch.length > 0 &&
      (t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.property.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        t.location.toLowerCase().includes(tenantSearch.toLowerCase()))
  );

  const selectTenant = (t: TenantOption) => {
    setSelectedTenant(t);
    setTenantSearch(t.name);
    setShowDropdown(false);
    setAmount(String(t.rent));
    setPhone(toMpesaPhone(t.phone));
    setRef(buildRef(t));
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

  // ── Sub-components ────────────────────────────────────────────────────────
  const ErrorBanner = ({ msg }: { msg: string }) => (
    <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13 }}>
      ❌ {msg}
    </div>
  );

  const Spinner = () => (
    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", marginLeft: 6 }} />
  );

  const LoadingSpinner = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  const methods: { key: PayMethod; icon: string; name: string; sub: string }[] = [
    { key: "mpesa", icon: "📱", name: "M-Pesa",        sub: "STK Push / Paybill" },
    { key: "card",  icon: "💳", name: "Card / Wallet", sub: "Visa · MC · Apple Pay" },
    { key: "bank",  icon: "🏦", name: "Bank Transfer", sub: "Equity · KCB · Co-op" },
  ];

  const statusColor: Record<string, string> = {
    overdue:   "#ef4444",
    scheduled: "#00ff87",
    partial:   "#f97316",
    paid:      "rgba(255,255,255,0.4)",
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#93c5fd" }}>
          ℹ️ Payments trigger auto-reconciliation. M-Pesa &amp; Card receipts are issued instantly. Bank transfers require manual verification.
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* ── Tenant Selector ── */}
          <GlassPanel style={{ flex: "0 0 280px" }}>
            <SectionTag>👤 Select Tenant</SectionTag>

            {tenantsError && (
              <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>⚠️ {tenantsError}</div>
            )}

            <div style={{ position: "relative", marginTop: 4 }}>
              <input
                value={tenantSearch}
                onChange={(e) => { setTenantSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder={loadingTenants ? "Loading tenants…" : "Search name or property…"}
                disabled={loadingTenants}
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", opacity: loadingTenants ? 0.5 : 1 }}
              />
              {showDropdown && tenantResults.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, zIndex: 50, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {tenantResults.map((t) => (
                    <div key={t.id} onClick={() => selectTenant(t)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "background .1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {t.property} ·{" "}
                        <span style={{ color: statusColor[t.status] ?? "rgba(255,255,255,0.4)" }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loadingTenants ? (
              <LoadingSpinner />
            ) : selectedTenant ? (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {selectedTenant.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{selectedTenant.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {selectedTenant.property} · {selectedTenant.location}
                    </div>
                  </div>
                </div>
                {([
                  ["Monthly Rent",   fmt(selectedTenant.rent),        "#fff"],
                  ["Outstanding",    fmt(selectedTenant.outstanding),  selectedTenant.outstanding > 0 ? "#ef4444" : "#00ff87"],
                  ["Status",         selectedTenant.status,            statusColor[selectedTenant.status] ?? "#fff"],
                  ["Period",         selectedTenant.period,            "rgba(255,255,255,0.5)"],
                  ["Phone",          selectedTenant.phone,             "rgba(255,255,255,0.5)"],
                  ["Email",          selectedTenant.email,             "rgba(255,255,255,0.45)"],
                ] as [string, string, string][]).map(([k, v, c]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: c, maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
                No tenants found
              </div>
            )}
          </GlassPanel>

          {/* ── Payment Form ── */}
          <GlassPanel style={{ flex: 1, minWidth: 300 }}>
            <SectionTag>💳 Payment Method</SectionTag>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
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
                { label: "Amount (KES)", value: amount,          onChange: (v: string) => setAmount(v),  type: "number" },
                { label: "Reference",    value: ref,             onChange: (v: string) => setRef(v),     type: "text"   },
                { label: "Description",  value: `${selectedTenant?.period ?? ""} Rent`,                  type: "text"   },
                { label: "Period",       value: selectedTenant?.period ?? "",                             type: "text"   },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</div>
                  <input
                    type={f.type}
                    value={f.value}
                    readOnly={!f.onChange}
                    onChange={(e) => f.onChange?.(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", opacity: f.onChange ? 1 : 0.6 }}
                  />
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
                      Pass <code style={{ color: "#a78bfa" }}>clientSecret</code> to your Stripe Elements / Payment Element component.
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