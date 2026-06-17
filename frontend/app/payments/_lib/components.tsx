"use client";

import React, { HTMLAttributes } from "react";
import { theme } from "./theme";
import type { PayMethod } from "./types";

// ─── Live Status Dot ──────────────────────────────────────────────────────────

export function LiveDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: theme.paid,
        marginRight: 6,
        boxShadow: `0 0 6px ${theme.paid}`,
        animation: "pulse 1.5s infinite",
      }}
    />
  );
}

// ─── Status Badge (light-theme) ───────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    paid:      { bg: "rgba(0,200,135,0.10)", color: "#059669", border: "rgba(0,200,135,0.30)" },
    pending:   { bg: "rgba(251,191,36,0.10)", color: "#b45309", border: "rgba(251,191,36,0.30)" },
    overdue:   { bg: "rgba(239,68,68,0.10)",  color: "#b91c1c", border: "rgba(239,68,68,0.30)" },
    partial:   { bg: "rgba(96,165,250,0.10)", color: "#1d4ed8", border: "rgba(96,165,250,0.30)" },
    scheduled: { bg: "rgba(167,139,250,0.10)",color: "#6d28d9", border: "rgba(167,139,250,0.30)" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".05em",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

// ─── Glass Panel → Light Card ─────────────────────────────────────────────────

type LightPanelProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  noPadding?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function GlassPanel({
  children,
  style,
  noPadding,
  ...rest
}: LightPanelProps) {
  return (
    <div
      {...rest}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: noPadding ? 0 : 20,
        boxShadow: theme.shadowSm,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Tag (light-theme) ────────────────────────────────────────────────

export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".12em",
        color: theme.accentText,
        textTransform: "uppercase",
        background: theme.accentSoft,
        border: `1px solid ${theme.accentBorder}`,
        borderRadius: 6,
        padding: "4px 10px",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ─── Neon Button → Light Button ───────────────────────────────────────────────

type LightVariant = "primary" | "ghost" | "danger" | "success" | "warning";

export function NeonButton({
  children,
  onClick,
  variant = "ghost",
  style,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: LightVariant;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const v: Record<LightVariant, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      border: "none",
      boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
    },
    ghost: {
      background: "#ffffff",
      color: theme.textMuted,
      border: `1px solid ${theme.border}`,
    },
    danger: {
      background: "rgba(239,68,68,0.08)",
      color: "#b91c1c",
      border: "1px solid rgba(239,68,68,0.25)",
    },
    success: {
      background: "rgba(0,200,135,0.08)",
      color: "#059669",
      border: "1px solid rgba(0,200,135,0.25)",
    },
    warning: {
      background: "rgba(251,191,36,0.10)",
      color: "#b45309",
      border: "1px solid rgba(251,191,36,0.30)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v[variant],
        borderRadius: 10,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all .15s",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Sparkline (light-theme) ──────────────────────────────────────────────────

export function Sparkline({
  data,
  color,
  width = 80,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
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
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
  cx={Number.isFinite(parseFloat(last?.[0])) ? parseFloat(last[0]) : 0}
  cy={Number.isFinite(parseFloat(last?.[1])) ? parseFloat(last[1]) : 0}
  r={2.5}
/>
    </svg>
  );
}

// ─── Metric Card (light-theme) ────────────────────────────────────────────────

export function MetricCard({
  label,
  value,
  sub,
  accent,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: "12px 16px",
        flex: 1,
        minWidth: 140,
        position: "relative",
        overflow: "hidden",
        boxShadow: theme.shadowSm,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent || `linear-gradient(to right,${theme.accent},#8b5cf6)`,
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: theme.textMuted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>
            {value}
          </div>
          {sub ? (
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                marginTop: 4,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
        {sparkData ? (
          <Sparkline data={sparkData} color={sparkColor || theme.accent} />
        ) : null}
      </div>
    </div>
  );
}

// ─── Collection Gauge (light-theme) ───────────────────────────────────────────

export function CollectionGauge({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct >= 90 ? "#059669" : pct >= 70 ? "#b45309" : "#b91c1c";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={theme.border}
          strokeWidth={8}
        />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray .6s ease",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        <text
          x={50}
          y={46}
          textAnchor="middle"
          fill={theme.text}
          fontSize={14}
          fontWeight={700}
        >
          {pct}%
        </text>
        <text
          x={50}
          y={60}
          textAnchor="middle"
          fill={theme.textMuted}
          fontSize={8}
        >
          collected
        </text>
      </svg>
      <div
        style={{
          fontSize: 10,
          color: theme.textMuted,
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}
      >
        Target: 95%
      </div>
    </div>
  );
}

// ─── Checkbox (light-theme) ───────────────────────────────────────────────────

export function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 16,
        height: 16,
        border: `1px solid ${checked ? theme.accent : theme.borderStrong}`,
        borderRadius: 4,
        background: checked ? theme.accentSoft : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all .15s",
      }}
    >
      {checked ? (
        <span style={{ color: theme.accentText, fontSize: 10, fontWeight: 700 }}>
          ✓
        </span>
      ) : null}
    </div>
  );
}
