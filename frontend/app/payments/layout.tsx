"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      name: "Overview",
      href: "/payments/overview",
      icon: "dashboard",
      description: "Summary & balances",
    },
    // {
    //   name: "Pay",
    //   href: "/payments/initiate",
    //   icon: "send_money",
    //   description: "Send & transfer funds",
    // },
    {
      name: "Schedules",
      href: "/payments/schedules",
      icon: "event_repeat",
      description: "Upcoming & recurring",
    },
    {
      name: "Tenant",
      href: "/payments/tenant",
      icon: "person",
      description: "Tenant payment records",
    },
    {
      name: "Automation",
      href: "/payments/automation",
      icon: "bolt",
      description: "Rules & auto-payments",
    },
    {
      name: "Expenses",
      href: "/payments/expenses",
      icon: "trending_down",
      description: "Costs & expenditures",
    },
    {
      name: "Reports",
      href: "/payments/reports",
      icon: "bar_chart",
      description: "Analytics & exports",
    },
  ];

  const getActiveTab = () => {
    if (pathname.startsWith("/payments/initiate")) return "/payments/initiate";
    if (pathname.startsWith("/payments/schedules")) return "/payments/schedules";
    if (pathname.startsWith("/payments/tenant")) return "/payments/tenant";
    if (pathname.startsWith("/payments/automation")) return "/payments/automation";
    if (pathname.startsWith("/payments/expenses")) return "/payments/expenses";
    if (pathname.startsWith("/payments/reports")) return "/payments/reports";
    return "/payments/overview";
  };

  const active = getActiveTab();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8f9ff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        {/* Main canvas — sits to the right of the global Sidebar */}
        <main style={{ flex: 1, minHeight: "100vh", padding: "6px", marginBottom: "52px" }}>
          {/* Page heading */}
          <div style={{ marginBottom: "10px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--neon-blue)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Payment Hub
            </h2>
            <p style={{ fontSize: "12px", color: "#4a4455", marginTop: "4px" }}>
              Manage transactions, transfers and payment history.
            </p>
          </div>

          {/* 3-col nav + 9-col content card grid — mirrors notifications layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {/* LEFT: bare nav buttons — no card, sits on the page background */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {tabs.map((tab) => {
                const isActive = active === tab.href;
                return (
                  <button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "stretch",
                      gap: "14px",
                      padding: "0",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "'Inter', sans-serif",
                      background: isActive ? "#f3f5f7" : "transparent",
                      boxShadow: isActive
                        ? "0 4px 14px rgba(99,14,212,0.12)"
                        : "none",
                      transition: "all 0.15s ease",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "#e9eef5";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* LEFT ACCENT PATCH */}
                    <div
                      style={{
                        width: "5px",
                        background: isActive ? "var(--neon-blue)" : "transparent",
                        borderRadius: "12px 0 0 12px",
                        flexShrink: 0,
                      }}
                    />

                    {/* CONTENT */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "8px 0",
                        width: "100%",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          color: "var(--neon-blue)",
                          flexShrink: 0,
                        }}
                      >
                        {tab.icon}
                      </span>

                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: isActive ? 700 : 500,
                            lineHeight: "20px",
                          }}
                        >
                          {tab.name}
                        </div>

                        <div
                          style={{
                            fontSize: "10px",
                            opacity: isActive ? 0.85 : 1,
                            color: isActive ? "#4a4455" : "#7b7487",
                            lineHeight: "16px",
                            marginTop: "1px",
                          }}
                        >
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* RIGHT: white overlay card — children render inside this */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #ccc3d8",
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                minHeight: "calc(100vh - 140px)",
              }}
            >
              {children}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}