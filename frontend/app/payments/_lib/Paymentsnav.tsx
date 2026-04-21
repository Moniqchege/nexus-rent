"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "overview",   label: "Overview",   icon: "💠", href: "/payments/overview" },
  { key: "initiate",   label: "Pay",        icon: "🧊", href: "/payments/initiate" },
  { key: "schedules",  label: "Schedules",  icon: "🛰️", href: "/payments/schedules" },
  { key: "tenant",     label: "Tenant",     icon: "👤", href: "/payments/tenant" },
  { key: "automation", label: "Automation", icon: "⚡", href: "/payments/automation" },
  { key: "reports",    label: "Reports",    icon: "📡", href: "/payments/reports" },
];

export default function Paymentsnav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex", gap: 4, marginBottom: 24,
        borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto",
      }}
    >
      {TABS.map((t) => {
        const isActive = pathname === t.href || (pathname === "/payments" && t.key === "overview");
        return (
          <Link
            key={t.key}
            href={t.href}
            style={{
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid #00F0FF" : "2px solid transparent",
              borderRadius: "8px 8px 0 0",
              padding: "8px 24px",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#a78bfa" : "rgba(255,255,255,0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              transition: "all .15s",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}