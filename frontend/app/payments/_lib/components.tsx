"use client";

import React from "react";
import { STATUS_STYLE } from "./data";
import type { PayMethod } from "./types";

// ─── Atoms ──────────────────────────────────────────────────────────────────────

export function LiveDot() {
  return (
    <span
      style={{
        display: "inline-block", width: 7, height: 7, borderRadius: "50%",
        background: "#00ff87", marginRight: 6, boxShadow: "0 0 6px #00ff87",
        animation: "pulse 1.5s infinite",
      }}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span
      style={{
        display: "inline-block", padding: "3px 10px", borderRadius: 20,
        fontSize: 10, fontWeight: 700, letterSpacing: ".05em",
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function GlassPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10,
        fontWeight: 700, letterSpacing: ".12em", color: "#a78bfa",
        textTransform: "uppercase", background: "rgba(167,139,250,0.1)",
        border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6,
        padding: "4px 10px", marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

type NeonVariant = "primary" | "ghost" | "danger" | "success" | "warning";

export function NeonButton({
  children, onClick, variant = "ghost", style, disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: NeonVariant;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const v: Record<NeonVariant, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",             border: "none" },
    ghost:   { background: "rgba(255,255,255,0.05)",                   color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" },
    danger:  { background: "rgba(239,68,68,0.1)",                      color: "#ef4444",           border: "1px solid rgba(239,68,68,0.3)" },
    success: { background: "rgba(0,255,135,0.1)",                      color: "#00ff87",           border: "1px solid rgba(0,255,135,0.3)" },
    warning: { background: "rgba(251,191,36,0.1)",                     color: "#fbbf24",           border: "1px solid rgba(251,191,36,0.3)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v[variant], borderRadius: 10, padding: "8px 16px", fontSize: 12,
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all .15s", whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Sparkline({
  data, color, width = 80, height = 28,
}: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const last = pts.split(" ").pop()!.split(",");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={2.5} fill={color} />
    </svg>
  );
}

export function MetricCard({
  label, value, sub, accent, sparkData, sparkColor,
}: {
  label: string; value: string; sub?: string;
  accent?: string; sparkData?: number[]; sparkColor?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "18px 20px", flex: 1, minWidth: 140,
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent || "linear-gradient(to right,#6366f1,#8b5cf6)" }} />
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{sub}</div>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || "#6366f1"} />}
      </div>
    </div>
  );
}

export function CollectionGauge({ pct }: { pct: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct >= 90 ? "#00ff87" : pct >= 70 ? "#fbbf24" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .6s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x={50} y={46} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700}>{pct}%</text>
        <text x={50} y={60} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>collected</text>
      </svg>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: ".06em", textTransform: "uppercase" }}>
        Apr Target: 95%
      </div>
    </div>
  );
}

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 16, height: 16, border: `1px solid ${checked ? "#6366f1" : "rgba(255,255,255,0.2)"}`,
        borderRadius: 4, background: checked ? "rgba(99,102,241,0.3)" : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all .15s",
      }}
    >
      {checked && <span style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700 }}>✓</span>}
    </div>
  );
}