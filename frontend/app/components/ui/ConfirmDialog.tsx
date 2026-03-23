"use client";

import { useState, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

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
  cancelText = "Cancel"
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
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
      onClick={onCancel}
    >
      <div
        className="dialog-card"
        style={{
          background: "#111827",
          padding: "24px",
          borderRadius: "16px",
          minWidth: "300px",
          maxWidth: "500px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>{title}</h2>
        <p style={{ fontSize: "14px", color: "#ccc" }}>{message}</p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "10px 20px",
              color: "#ccc",
              cursor: "pointer"
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              border: "none",
              borderRadius: "12px",
              padding: "10px 20px",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}