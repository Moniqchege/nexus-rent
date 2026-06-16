"use client";

import { useState, useEffect } from "react";
import { fmt } from "../_lib/data";
import { theme } from "../_lib/theme";
import {
  initiateMpesaSTK,
  createStripeSession,
  initiateBankTransfer,
} from "../../lib/payments";
import api from "@/app/lib/api";
import type { PayMethod } from "../_lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionState = "idle" | "loading" | "success" | "error";

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

interface TenantOption {
  id: number;
  scheduleId: number;
  propertyId: number;
  name: string;
  email: string;
  phone: string;
  property: string;
  location: string;
  rent: number;
  outstanding: number;
  status: RentSchedule["status"];
  period: string;
  preferredMethod: PayMethod;
}

function schedulesToOptions(schedules: RentSchedule[]): TenantOption[] {
  const map = new Map<number, TenantOption>();
  const sorted = [...schedules].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });
  for (const s of sorted) {
    if (map.has(s.tenantId)) continue;
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

function toMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

function buildRef(tenant: TenantOption): string {
  const month = new Date()
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const year = String(new Date().getFullYear()).slice(2);
  const slug = tenant.property.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return `${slug}-${tenant.id}-${month}${year}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  paid:        { label: "Healthy",      bg: "#dcfce7", color: "#16a34a" },
  scheduled:   { label: "Healthy",      bg: "#dcfce7", color: "#16a34a" },
  overdue:     { label: "Overdue",      bg: "#fee2e2", color: "#dc2626" },
  partial:     { label: "Grace Period", bg: "#fef3c7", color: "#d97706" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b" };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 13,
        height: 13,
        border: `2px solid ${dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"}`,
        borderTopColor: dark ? "#4f46e5" : "#fff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        marginLeft: 6,
        verticalAlign: "middle",
      }}
    />
  );
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 16px",
        borderRadius: 10,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        fontSize: 13,
        color: "#15803d",
      }}
    >
      {children}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        fontSize: 12,
        color: "#be123c",
      }}
    >
      ❌ {msg}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Inter, sans-serif",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 6,
  display: "block",
};

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8eaf0",
  borderRadius: 16,
  boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  overflow: "hidden",
};

