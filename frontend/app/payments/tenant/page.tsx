"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassPanel, SectionTag, NeonButton } from "../_lib/components";
import api from "@/app/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


interface Lease {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  billingCycle: string;
  status: string;
  lateFeePercent: number;
  graceDays: number;
  creditBalance?: number;
  property: { id: number; title: string; location: string };
  tenant: { id: number; name: string; email: string; phone: string };
}

interface RentSchedule {
  id: number;
  dueDate: string;
  amount: number;
  lateFeeAmount: number | null;
  allocatedAmount: number;
  status: "scheduled" | "overdue" | "paid" | "partial";
  period: string;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  referenceId: string | null;
  createdAt: string;
}

interface LedgerRow {
  type: "charge" | "payment";
  date: string;
  amount: number;
  desc?: string;
}

interface TenantFinancials {
  lease: Lease;
  schedules: RentSchedule[];
  payments: Payment[];
  ledger: LedgerRow[];
  // computed
  outstanding: number;
  nextDue: string;
  lateFees: number;
  ytdPaid: number;
  creditBalance: number;
  preferredMethod: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "KES " + n.toLocaleString("en-KE", { minimumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const METHOD_LABEL: Record<string, string> = {
  mpesa: "M-Pesa",
  card: "Card",
  bank: "Bank Transfer",
  airtel: "Airtel Money",
};

const METHOD_COLOR: Record<string, string> = {
  mpesa: "#00c853",
  card: "#6366f1",
  bank: "#f59e0b",
  airtel: "#ef4444",
};

const STATUS_COLOR: Record<string, string> = {
  paid: "#00ff87",
  overdue: "#ef4444",
  scheduled: "rgba(255,255,255,0.6)",
  partial: "#f97316",
};

// ─── Data hook ────────────────────────────────────────────────────────────────


// ─── PDF Generation ───────────────────────────────────────────────────────────

function generateStatementPDF(
  lease: Lease,
  financials: TenantFinancials,
  ledger: any[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header bar ──
  doc.setFillColor(26, 26, 46); // #1a1a2e
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFontSize(18);
  doc.setTextColor(99, 102, 241); // indigo
  doc.setFont("helvetica", "bold");
  doc.text("NEXUS RENT", margin, 12);

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 200);
  doc.setFont("helvetica", "normal");
  doc.text("Statement of Account", margin, 20);

  const today = new Date().toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric"
  });
  doc.text(`Generated: ${today}`, pageW - margin, 20, { align: "right" });

  // ── Tenant + Lease info grid ──
  let y = 36;

  // Left block: tenant
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(margin, y, 85, 44, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 241);
  doc.setFont("helvetica", "bold");
  doc.text("TENANT", margin + 4, y + 7);
  doc.setTextColor(30, 30, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(lease.tenant.name, margin + 4, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 120);
  doc.text(lease.tenant.email, margin + 4, y + 22);
  doc.text(lease.tenant.phone ?? "—", margin + 4, y + 29);
  doc.text(`Since: ${new Date(lease.startDate).toLocaleDateString("en-KE")}`, margin + 4, y + 36);

  // Right block: lease
  const rx = margin + 93;
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(rx, y, 85, 44, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 241);
  doc.setFont("helvetica", "bold");
  doc.text("LEASE", rx + 4, y + 7);
  doc.setTextColor(30, 30, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(lease.property.title, rx + 4, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 120);
  doc.text(lease.property.location, rx + 4, y + 22);
  doc.text(`Rent: KES ${lease.rentAmount.toLocaleString()} / ${lease.billingCycle}`, rx + 4, y + 29);
  const endLabel = `Ends: ${new Date(lease.endDate).toLocaleDateString("en-KE")}`;
  const statusLabel = `Status: ${lease.status.toUpperCase()}`;
  doc.text(`${endLabel}  ·  ${statusLabel}`, rx + 4, y + 36);

  y += 52;

  // ── Summary KPIs ──
  const kpis = [
    { label: "Outstanding", value: `KES ${financials.outstanding.toLocaleString()}`, warn: financials.outstanding > 0 },
    { label: "YTD Paid",    value: `KES ${financials.ytdPaid.toLocaleString()}`,     warn: false },
    { label: "Late Fees",   value: `KES ${financials.lateFees.toLocaleString()}`,    warn: financials.lateFees > 0 },
    { label: "Credit Bal.", value: `KES ${financials.creditBalance.toLocaleString()}`, warn: false },
  ];

  const kpiW = (pageW - margin * 2) / kpis.length;
  kpis.forEach((k, i) => {
    const kx = margin + i * kpiW;
    doc.setFillColor(k.warn ? 255 : 240, k.warn ? 240 : 248, k.warn ? 240 : 255);
    doc.roundedRect(kx, y, kpiW - 3, 18, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 140);
    doc.setFont("helvetica", "normal");
    doc.text(k.label.toUpperCase(), kx + (kpiW - 3) / 2, y + 6, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(k.warn ? 180 : 30, k.warn ? 40 : 30, k.warn ? 40 : 100);
    doc.text(k.value, kx + (kpiW - 3) / 2, y + 13, { align: "center" });
  });

  y += 26;

  // ── Statement table ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 46);
  doc.text("Transaction History", margin, y);
  y += 4;

  const rows = ledger.map((row: any) => {
    const isPayment = row.type === "payment";
    const charge  = !isPayment ? `KES ${row.amount.toLocaleString()}` : "—";
    const payment = isPayment  ? `KES ${Math.abs(row.amount).toLocaleString()}` : "—";
    const bal     = row.balance < 0
      ? `CR KES ${Math.abs(row.balance).toLocaleString()}`
      : row.balance === 0 ? "—"
      : `KES ${row.balance.toLocaleString()}`;
    const date = new Date(row.date).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric"
    });
    const desc = row.desc ?? (isPayment ? "Payment received" : "Rent charge");
    return [date, desc, charge, payment, bal];
  });

  // Build head row with per-cell alignment matching body columns
  const headRow = [
    { content: "Date",        styles: { halign: "left"  as const } },
    { content: "Description", styles: { halign: "left"  as const } },
    { content: "Charge",      styles: { halign: "right" as const } },
    { content: "Payment",     styles: { halign: "right" as const } },
    { content: "Balance",     styles: { halign: "right" as const } },
  ];

  autoTable(doc, {
    startY: y,
    head: [headRow],
    body: rows.length > 0 ? rows : [["—", "No transactions yet", "—", "—", "—"]],
    margin: { left: margin, right: margin },
    tableWidth: pageW - margin * 2,
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [30, 30, 60],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [160, 160, 220],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    columnStyles: {
      0: { cellWidth: 30,     halign: "left"  },
      1: { cellWidth: "auto", halign: "left"  },
      2: { cellWidth: 36,     halign: "right" },
      3: { cellWidth: 36,     halign: "right" },
      4: { cellWidth: 38,     halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        if (data.column.index === 3 && String(data.cell.raw).startsWith("KES")) {
          data.cell.styles.textColor = [0, 140, 80];
        }
        if (data.column.index === 4) {
          const val = String(data.cell.raw);
          if (val.startsWith("CR")) {
            data.cell.styles.textColor = [0, 100, 200];
          } else if (val.startsWith("KES")) {
            data.cell.styles.textColor = [200, 40, 40];
          }
        }
      }
    },
  });

  // ── Footer ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? 260;
  doc.setDrawColor(200, 200, 220);
  doc.line(margin, finalY + 8, pageW - margin, finalY + 8);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 180);
  doc.text(
    "This is a system-generated statement from Nexus Rent. For queries contact your property manager.",
    pageW / 2,
    finalY + 14,
    { align: "center" }
  );

  // ── Save ──
  const filename = `statement-${lease.tenant.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 7)}.pdf`;
  doc.save(filename);
}

async function fetchTenantFinancials(lease: Lease): Promise<TenantFinancials> {
  const [schedulesRes, paymentsRes, ledgerRes] = await Promise.all([
    api.get(`/api/payments/schedules?leaseId=${lease.id}&tenantId=${lease.tenant.id}`), // ← add tenantId
    api.get(`/api/payments?tenantId=${lease.tenant.id}`),
    api.get(`/api/payments/tenants/${lease.tenant.id}/statement`),
  ]);

  const [schedulesData, paymentsData, ledgerData] = [
    schedulesRes.data,
    paymentsRes.data,
    ledgerRes.data,
  ];

  const schedules: RentSchedule[] = Array.isArray(schedulesData?.schedules) ? schedulesData.schedules : [];
  const payments: Payment[]       = Array.isArray(paymentsData?.payments)   ? paymentsData.payments   : [];
  const ledger: LedgerRow[]       = Array.isArray(ledgerData?.ledger)       ? ledgerData.ledger       : [];

  const unpaid: RentSchedule[] = schedules.filter(
    (s) => s.status !== "paid"
  );
  const outstanding = unpaid.reduce(
    (acc, s) => acc + s.amount + (s.lateFeeAmount ?? 0) - s.allocatedAmount,
    0
  );

  const nextScheduled = schedules
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const isOverdue = schedules.some((s) => s.status === "overdue");
  const nextDue = isOverdue
    ? "OVERDUE"
    : nextScheduled
    ? fmtDate(nextScheduled.dueDate)
    : "—";

  const lateFees = schedules.reduce(
    (acc, s) => acc + (s.lateFeeAmount ?? 0),
    0
  );

  const now = new Date();
  const ytdPaid = payments
    .filter(
      (p) =>
        p.status === "paid" &&
        p.paidAt &&
        new Date(p.paidAt).getFullYear() === now.getFullYear()
    )
    .reduce((acc, p) => acc + p.amount, 0);

  // Most used payment method
  const methodCounts: Record<string, number> = {};
  for (const p of payments as Payment[]) {
    if (p.status === "paid") methodCounts[p.method] = (methodCounts[p.method] ?? 0) + 1;
  }
  const preferredMethod =
    Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "mpesa";

  // Compute running balance for ledger
  let running = 0;
  const ledgerWithBalance = ledger.map((row) => {
    running += row.amount; // charges positive, payments negative
    return { ...row, balance: running };
  });

  return {
    lease,
    schedules,
    payments,
    ledger: ledgerWithBalance,
    outstanding,
    nextDue,
    lateFees,
    ytdPaid,
    creditBalance: (lease as any).creditBalance ?? 0,
    preferredMethod,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
      <div
        style={{
          width: 28,
          height: 28,
          border: "2px solid rgba(99,102,241,0.2)",
          borderTop: "2px solid #6366f1",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantPage() {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [financials, setFinancials] = useState<TenantFinancials | null>(null);

  const [loadingLeases, setLoadingLeases] = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLeases(true);
    api.get("/api/leases")
  .then((res) => {
    const raw = Array.isArray(res.data?.leases) ? res.data.leases : [];

    const list: Lease[] = raw.map((l: any) => ({
      ...l,
      tenant: l.tenants?.[0]?.tenant ?? null, 
    }));

    setLeases(list);
    if (list.length > 0) setSelectedLease(list[0]);
  })
      .catch(() => setError("Failed to load leases"))
      .finally(() => setLoadingLeases(false));
  }, []);

  // Load financials whenever selected lease changes
  useEffect(() => {
    if (!selectedLease) return;
    setLoadingFinancials(true);
    setError(null);
    fetchTenantFinancials(selectedLease)
      .then(setFinancials)
      .catch(() => setError("Failed to load tenant data"))
      .finally(() => setLoadingFinancials(false));
  }, [selectedLease]);

  const searchResults = leases.filter(
    (l) =>
      search.length > 0 &&
      l.tenant.name.toLowerCase().includes(search.toLowerCase())
  );

  const t = financials;
  const lease = selectedLease;

  const ledgerWithBalance = t
    ? (() => {
        let running = 0;
        return (t.ledger as any[]).map((row: any) => {
          running += row.amount;
          return { ...row, balance: running };
        });
      })()
    : [];

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* ── Left column ── */}
      <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Search / switch tenant */}
        <GlassPanel style={{ padding: 16 }}>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
              placeholder="🔍  Switch tenant…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {showSearch && searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  zIndex: 50,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                {searchResults.map((l) => (
                  <div
                    key={l.id}
                    onMouseDown={() => {
                      setSelectedLease(l);
                      setSearch(l.tenant.name);
                      setShowSearch(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(99,102,241,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {l.tenant.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {l.property.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Tenant summary card */}
        {loadingLeases ? (
          <GlassPanel><Spinner /></GlassPanel>
        ) : lease ? (
          <GlassPanel>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16, color: "#fff",
                  boxShadow: "0 0 20px rgba(99,102,241,0.4)", flexShrink: 0,
                }}
              >
                {lease.tenant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  {lease.tenant.name}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {lease.property.title}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  {lease.tenant.email}
                </div>
              </div>
            </div>

            {loadingFinancials ? (
              <Spinner />
            ) : t ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 12,
                }}
              >
                <StatRow
                  label="Outstanding"
                  value={fmt(t.outstanding)}
                  color={t.outstanding > 0 ? "#ef4444" : "#00ff87"}
                />
                <StatRow
                  label="Credit Balance"
                  value={fmt(t.creditBalance)}
                  color="#60a5fa"
                />
                <StatRow
                  label="Next Due"
                  value={t.nextDue}
                  color={t.nextDue === "OVERDUE" ? "#ef4444" : "#fff"}
                />
                <StatRow
                  label="Late Fees (total)"
                  value={fmt(t.lateFees)}
                  color={t.lateFees > 0 ? "#f97316" : "rgba(255,255,255,0.4)"}
                />
                <StatRow
                  label="YTD Paid"
                  value={fmt(t.ytdPaid)}
                  color="#00ff87"
                />
                <StatRow
                  label="Preferred Method"
                  value={METHOD_LABEL[t.preferredMethod] ?? t.preferredMethod}
                  color={METHOD_COLOR[t.preferredMethod] ?? "#fff"}
                />
                <StatRow
                  label="Phone"
                  value={lease.tenant.phone ?? "—"}
                  color="rgba(255,255,255,0.55)"
                />
              </div>
            ) : null}
          </GlassPanel>
        ) : (
          <GlassPanel>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 20 }}>
              No leases found
            </div>
          </GlassPanel>
        )}
      </div>

