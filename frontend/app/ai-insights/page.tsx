"use client";
import React from "react";

export default function AIInsightsPage() {
  return (
    <div className="dashboard-content">
      <div className="page-tag">⚙ ADMIN — AI PRICE ENGINE</div>
      <div className="section-label">COMMAND CENTER</div>
      <div className="section-title">AI Rent Pricing Intelligence</div>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "15px",
          maxWidth: "600px",
          lineHeight: 1.7,
        }}
      >
        Real-time market analysis powered by infrastructure growth indices,
        commercial density scoring, and predictive neural rent forecasting.
      </p>

      <div className="ai-engine-section">
        <div className="ai-engine-grid">

          {/* LEFT: MAP */}
         <div className="glass-panel">
  <h3>Development Heatmap</h3>

  <div className="map-mockup">
    <div className="map-grid" />

    {/* Roads */}
    <div className="map-road" style={{ top: '40%', left: 0, right: 0, height: '3px' }} />
    <div className="map-road" style={{ top: 0, bottom: 0, left: '35%', width: '3px' }} />
    <div className="map-road" style={{ top: '65%', left: 0, right: 0, height: '2px', opacity: 0.6 }} />
    <div className="map-road" style={{ top: 0, bottom: 0, left: '70%', width: '2px', opacity: 0.6 }} />

    {/* Heat zones */}
    <div className="heat-zone" style={{ top: '20%', left: '20%', width: '120px', height: '80px', background: 'rgba(0,240,255,0.12)' }} />
    <div className="heat-zone" style={{ top: '45%', left: '55%', width: '100px', height: '70px', background: 'rgba(124,58,237,0.15)' }} />
    <div className="heat-zone" style={{ top: '60%', left: '15%', width: '80px', height: '60px', background: 'rgba(0,255,163,0.1)' }} />

    {/* Pins */}
    <div className="map-pin" style={{ top: '25%', left: '28%', background: 'var(--neon-blue)', borderColor: 'var(--neon-blue)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(0,240,255,0.4)', animation: 'ping 2s infinite' }} />
    </div>
    <div className="map-pin" style={{ top: '50%', left: '62%', background: 'var(--neon-purple)', borderColor: 'var(--neon-purple)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(124,58,237,0.4)', animation: 'ping 2s infinite 0.5s' }} />
    </div>
    <div className="map-pin" style={{ top: '70%', left: '22%', background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(0,255,163,0.4)', animation: 'ping 2s infinite 1s' }} />
    </div>
    <div className="map-pin" style={{ top: '30%', left: '75%', background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,59,129,0.4)', animation: 'ping 2s infinite 0.8s' }} />
    </div>

    {/* Area Labels */}
    <div style={{ position: 'absolute', top: '12%', left: '14%', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--neon-blue)', opacity: 0.8, letterSpacing: '1px' }}>
      WESTLANDS
    </div>
    <div style={{ position: 'absolute', top: '55%', left: '55%', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--neon-purple)', opacity: 0.8, letterSpacing: '1px' }}>
      KILIMANI
    </div>
    <div style={{ position: 'absolute', top: '75%', left: '12%', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-success)', opacity: 0.8, letterSpacing: '1px' }}>
      KAREN
    </div>
    <div style={{ position: 'absolute', top: '18%', left: '68%', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-danger)', opacity: 0.8, letterSpacing: '1px' }}>
      UPPER HILL
    </div>

    {/* Map Overlay Badge */}
    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '10px', padding: '6px 12px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--neon-blue)' }}>
      AI AREA SCORE: 87.4
    </div>
  </div>

  {/* Toggle Buttons */}
  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
    <button className="toggle-btn active" style={{ fontSize: '11px', padding: '6px 12px' }}>Infrastructure</button>
    <button className="toggle-btn" style={{ fontSize: '11px', padding: '6px 12px' }}>Road Upgrades</button>
    <button className="toggle-btn" style={{ fontSize: '11px', padding: '6px 12px' }}>Commercial</button>
  </div>
</div>

          {/* CENTER: CHART */}
<div className="glass-panel">
  <h3>Rent Prediction Graph</h3>

  <div className="chart-container">
    <svg className="chart-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
        </linearGradient>

        <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
        </linearGradient>

        <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFA3" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#00FFA3" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="0" y1="40" x2="400" y2="40" stroke="#1F2937" strokeWidth="1" />
      <line x1="0" y1="80" x2="400" y2="80" stroke="#1F2937" strokeWidth="1" />
      <line x1="0" y1="120" x2="400" y2="120" stroke="#1F2937" strokeWidth="1" />
      <line x1="0" y1="160" x2="400" y2="160" stroke="#1F2937" strokeWidth="1" />

      {/* Area */}
      <path d="M0,140 L60,130 L120,125 L180,110 L240,105 L300,100 L360,95 L400,90 L400,200 L0,200Z" fill="url(#blueGrad)" />

      {/* Current line */}
      <path d="M0,140 L60,130 L120,125 L180,110 L240,105 L300,100 L360,95 L400,90" fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Forecast */}
      <path d="M300,100 L360,85 L400,72" fill="none" stroke="#7C3AED" strokeWidth="2" strokeDasharray="6,4" />
      <path d="M300,100 L360,75 L400,55" fill="none" stroke="#00FFA3" strokeWidth="2" strokeDasharray="4,6" opacity="0.7" />

      {/* NOW line */}
      <line x1="300" y1="0" x2="300" y2="200" stroke="#1F2937" strokeWidth="1" strokeDasharray="4,4" />
      <text x="302" y="14" fill="#9CA3AF" fontSize="8">NOW</text>

      {/* Points */}
      <circle cx="300" cy="100" r="4" fill="#00F0FF" />
      <circle cx="180" cy="110" r="3" fill="#00F0FF" />
      <circle cx="60" cy="130" r="3" fill="#00F0FF" />
    </svg>
  </div>

  {/* ✅ FIXED LEGEND */}
  <div className="chart-legend">
    <div className="legend-item">
      <div
        className="legend-dot"
        style={{
          background: "var(--neon-blue)",
          boxShadow: "0 0 6px var(--neon-blue)",
        }}
      />
      Current Rent
    </div>

    <div className="legend-item">
      <div
        className="legend-dot"
        style={{ background: "var(--neon-purple)" }}
      />
      3-Month Forecast
    </div>

    <div className="legend-item">
      <div
        className="legend-dot"
        style={{ background: "var(--accent-success)" }}
      />
      6-Month Forecast
    </div>
  </div>
</div>

          {/* RIGHT: DECISION PANEL */}
          <div className="glass-panel">
  <h3>Decision Panel</h3>

  <div className="decision-panel">

    {/* Suggested Rent */}
    <div className="stat-card">
      <div className="stat-label">Suggested New Rent</div>
      <div className="stat-value" style={{ color: 'var(--neon-blue)' }}>
        $2,880
      </div>
      <div className="stat-sub">
        <span style={{ color: 'var(--accent-success)' }}>↑ 20%</span> from current $2,400
      </div>
    </div>

    {/* Risk Level */}
    <div className="stat-card">
      <div className="stat-label">Risk Level</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}
      >
        <div className="stat-value" style={{ fontSize: '20px', color: '#FFB84D' }}>
          MODERATE
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '20px', color: '#FFB84D' }}>
          42/100
        </div>
      </div>
      <div className="risk-bar">
        <div
          className="risk-fill"
          style={{ width: '42%', background: 'linear-gradient(90deg,var(--accent-success),#FFB84D)' }}
        />
      </div>
    </div>

    {/* Projected Revenue */}
    <div className="stat-card">
      <div className="stat-label">Projected Revenue Change</div>
      <div className="stat-value" style={{ color: 'var(--accent-success)', fontSize: '22px' }}>
        +$143K/yr
      </div>
      <div className="stat-sub" style={{ color: 'var(--text-secondary)' }}>
        Across 52 matched properties
      </div>
    </div>

    {/* Tenant Churn */}
    <div className="stat-card">
      <div className="stat-label">Tenant Churn Prediction</div>
      <div className="stat-value" style={{ color: 'var(--accent-danger)', fontSize: '20px' }}>
        18.4%
      </div>
      <div className="stat-sub">
        <span style={{ color: 'var(--accent-danger)' }}>↑ 6.2%</span> churn risk increase
      </div>
      <div className="risk-bar" style={{ marginTop: '8px' }}>
        <div className="risk-fill" style={{ width: '18.4%', background: 'var(--accent-danger)' }} />
      </div>
    </div>

    {/* Action Buttons */}
    <div className="action-btns">
      <button className="btn-sm btn-sim">⊙ Simulate</button>
      <button className="btn-sm btn-approve">✓ Approve</button>
      <button className="btn-sm btn-schedule">⊛ Schedule</button>
      <button className="btn-sm btn-notify">✉ Notify</button>
    </div>
  </div>
</div>
        </div>
      </div>
      </div>
  );
}