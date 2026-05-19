"use client";

import React, { useMemo, useState } from "react";

import ConfirmDialog from "../ui/ConfirmDialog";






export type TabKey = string;


type ViewDetailsTab = {
  key: TabKey;
  label: string;
  content: React.ReactNode;
};

type HeaderConfig = {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  onBackClick?: () => void;
};

type BadgeTone = "active" | "locked" | "neutral";

type IdentityConfig = {
  avatarText: string;
  displayTitle: string;
  badgeText?: string;
  badgeTone?: BadgeTone;
};

type DataRow = {
  label: string;
  value: React.ReactNode;
};

type DataBox = {
  rows: DataRow[];
};

type ActionButton = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

type ConfirmConfig = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

// Shared UI constants (keeps current styling consistent)
const C = {
  blue: "#2A5CAA",
  cyan: "#00F0FF",
  bgPage: "#0D1117",
  bgCard: "#111827",
  bgCardAlt: "rgba(0,165,228,0.06)",
  border: "#1E3A5F",
  borderCyan: "rgba(0,165,228,0.35)",
  textPrimary: "#E2E8F0",
  textMuted: "#94A3B8",
  textLabel: "#64748B",
  white: "#FFFFFF",
} as const;

const s = {
  page: {
    minHeight: "100vh",
    paddingLeft: "0px",
    paddingTop: "20px",
    backgroundColor: C.bgPage,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "padding-left 0.3s",
  } as React.CSSProperties,

  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px 40px",
  } as React.CSSProperties,

  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  } as React.CSSProperties,

  heading: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: C.cyan,
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  subheading: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: C.textMuted,
  } as React.CSSProperties,

  backBtn: {
    background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "12px 24px",
    fontSize: "14px",
  } as React.CSSProperties,

  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "16px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  avatarWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: C.blue,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "18px",
    color: C.white,
    fontWeight: 700,
  } as React.CSSProperties,

  nameBlock: {
    display: "flex",
    flexDirection: "column" as const,
    marginLeft: "8px",
    minWidth: 0,
  },

  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: C.cyan,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  } as React.CSSProperties,

  statusBadge: (tone: BadgeTone): React.CSSProperties => ({
    marginTop: "4px",
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: "999px",
    textAlign: "center",
    color:
      tone === "active" ? "#000" : tone === "locked" ? "#000" : C.cyan,
    backgroundColor:
      tone === "active" ? "transparent" : tone === "locked" ? "#00F0FF" : "transparent",
    border: `1px solid #00F0FF`,
  }),

  columnsWrap: {
    display: "flex",
    flex: 1,
    gap: "12px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  dataBox: {
    flex: 1,
    minWidth: "200px",
    border: `1px solid ${C.borderCyan}`,
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: C.bgCardAlt,
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  } as React.CSSProperties,

  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  dataLabel: {
    fontSize: "11px",
    fontWeight: 400,
    color: C.textLabel,
    minWidth: "90px",
  } as React.CSSProperties,

  dataValue: {
    fontSize: "11px",
    fontWeight: 600,
    color: C.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: "200px",
    textAlign: "right" as const,
  } as React.CSSProperties,

  actionsWrap: {
    marginLeft: "auto",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  actionBtn: {
    background: "rgba(0, 240, 255, 0.05)",
    color: "var(--neon-blue)",
    border: "1px solid rgba(0, 240, 255, 0.25)",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "12px",
    fontFamily: `'Orbitron', monospace`,
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  } as React.CSSProperties,

  emptyCard: {
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "60px",
    textAlign: "center" as const,
  } as React.CSSProperties,

  summaryShell: {
    marginTop: 12,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: C.bgCard,
  } as React.CSSProperties,

  summaryHeader: {
    padding: "14px 16px",
    borderBottom: `1px solid ${C.border}`,
  } as React.CSSProperties,

  summaryTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: C.blue,
  } as React.CSSProperties,

  tabRow: {
    paddingTop: 10,
    paddingLeft: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,
};

export default function ViewDetailsLayout({
  header,
  identity,
  dataBoxes,
  actions,
  tabs,
  tabsTitle,
  initialTabKey,
  confirm,
  emptyFallback,
}: {
  header: HeaderConfig;
  identity: IdentityConfig;
  dataBoxes: DataBox[];
  actions: ActionButton[];
  tabs: ViewDetailsTab[];
  tabsTitle: string;
  initialTabKey: TabKey;
  confirm?: ConfirmConfig | null;
  emptyFallback?: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>(initialTabKey);

  const activeTab = useMemo(() => tabs.find((t) => t.key === tab), [tab, tabs]);

  return (
    <section style={s.page}>
      <div style={s.inner}>
        <div style={s.topBar}>
          <div>
            <h4 style={s.heading}>{header.title}</h4>
            {header.subtitle ? <p style={s.subheading}>{header.subtitle}</p> : null}
          </div>

          <button
            type="button"
            style={s.backBtn}
            onClick={() => {
              if (header.onBackClick) header.onBackClick();
              else window.location.href = header.backHref;
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e4d99")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.blue)}
          >
            {header.backLabel ?? "← Back"}
          </button>
        </div>

        {emptyFallback ?? null}

        <div style={s.infoCard}>
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={s.avatarWrap}>{identity.avatarText}</div>
            <div style={s.nameBlock}>
              <h4 style={s.userName}>{identity.displayTitle}</h4>
              {identity.badgeText ? (
                <span style={s.statusBadge(identity.badgeTone ?? "neutral")}>{identity.badgeText}</span>
              ) : null}
            </div>
          </div>

          <div style={s.columnsWrap}>
            {dataBoxes.map((box, idx) => (
              <div key={idx} style={s.dataBox}>
                {box.rows.map((r) => (
                  <div key={r.label} style={s.dataRow}>
                    <span style={s.dataLabel}>{r.label}</span>
                    <span style={s.dataValue}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={s.actionsWrap}>
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                style={s.actionBtn}
                onClick={a.onClick}
                disabled={a.disabled}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 165, 228, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 240, 255, 0.05)";
                }}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.summaryShell}>
          <div style={s.summaryHeader}>
            <h4 style={s.summaryTitle}>{tabsTitle}</h4>
          </div>

          <div style={s.tabRow}>
            {tabs.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: `1px solid ${active ? "rgba(0,165,228,0.55)" : C.border}`,
                    background: active ? "rgba(0,165,228,0.12)" : "rgba(0,0,0,0.15)",
                    color: active ? C.cyan : C.textMuted,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: 16 }}>{activeTab?.content}</div>
        </div>

        {confirm?.open ? (
          // Imported lazily to avoid coupling this layout to a specific UI folder structure.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          React.createElement(require("../ui/ConfirmDialog").default, {
            open: confirm.open,
            title: confirm.title,
            message: confirm.message,
            onConfirm: confirm.onConfirm,
            onCancel: confirm.onCancel,
            confirmText: confirm.confirmText,
          })
        ) : null}
      </div>
    </section>
  );
}

