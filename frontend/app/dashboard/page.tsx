"use client";
import React from "react";
import {
  Building2,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowUpRight,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="dashboard-content">
      <div className="page-tag">📊 ANALYTICS DASHBOARD</div>

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
          fontSize: 24,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Welcome back, here's what's happening today
      </h2>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-row">
          <div className="overview-stat animate-in delay-1">
            <div
              style={{
                background: "rgba(37, 99, 235, 0.1)",
                color: "var(--neon-blue)",
              }}
              className="stat-icon"
            >
              <Building2 size={20} />
            </div>
            <div className="ov-label">Total Properties</div>
            <div className="ov-value" style={{ color: "var(--neon-blue)" }}>
              2,847
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              <ArrowUpRight size={12} /> 12.4% this month
            </div>
          </div>

          <div className="overview-stat animate-in delay-2">
            <div
              style={{
                background: "rgba(124, 58, 237, 0.1)",
                color: "var(--neon-purple)",
              }}
              className="stat-icon"
            >
              <Users size={20} />
            </div>
            <div className="ov-label">Occupancy Rate</div>
            <div className="ov-value" style={{ color: "var(--neon-purple)" }}>
              89.2%
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              <ArrowUpRight size={12} /> 3.1% vs last quarter
            </div>
          </div>

          <div className="overview-stat animate-in delay-3">
            <div
              style={{
                background: "rgba(22, 163, 74, 0.1)",
                color: "var(--accent-success)",
              }}
              className="stat-icon"
            >
              <Wallet size={20} />
            </div>
            <div className="ov-label">Total Revenue</div>
            <div className="ov-value" style={{ color: "var(--accent-success)" }}>
              $1.4M
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              <ArrowUpRight size={12} /> 8.7% vs last month
            </div>
          </div>

          <div className="overview-stat animate-in delay-4">
            <div
              style={{
                background: "rgba(217, 119, 6, 0.1)",
                color: "var(--accent-warning)",
              }}
              className="stat-icon"
            >
              <Sparkles size={20} />
            </div>
            <div className="ov-label">AI Growth Index</div>
            <div className="ov-value" style={{ color: "var(--accent-warning)" }}>
              +14.3%
            </div>
            <div className="ov-change" style={{ color: "var(--text-secondary)" }}>
              Predicted next 90 days
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="charts-row">
        {/* Line Chart */}
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="var(--neon-blue)" />
            Revenue Trend
          </div>

          <svg viewBox="0 0 400 200" style={{ width: "100%", height: "200px" }}>
            <line x1="0" y1="40" x2="400" y2="40" stroke="#e3e8ef" strokeWidth="1" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="#e3e8ef" strokeWidth="1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#e3e8ef" strokeWidth="1" />

            <polyline
              points="20,140 80,110 160,90 240,80 320,95 380,70"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <circle cx="80" cy="110" r="4" fill="var(--neon-blue)" />
            <circle cx="160" cy="90" r="4" fill="var(--neon-blue)" />
            <circle cx="240" cy="80" r="4" fill="var(--neon-blue)" />
            <circle cx="320" cy="95" r="4" fill="var(--neon-blue)" />
            <circle cx="380" cy="70" r="4" fill="var(--neon-blue)" />

            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--neon-blue)" />
                <stop offset="1" stopColor="var(--neon-purple)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            Occupancy Rate
          </div>

          <svg viewBox="0 0 200 200" style={{ width: "100%", height: "200px" }}>
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="var(--accent-success)"
              strokeWidth="32"
              strokeLinecap="round"
              strokeDasharray="236 377"
            />
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#e3e8ef"
              strokeWidth="32"
              strokeDasharray="141 472"
            />
            <text
              x="100"
              y="108"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="28"
              fontWeight="700"
            >
              89%
            </text>
          </svg>

          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "var(--accent-success)",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "6px",
                }}
              ></span>
              Occupied
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "var(--border-glow)",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "6px",
                }}
              ></span>
              Vacant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
