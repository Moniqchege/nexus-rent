"use client";

import React from "react";

export type StatsCardVariant = "blue" | "green" | "red" | "purple";

const variantStyles: Record<StatsCardVariant, { border: string; glow: string; label: string; value: string }> = {
  blue: {
    border: "rgba(56,189,248,0.45)",
    glow: "rgba(56,189,248,0.25)",
    label: "rgba(255,255,255,0.7)",
    value: "#38bdf8",
  },
  green: {
    border: "rgba(34,197,94,0.45)",
    glow: "rgba(34,197,94,0.25)",
    label: "rgba(255,255,255,0.7)",
    value: "#22c55e",
  },
  red: {
    border: "rgba(248,113,113,0.45)",
    glow: "rgba(248,113,113,0.25)",
    label: "rgba(255,255,255,0.7)",
    value: "#f87171",
  },
  purple: {
    border: "rgba(167,139,250,0.50)",
    glow: "rgba(167,139,250,0.26)",
    label: "rgba(255,255,255,0.7)",
    value: "#a78bfa",
  },
};

type StatsCardProps = {
  label: string;
  value: number;
  variant: StatsCardVariant;
  onClick?: () => void;
};

export default function StatsCard({ label, value, variant, onClick }: StatsCardProps) {
  const s = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: "18px 16px",
        background:
          "linear-gradient(135deg, rgba(17,24,39,0.8), rgba(17,24,39,0.55))",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 0 30px ${s.glow}`,
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 6,
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 13, color: s.label, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: s.value, letterSpacing: "0.2px" }}>{value}</div>
    </div>
  );
}

