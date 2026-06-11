"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { useUIStore } from "@/app/store/uiStore";
import api from "@/app/lib/api";
import { X } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    api
      .get("/notifications/reviews")
      .then(({ data }) => {
        setUnreadCount(data.length);
      })
      .catch(() => setUnreadCount(0));
  }, [user]);

  const NAV = [
    { label: "Overview", icon: "/overview.png", to: "/dashboard" },
    { label: "Apartments", icon: "/apartment_icon.png", to: "/my-rentals" },
    { label: "Leases", icon: "/apartment_icon.png", to: "/leases" },
    { label: "Finances", icon: "/payments_icon.png", to: "/payments" },
    { label: "Roles", icon: "/roles_icon.png", to: "/roles" },
    { label: "Users", icon: "/users_icon.png", to: "/users" },
    {
      label: "Notifications",
      icon: "/notifications_icon.png",
      to: "/notifications",
      badge: unreadCount,
    },
    {
      label: "Service Providers",
      icon: "/service_lenders.png",
      to: "/services",
    },
  ];

  const handleNavClick = (to: string) => {
    router.push(to);
    closeSidebar();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".menu-btn")
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, closeSidebar]);

  return (
    <>
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
        aria-hidden
      />
      <aside
        ref={sidebarRef}
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* User info */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
            paddingBottom: 20,
            borderBottom: "1px solid var(--border-glow)",
            position: "relative",
          }}
        >
          <button
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="menu-btn"
            style={{
              position: "absolute",
              top: -4,
              right: 0,
              background: "transparent",
              border: "1px solid var(--border-glow)",
              borderRadius: 8,
              padding: 4,
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 10px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border-glow)",
            }}
          >
            <img
              src="/profile_icon.png"
              alt="Profile"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            {user?.name ?? "Alex Kimani"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {user?.name ? "User" : "Tenant"} · Since Jan 2024
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {NAV.map(({ label, icon, to, badge }) => (
            <button
              key={to}
              onClick={() => handleNavClick(to)}
              className={`sidebar-item ${pathname === to ? "active" : ""}`}
            >
              <span
                className="sidebar-icon"
                style={{ display: "flex", alignItems: "center" }}
              >
                <img
                  src={icon}
                  alt={label}
                  style={{ width: 20, height: 20, objectFit: "contain" }}
                />
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              {badge ? (
                <span
                  style={{
                    background: "var(--accent-danger)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 999,
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Logout button at bottom */}
        <button
          onClick={() => logout()}
          className="sidebar-item logout"
        >
          <img
            src="/logout_icon.png"
            alt="Logout"
            style={{ width: 20, height: 20, objectFit: "contain" }}
          />
          Logout
        </button>
      </aside>
    </>
  );
}
