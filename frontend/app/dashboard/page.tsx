"use client";
import React from "react";

export default function DashboardPage() {
  return (
    <div className="dashboard-content">
      <div className="page-tag">📊 ANALYTICS DASHBOARD</div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-row">
          <div
            className="overview-stat animate-in delay-1"
            style={{ ["--top-color" as any]: "var(--neon-blue)" }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--neon-blue)",
                boxShadow: "0 0 10px var(--neon-blue)",
              }}
            />
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(0,240,255,0.1)" }}
            >
              🏢
            </div>
            <div className="ov-label">Total Properties</div>
            <div className="ov-value" style={{ color: "var(--neon-blue)" }}>
              2,847
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              ↑ 12.4% this month
            </div>
          </div>

          <div className="overview-stat animate-in delay-2">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--neon-purple)",
                boxShadow: "0 0 10px var(--neon-purple)",
              }}
            />
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(124,58,237,0.1)" }}
            >
              📊
            </div>
            <div className="ov-label">Occupancy Rate</div>
            <div className="ov-value" style={{ color: "var(--neon-purple)" }}>
              89.2%
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              ↑ 3.1% vs last quarter
            </div>
          </div>

          <div className="overview-stat animate-in delay-3">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--accent-success)",
                boxShadow: "0 0 10px var(--accent-success)",
              }}
            />
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(0,255,163,0.1)" }}
            >
              💰
            </div>
            <div className="ov-label">Total Revenue</div>
            <div className="ov-value" style={{ color: "var(--accent-success)" }}>
              $1.4M
            </div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>
              ↑ 8.7% vs last month
            </div>
          </div>

          <div className="overview-stat animate-in delay-4">
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--accent-danger)",
                boxShadow: "0 0 10px var(--accent-danger)",
              }}
            />
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(255,59,129,0.1)" }}
            >
              🤖
            </div>
            <div className="ov-label">AI Growth Index</div>
            <div className="ov-value" style={{ color: "var(--accent-danger)" }}>
              +14.3%
            </div>
            <div className="ov-change" style={{ color: "var(--text-secondary)" }}>
              Predicted next 90 days
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          margin: "30px 0",
        }}
      >
        {/* Line Chart */}
        <div
          style={{
            backgroundColor: "rgba(17,24,39,0.8)",
            border: "1px solid var(--border-glow)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "20px",
              color: "var(--neon-blue)",
            }}
          >
            Revenue Trend
          </div>

          <svg viewBox="0 0 400 200" style={{ width: "100%", height: "180px" }}>
            <line x1="0" y1="40" x2="400" y2="40" stroke="#1F2937" strokeWidth="1" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="#1F2937" strokeWidth="1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#1F2937" strokeWidth="1" />

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
        <div
          style={{
            backgroundColor: "rgba(17,24,39,0.8)",
            border: "1px solid var(--border-glow)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "20px",
              color: "var(--accent-success)",
            }}
          >
            Occupancy Pie
          </div>

          <svg viewBox="0 0 200 200" style={{ width: "100%", height: "180px" }}>
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#00FFA3"
              strokeWidth="40"
              strokeLinecap="round"
              strokeDasharray="236 377"
            />
            <circle
              cx="100"
              cy="100"
              r="75"
              fill="none"
              stroke="#374151"
              strokeWidth="40"
              strokeDasharray="141 472"
            />
            <text
              x="100"
              y="108"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="28"
              fontWeight="600"
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
            }}
          >
            <div>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#00FFA3",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "6px",
                }}
              ></span>
              Occupied
            </div>

            <div>
              <span
                style={{
                  width: "12px",
                  height: "12px",
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