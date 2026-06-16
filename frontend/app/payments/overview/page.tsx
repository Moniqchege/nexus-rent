"use client";

import { useState, useEffect } from "react";
import {
  fmt,
  METHOD_LABEL,
  METHOD_COLOR,
  METHOD_ICON,
} from "../_lib/data";

import {
  getPayments,
  getRentSchedules,
  getPaymentReport,
} from "../../lib/payments";

import type { PayMethod, PayStatus } from "../_lib/types";
import type { Payment, RentSchedule } from "../../../types/payment";

function sumByStatus(payments: Payment[], status: string) {
  return payments
    .filter((p) => p.status === status)
    .reduce((s, p) => s + p.amount, 0);
}

function countByStatus(payments: Payment[], status: string) {
  return payments.filter((p) => p.status === status).length;
}


const pageStyle: React.CSSProperties = {
  background: "#f6f7fb",
  minHeight: "100vh",
  color: "#0f172a",
  fontFamily: "Inter, sans-serif",
};

const panel: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const metricCard: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  minWidth: 0,
};

const label: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#64748b",
};

const title: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};

const sub: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};


export default function OverviewPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [activityFilter, setActivityFilter] =
    useState<"all" | PayStatus>("all");

  useEffect(() => {
    async function load() {
      const [p, s] = await Promise.all([
        getPayments(),
        getRentSchedules(),
      ]);
      setPayments(p);
      setSchedules(s);
    }
    load();
  }, []);

  const collected = sumByStatus(payments, "paid");
  const arrears = sumByStatus(payments, "overdue");
  const pending = sumByStatus(payments, "pending");

  const total = collected + arrears + pending;
  const rate = total ? Math.round((collected / total) * 100) : 0;

  const methodTotals = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  const methodEntries = Object.entries(methodTotals) as [
    PayMethod,
    number
  ][];

  const propertyEntries = Array.from(
    payments.reduce((map, p) => {
      const key = String(p.propertyId);
      if (!map.has(key))
        map.set(key, p.property?.title ?? `Property ${p.propertyId}`);
      return map;
    }, new Map<string, string>())
  );

  const filteredActivity = payments.filter(
    (p) => activityFilter === "all" || p.status === activityFilter
  );

  function handleDownloadReport(propertyId: number) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    getPaymentReport(propertyId, month);
  }

  return (
    <div style={pageStyle}>

      {/* ── METRICS ROW ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Collected",
            value: `KES ${(collected / 1000).toFixed(0)}K`,
            sub: `${countByStatus(payments, "paid")} payments`,
          },
          {
            label: "Arrears",
            value: `KES ${(arrears / 1000).toFixed(0)}K`,
            sub: `${countByStatus(payments, "overdue")} tenants`,
          },
          {
            label: "Pending",
            value: `KES ${(pending / 1000).toFixed(0)}K`,
            sub: `${countByStatus(payments, "pending")} unconfirmed`,
          },
          { label: "Expenses", value: "—", sub: "No endpoint" },
          { label: "Net P&L", value: "—", sub: "After expenses" },
        ].map((m, i) => (
          <div key={i} style={metricCard}>
            <div style={label}>{m.label}</div>
            <div style={{ ...title, fontSize: 18, marginTop: 6 }}>
              {m.value}
            </div>
            <div style={{ ...sub, marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID (STITCH STYLE) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr 260px",
          gap: 16,
          alignItems: "start",
        }}
      >

        {/* ── LEFT ── */}
        <div style={panel}>
          <div style={{ ...title, marginBottom: 12 }}>
            Collection Rate
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              textAlign: "center",
              margin: "20px 0",
            }}
          >
            {rate}%
          </div>

          <div style={{ marginTop: 12 }}>
            {methodEntries.map(([method, amount]) => {
              const pct = collected
                ? Math.round((amount / collected) * 100)
                : 0;

              return (
                <div key={method} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 4,
                      color: "#475569",
                    }}
                  >
                    <span>
                      {METHOD_ICON[method]} {METHOD_LABEL[method]}
                    </span>
                    <span style={{ fontWeight: 600 }}>{pct}%</span>
                  </div>

                  <div
                    style={{
                      height: 4,
                      background: "#e2e8f0",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: METHOD_COLOR[method],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={title}>Recent Activity</div>

            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "paid", "pending", "overdue"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      background:
                        activityFilter === f ? "#0f172a" : "#fff",
                      color:
                        activityFilter === f ? "#fff" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
          </div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {filteredActivity.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 12,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {p.tenant?.name ?? "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {p.property?.title}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>
                    {fmt(p.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {p.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={panel}>
          <div style={title}>By Property</div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {propertyEntries.map(([id, title]) => (
              <div
                key={id}
                onClick={() => handleDownloadReport(Number(id))}
                style={{
                  padding: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  {title}
                </div>

                <div
                  style={{
                    height: 4,
                    background: "#e2e8f0",
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "70%",
                      background: "#0f172a",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}