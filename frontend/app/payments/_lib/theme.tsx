import React, { JSX } from "react";

type AlertKind = "info" | "success" | "error" | "warning";

type LightAlertProps = {
  kind?: AlertKind;
  children: React.ReactNode;
};

export const theme = {
  pageBg:       "#f6f7fb",
  cardBg:       "#ffffff",
  subtleBg:     "#f8f9ff",
  rowHoverBg:   "#f3f5f7",
  selectedBg:   "rgba(99,102,241,0.06)",

  border:       "#e2e8f0",
  borderStrong: "#cbd5e1",
  borderSoft:   "#eef2f7",

  // Text
  text:         "#0f172a",
  textMuted:    "#64748b",
  textSubtle:   "#94a3b8",
  textInverse:  "#ffffff",

  // Accent
  accent:       "#6366f1",
  accentSoft:   "rgba(99,102,241,0.08)",
  accentBorder: "rgba(99,102,241,0.2)",
  accentText:   "#4f46e5",

  // Status
  paid:      "#00ff87",
  pending:   "#fbbf24",
  overdue:   "#ef4444",
  partial:   "#60a5fa",
  scheduled: "#a78bfa",

  // Shadows
  shadowSm: "0 1px 2px rgba(15, 23, 42, 0.04)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.06)",
} as const;

export const pageStyle: React.CSSProperties = {
  background: theme.pageBg,
  color: theme.text,
  fontFamily: "Inter, sans-serif",
  padding: "0 4px",
};

export const panel: React.CSSProperties = {
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
  padding: 16,
  boxShadow: theme.shadowSm,
};

export const panelLg: React.CSSProperties = {
  ...panel,
  borderRadius: 16,
  padding: 20,
};

export const metricCard: React.CSSProperties = {
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  borderRadius: 12,
  padding: 14,
  minWidth: 0,
  boxShadow: theme.shadowSm,
};

export const labelSm: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: theme.textMuted,
  fontWeight: 600,
};

export const titleMd: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: theme.text,
};

export const sub: React.CSSProperties = {
  fontSize: 12,
  color: theme.textMuted,
};

export const sectionTag: React.CSSProperties = {
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
};

export const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  padding: "9px 12px",
  color: theme.text,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export const inputLabel: React.CSSProperties = {
  fontSize: 10,
  color: theme.textMuted,
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  fontWeight: 600,
};

export const tableHeaderCell: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 10,
  fontWeight: 700,
  color: theme.textMuted,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  whiteSpace: "nowrap",
};

export const tableCell: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 13,
  color: theme.text,
};

export const tableCellMuted: React.CSSProperties = {
  ...tableCell,
  color: theme.textMuted,
  fontSize: 12,
};

export const divider: React.CSSProperties = {
  borderBottom: `1px solid ${theme.borderSoft}`,
};

export const dividerStrong: React.CSSProperties = {
  borderBottom: `1px solid ${theme.border}`,
};

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={sectionTag}>{title}</div>
        {subtitle ? (
          <div style={{ ...sub, marginTop: 2, maxWidth: 600 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ display: "flex", gap: 8 }}>{right}</div> : null}
    </div>
  );
}

// ─── Status Pill (light-theme) ────────────────────────────────────────────────

export function StatusPill({ status }: { status: string }) {
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

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function LightSpinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 80,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: "2px solid rgba(99,102,241,0.2)",
          borderTopColor: theme.accent,
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────

export function LightButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  style,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "success" | "warning";
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const v: Record<string, React.CSSProperties> = {
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
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v[variant],
        borderRadius: 10,
        padding: "9px 16px",
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

// ─── Alert / Banner ──────────────────────────────────────────────────────────

export function LightAlert({
  kind = "info",
  children,
}: LightAlertProps): JSX.Element {
  const map: Record<
    AlertKind,
    { bg: string; border: string; color: string }
  > = {
    info: {
      bg: "rgba(96,165,250,0.08)",
      border: "rgba(96,165,250,0.25)",
      color: "#1d4ed8",
    },
    success: {
      bg: "rgba(0,200,135,0.08)",
      border: "rgba(0,200,135,0.30)",
      color: "#059669",
    },
    error: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.30)",
      color: "#b91c1c",
    },
    warning: {
      bg: "rgba(251,191,36,0.10)",
      border: "rgba(251,191,36,0.35)",
      color: "#b45309",
    },
  };

  const s = map[kind];

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

// ─── Skeleton loaders ────────────────────────────────────────────────────────

export function SkeletonBar({
  width = "100%",
  height = 12,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: 6,
        background:
          "linear-gradient(90deg,#eef2f7 25%,#e2e8f0 50%,#eef2f7 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: 14 }}>
          <SkeletonBar
            width={i === 1 ? "80%" : i === cols - 1 ? "50%" : "60%"}
          />
        </td>
      ))}
    </tr>
  );
}
