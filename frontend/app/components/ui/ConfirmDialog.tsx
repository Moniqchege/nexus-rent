"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string | ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="dialog-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        className="dialog-card"
        style={{
          background: "#ffffff",
          padding: 24,
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          color: "var(--text-primary)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)",
          border: "1px solid var(--border-glow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(220, 38, 38, 0.1)",
              color: "var(--accent-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h2>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onCancel}
            className="btn-ghost"
            style={{ padding: "9px 18px" }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: "var(--accent-danger)",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-danger)")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
