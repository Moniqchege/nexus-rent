"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  Wallet,
  Users,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useDashboardStore } from "../store/dashboardStore";
import { formatKES, formatKESShort, formatDate } from "../lib/utils";

// ── Color palette for the expense donut slices ─────────────
const PIE_COLORS = ["#2563EB", "#7C3AED", "#16A34A", "#D97706", "#DC2626"];

// ── Skeleton placeholder ───────────────────────────────────
function Skeleton({
  height = 24,
  width = "100%",
  borderRadius = 6,
}: {
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: "rgba(255,255,255,0.07)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// ── Custom Tooltip for LineChart ───────────────────────────
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-card, #1a1a2e)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ color: "var(--neon-blue)" }}>
          {formatKES(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
}

// ── Custom Tooltip for PieChart ────────────────────────────
function ExpenseTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--bg-card, #1a1a2e)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          color: "var(--text-primary)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</div>
        <div style={{ color: "var(--neon-purple)" }}>
          {formatKES(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
}

// ── Main page ──────────────────────────────────────────────
export default function DashboardPage() {
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalExpenses =
  stats?.expenseByCategory?.reduce(
    (sum, item) => sum + item.total,
    0
  ) ?? 0;

const expenseData =
  stats?.expenseByCategory?.map((item, index) => ({
    ...item,
    color: PIE_COLORS[index % PIE_COLORS.length],
    percent:
      totalExpenses > 0
        ? ((item.total / totalExpenses) * 100).toFixed(1)
        : "0",
  })) ?? [];

  return (
    <div className="dashboard-content">
      {/* Error banner */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.4)",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 20,
            color: "#fca5a5",
            fontSize: 14,
          }}
        >
          <AlertTriangle size={16} />
          Could not load dashboard data. Please refresh.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div className="section-label">OVERVIEW</div>
      </div>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 18,
        }}
      >
        Welcome back, here&apos;s what&apos;s happening today
      </h2>

      {/* ── KPI Stat Cards ──────────────────────────────── */}
      <section className="stats-section">
        <div className="stats-row">
          {/* Total Properties */}
          <div className="overview-stat animate-in delay-1">
            <div className="stat-header">
              <div className="stat-title">
                <div className="ov-label">Total Properties</div>
              </div>
              <div
                className="stat-icon"
                style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--neon-blue)",
              }}
              >
               <Building2 size={18} />
              </div>
           </div>
            {loading ? (
              <div style={{ marginTop: 6 }}>
                <Skeleton height={32} width={80} />
              </div>
            ) : (
              <div className="ov-value" style={{ color: "var(--neon-blue)" }}>
                {stats?.totalProperties ?? 0}
              </div>
            )}
          </div>

          {/* Occupancy Rate */}
          <div className="overview-stat animate-in delay-2">
            <div className="stat-header">
              <div className="stat-title">
                <div className="ov-label">Occupancy Rate</div>
              </div>
              <div
                className="stat-icon"
                style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--neon-purple)",
              }}
              >
                <Users size={20} />
              </div>
            </div>
            {loading ? (
              <div style={{ marginTop: 6 }}>
                <Skeleton height={32} width={80} />
              </div>
            ) : (
              <div className="ov-value" style={{ color: "var(--neon-purple)" }}>
                {(stats?.occupancyRate ?? 0).toFixed(1)}%
              </div>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="overview-stat animate-in delay-3">
            <div className="stat-header">
              <div className="stat-title">
                <div className="ov-label">Monthly Revenue</div>
              </div>
              <div
                className="stat-icon"
                style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--accent-success)",
              }}
              >
               <Wallet size={20} />
              </div>
           </div>
            {loading ? (
              <div style={{ marginTop: 6 }}>
                <Skeleton height={32} width={120} />
              </div>
            ) : (
              <div
                className="ov-value"
                style={{ color: "var(--accent-success)" }}
              >
                {formatKES(stats?.monthlyRevenue ?? 0)}
              </div>
            )}
          </div>

          {/* Total Arrears */}
          <div className="overview-stat animate-in delay-4">
            <div className="stat-header">
              <div className="stat-title">
                <div className="ov-label">Total Arrears</div>
              </div>
              <div
                className="stat-icon"
                style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--accent-warning)",
              }}
              >
               <AlertTriangle size={20} />
              </div>
           </div>
            {loading ? (
              <div style={{ marginTop: 6 }}>
                <Skeleton height={32} width={120} />
              </div>
            ) : (
              <div
                className="ov-value"
                style={{ color: "var(--accent-warning)" }}
              >
                {formatKES(stats?.totalArrears ?? 0)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div className="charts-row">
        {/* Revenue Trend Line Chart */}
        <div className="chart-card">
          <div
            className="chart-card-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <TrendingUp size={16} color="var(--neon-blue)" />
            Revenue Trend
          </div>

          {loading ? (
            <Skeleton height={200} borderRadius={8} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={stats?.revenueTrend ?? []}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatKESShort}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--neon-blue)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--neon-blue)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense Breakdown Donut Chart */}
        <div className="chart-card expense-card">
          <div className="expense-header">
           <div className="chart-card-title">
            Expense Breakdown
           </div>
           <span className="expense-period-label">This Month</span>
          </div>
        {loading ? (
          <Skeleton height={260} borderRadius={10} />
        ) : expenseData.length === 0 ? (
        <div
          style={{
            height: 260,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          No expense data available
       </div>

      ) : (
      <div className="expense-content"> 
        <div className="expense-chart">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="total"
                nameKey="category"
                cx="40%"
                cy="40%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={3}
                cornerRadius={5}
              >
              {expenseData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                />
              ))}
            </Pie>

            <Tooltip content={<ExpenseTooltip />} />

            <text
              x="40%"
              y="42%"
              textAnchor="middle"
              className="donut-value"
            >
              {formatKES(totalExpenses)}
            </text>

            <text
              x="40%"
              y="48%"
              textAnchor="middle"
              className="donut-label"
            >
              Total Expenses
            </text>

          </PieChart>
        </ResponsiveContainer>

      </div>

      <div className="expense-legend">

        {expenseData.map((item) => (
          <div
            className="legend-row"
            key={item.category}
          >
            <div className="legend-left">
              <span
                className="legend-dot"
                style={{
                  background: item.color,
                }}
              />
              <span>{item.category}</span>
            </div>

            <div className="legend-right">

              <span className="legend-value">
                {formatKES(item.total)}
              </span>

              <span className="legend-percent">
                {item.percent}%
              </span>
            </div>
          </div>

        ))}

        <button className="report-link">
          View Full Report
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )}
</div>
      </div>

      {/* ── Recent Payments ─────────────────────────────── */}
      <section
        style={{
          marginTop: 24,
          marginBottom: 30,
          background: "var(--bg-card, rgba(255,255,255,0.03))",
          border: "1px solid var(--border-glow, rgba(255,255,255,0.08))",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Wallet size={16} color="var(--neon-blue)" />
            Recent Payments
          </div>
          <Link
            href="/payments"
            style={{
              fontSize: 13,
              color: "var(--neon-blue)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height={40} borderRadius={6} />
            ))}
          </div>
        ) : (stats?.recentPayments ?? []).length === 0 ? (
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              padding: "12px 0",
            }}
          >
            No payments yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    color: "var(--text-secondary)",
                    borderBottom:
                      "1px solid var(--border-glow, rgba(255,255,255,0.08))",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontWeight: 500,
                    }}
                  >
                    Tenant
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontWeight: 500,
                    }}
                  >
                    Property
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontWeight: 500,
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      fontWeight: 500,
                    }}
                  >
                    Method
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      fontWeight: 500,
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentPayments ?? []).slice(0, 5).map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom:
                        "1px solid var(--border-glow, rgba(255,255,255,0.05))",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 8px",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {p.tenantName}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.propertyTitle}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        color: "var(--accent-success)",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {formatKES(p.amount)}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.method}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        color: "var(--text-secondary)",
                        textAlign: "right",
                      }}
                    >
                      {formatDate(p.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Leases Expiring Soon ─────────────────────────── */}
      {loading && !stats ? (
        <section style={{ marginTop: 24 }}>
          <Skeleton height={80} borderRadius={12} />
        </section>
      ) : (stats?.leasesExpiringSoon ?? []).length > 0 ? (
        <section
          style={{
            marginTop: 24,
            marginBottom: 34,
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.35)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--accent-warning)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <AlertTriangle size={16} />
            Leases Expiring Soon
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(stats?.leasesExpiringSoon ?? []).map((lease) => (
              <Link
                key={lease.id}
                href="/leases"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "rgba(217, 119, 6, 0.07)",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        fontSize: 14,
                      }}
                    >
                      {lease.propertyTitle}
                    </div>
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {lease.tenantNames.join(", ")}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--accent-warning)",
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      marginLeft: 16,
                    }}
                  >
                    Expires {formatDate(lease.endDate)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