export default function InitiatePage() {
  const [tenants, setTenants]           = useState<TenantOption[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantsError, setTenantsError] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantOption | null>(null);

  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [amount, setAmount] = useState("0.00");
  const [phone, setPhone]   = useState("");
  const [ref, setRef]       = useState("");

  const [actionState, setActionState]   = useState<ActionState>("idle");
  const [successMsg, setSuccessMsg]     = useState("");
  const [errorMsg, setErrorMsg]         = useState("");

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

  // Auto-select first tenant
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      pickTenant(tenants[0]);
    }
  }, [tenants]);

  function pickTenant(t: TenantOption) {
    setSelectedTenant(t);
    setAmount(String(t.outstanding > 0 ? t.outstanding : t.rent));
    setPhone(toMpesaPhone(t.phone));
    setRef(buildRef(t));
    resetState();
  }

  function resetState() {
    setActionState("idle");
    setSuccessMsg("");
    setErrorMsg("");
  }

  function clearForm() {
    setSelectedTenant(null);
    setAmount("0.00");
    setPhone("");
    setRef("");
    setTenantSearch("");
    resetState();
  }

  async function handleSubmit() {
    if (!selectedTenant || actionState === "loading") return;
    setActionState("loading");
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (method === "mpesa") {
        const res = await initiateMpesaSTK({
          phone,
          amount: Number(amount),
          accountRef: ref,
          propertyId: selectedTenant.propertyId,
          tenantId: selectedTenant.id,
          description: `Rent payment - ${ref}`,
        });
        setSuccessMsg(
          `STK Push sent to ${phone}. Checkout ID: ${res.data?.checkoutRequestId ?? "—"}`
        );
      } else if (method === "card") {
        const { clientSecret } = await createStripeSession({
          propertyId: selectedTenant.propertyId,
          tenantId: selectedTenant.id,
          amount: Number(amount),
          accountRef: ref,
        });
        setSuccessMsg(`Payment intent created. Pass client secret to Stripe Elements.`);
      } else {
        const res = await initiateBankTransfer({
          propertyId: selectedTenant.propertyId,
          tenantId: selectedTenant.id,
          amount: Number(amount),
          accountRef: ref,
        });
        setSuccessMsg(
          `Bank reference generated: ${res.data?.referenceId ?? ref}`
        );
      }
      setActionState("success");
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error || err?.message || "Payment failed"
      );
      setActionState("error");
    }
  }

  const filteredTenants = tenants.filter((t) => {
    if (!tenantSearch) return true;
    const q = tenantSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.property.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    );
  });

  const QUICK_AMOUNTS = [500, 1250, 2500];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tenant-row:hover { background: #f8fafc !important; }
        .tenant-row.selected { background: #f1f5ff !important; }
        .method-tab:hover { border-color: #c7d2fe !important; }
      `}</style>

      <div
        style={{
          padding: "20px",
          background: "#f6f7fb",
          minHeight: "100%",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 16,
          alignItems: "flex-start",
        }}
      >

        {/* CARD 1: Select Tenant Header + Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<div style={card}>
  <div style={{ padding: "18px 18px 14px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#4f46e5" }}>
          contacts
        </span>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          Select Tenant
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
          Choose a tenant to associate with this payment.
        </div>
      </div>
    </div>

    {/* Search */}
    <div style={{ position: "relative", marginTop: 10 }}>
      <span
        className="material-symbols-outlined"
        style={{
          position: "absolute",
          left: 10,
          top: "55%",
          transform: "translateY(-50%)",
          fontSize: 13,
          color: "#94a3b8",
          pointerEvents: "none",
        }}
      >
        search
      </span>

      <input
        value={tenantSearch}
        onChange={(e) => setTenantSearch(e.target.value)}
        placeholder="Search by name or unit..."
        style={{
          ...inputStyle,
          paddingLeft: 28,
          background: "#f8fafc",
        }}
      />
    </div>
  </div>
</div>

{/* CARD 2: Tenant List */}
<div style={card}>
  <div style={{ borderTop: "1px solid #f1f5f9" }}>
    {loadingTenants ? (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div
          style={{
            width: 22,
            height: 22,
            border: "2px solid #e2e8f0",
            borderTopColor: "#4f46e5",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    ) : tenantsError ? (
      <div style={{ padding: 16, fontSize: 12, color: "#dc2626" }}>
        ⚠️ {tenantsError}
      </div>
    ) : filteredTenants.length === 0 ? (
      <div style={{ padding: 20, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
        No tenants found
      </div>
    ) : (
      filteredTenants.map((t) => {
        const isSelected = selectedTenant?.id === t.id;

        return (
          <div
            key={t.id}
            onClick={() => pickTenant(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid #f1f5f9",
              cursor: "pointer",
              background: isSelected ? "#f1f5ff" : "transparent",
              borderLeft: isSelected ? "3px solid #4f46e5" : "3px solid transparent",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: isSelected
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: isSelected ? "#fff" : "#64748b",
              }}
            >
              {getInitials(t.name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.property}
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {fmt(t.outstanding > 0 ? t.outstanding : t.rent)}
              </div>
              <StatusBadge status={t.status} />
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
</div>

        {/* ── CENTER: Transaction Details ──────────────────────────────── */}
        <div style={card}>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 18 }}>
              Transaction Details
            </div>

            {/* Method tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                background: "#f1f5f9",
                borderRadius: 12,
                padding: 4,
                marginBottom: 22,
                gap: 2,
              }}
            >
              {(
                [
                  { key: "mpesa", label: "M-Pesa" },
                  { key: "card",  label: "Card"   },
                  { key: "bank",  label: "Bank"   },
                ] as { key: PayMethod; label: string }[]
              ).map((m) => {
                const active = method === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => { setMethod(m.key); resetState(); }}
                    style={{
                      padding: "9px 0",
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      borderRadius: 9,
                      border: "none",
                      cursor: "pointer",
                      background: active ? "#ffffff" : "transparent",
                      color: active ? "#0f172a" : "#64748b",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Amount to Pay</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 30 }}
                />
              </div>

              {/* Quick-pick amounts */}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: Number(amount) === a ? "#0f172a" : "#ffffff",
                      color: Number(amount) === a ? "#ffffff" : "#374151",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    ${a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone / Details */}
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>
                {method === "mpesa"
                  ? "Phone Number / Details"
                  : method === "card"
                  ? "Cardholder Name"
                  : "Account Holder"}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={
                  method === "mpesa"
                    ? "e.g. 0712 345 678"
                    : method === "card"
                    ? "Full name on card"
                    : "Account holder name"
                }
                style={inputStyle}
              />
              {method === "mpesa" && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
                  Formats automatically based on selected provider.
                </div>
              )}
            </div>

            {/* Reference */}
            <div style={{ marginBottom: 24 }}>
              <label style={fieldLabel}>Payment Reference</label>
              <input
                value={ref || ""}
                onChange={(e) => setRef(e.target.value)}
                placeholder={selectedTenant ? undefined : "Select a tenant first"}
                readOnly={!selectedTenant}
                style={{
                  ...inputStyle,
                  opacity: selectedTenant ? 1 : 0.55,
                  cursor: selectedTenant ? "text" : "default",
                }}
              />
            </div>

            {/* Success/Error feedback */}
            {actionState === "success" && successMsg && (
              <SuccessBanner>✓ {successMsg}</SuccessBanner>
            )}
            {actionState === "error" && errorMsg && (
              <ErrorBanner msg={errorMsg} />
            )}

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={!selectedTenant || actionState === "loading" || actionState === "success"}
              style={{
                width: "100%",
                padding: "13px 0",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                border: "none",
                cursor: selectedTenant && actionState === "idle" ? "pointer" : "default",
                background:
                  !selectedTenant || actionState === "success"
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color:
                  !selectedTenant || actionState === "success"
                    ? "#94a3b8"
                    : "#ffffff",
                boxShadow:
                  selectedTenant && actionState === "idle"
                    ? "0 4px 14px rgba(79,70,229,0.30)"
                    : "none",
                transition: "all 0.15s",
                letterSpacing: "0.01em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              {actionState === "loading" ? (
                <>
                  Processing
                  <Spinner />
                </>
              ) : actionState === "success" ? (
                "✓ Payment Initiated"
              ) : (
                "Initiate Payment"
              )}
            </button>

            <button
              onClick={clearForm}
              style={{
                width: "100%",
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Clear Form
            </button>
          </div>
        </div>
      </div>
    </>
  );
}