"use client";

// ─── PageLoader ────────────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: i === 1 ? 80 : 160,
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", animation: "shimmer 1.6s infinite" }} />
        </div>
      ))}
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>⚠ Failed to load</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
}

const TOAST_COLORS = {
  success: { bg: "rgba(0,255,135,0.1)",  border: "rgba(0,255,135,0.3)",  color: "#00ff87" },
  error:   { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444" },
  info:    { bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.3)", color: "#60a5fa" },
};
const TOAST_ICON = { success: "✓", error: "✕", info: "ℹ" };

export function Toast({ message, type = "info", onDismiss }: ToastProps) {
  const c = TOAST_COLORS[type];
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 9999,
        padding: "12px 18px", borderRadius: 12,
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp .25s ease",
      }}
    >
      <span style={{ fontWeight: 700, color: c.color, fontSize: 14 }}>{TOAST_ICON[type]}</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", marginLeft: 4, padding: 0 }}>×</button>
      <style>{`@keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
    </div>
  );
}

// ─── useToast ─────────────────────────────────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const show = (message: string, type: ToastType = "info") =>
    setToast({ message, type });

  const dismiss = () => setToast(null);

  const ToastEl = toast ? <Toast message={toast.message} type={toast.type} onDismiss={dismiss} /> : null;

  return { show, ToastEl };
}