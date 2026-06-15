"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function NotificationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      name: "Notifications",
      href: "/notifications",
      icon: "sensors",
      description: "Sent messages & alerts",
    },
    {
      name: "Reviews",
      href: "/notifications/reviews",
      icon: "diamond",
      description: "Ratings & feedback",
    },
    {
      name: "Surveys",
      href: "/notifications/surveys",
      icon: "verified_user",
      description: "Questionnaires & polls",
    },
  ];

  const getActiveTab = () => {
    if (pathname.startsWith("/notifications/reviews")) return "/notifications/reviews";
    if (pathname.startsWith("/notifications/surveys")) return "/notifications/surveys";
    return "/notifications";
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
        <main style={{ flex: 1, minHeight: "100vh", padding: "24px" }}>
          {/* Page heading */}
          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#0b1c30",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Communications
            </h2>
            <p style={{ fontSize: "12px", color: "#4a4455", marginTop: "4px" }}>
              Manage outreach, alerts, reviews and surveys.
            </p>
          </div>

          {/* 3-col nav + 9-col content card grid — mirrors the reference layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {/* LEFT: bare nav buttons — no card, sits on the page background */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
    padding: "0", // important: move padding into inner container
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
  {/* LEFT PATCH */}
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
      padding: "8px 16px",
      width: "100%",
    }}
  >
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: 20,
        color: isActive ? "#630ed4" : "#630ed4",
        flexShrink: 0,
      }}
    >
      {tab.icon}
    </span>

    <div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: isActive ? 700 : 500,
          lineHeight: "20px",
        }}
      >
        {tab.name}
      </div>

      <div
        style={{
          fontSize: "11px",
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