      {/* ── Right column: Statement ── */}
      <GlassPanel style={{ flex: 1, minWidth: 300, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SectionTag>📄 Statement of Account</SectionTag>
          <NeonButton
            variant="ghost"
            style={{ fontSize: 11, padding: "5px 10px", cursor: lease && t ? "pointer" : "not-allowed", opacity: lease && t ? 1 : 0.4 }}
            onClick={() => {
              if (lease && t) generateStatementPDF(lease, t, ledgerWithBalance);
            }}
          >
            📥 Download PDF
          </NeonButton>
        </div>

        {error && (
          <div
            style={{
              margin: 16,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              fontSize: 12,
              color: "#ef4444",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loadingFinancials ? (
          <Spinner />
        ) : ledgerWithBalance.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              fontSize: 13,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            No transactions yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Date", "Description", "Charge", "Payment", "Balance"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerWithBalance.map((row: any, i: number) => {
                  const isPayment = row.type === "payment";
                  const charge = !isPayment ? row.amount : 0;
                  const payment = isPayment ? Math.abs(row.amount) : 0;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: isPayment
                          ? "rgba(0,255,135,0.02)"
                          : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtDate(row.date)}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: isPayment ? "#00ff87" : "#fff",
                        }}
                      >
                        {row.desc ?? (isPayment ? "Payment received" : "Rent charge")}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: charge ? "#fff" : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {charge ? fmt(charge) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: payment ? "#00ff87" : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {payment ? fmt(payment) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            row.balance < 0
                              ? "#60a5fa"
                              : row.balance === 0
                              ? "rgba(255,255,255,0.4)"
                              : "#ef4444",
                        }}
                      >
                        {row.balance < 0
                          ? `CR ${fmt(-row.balance)}`
                          : row.balance === 0
                          ? "—"
                          : fmt(row.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}