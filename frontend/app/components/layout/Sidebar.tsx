"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useUIStore } from "@/app/store/uiStore";
import api from "@/app/lib/api";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [active, setActive] = useState("/dashboard");
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
   const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    api.get("/api/notifications/reviews").then(({ data }) => {
      setUnreadCount(data.length);
    }).catch(() => setUnreadCount(0));
  }, [user]);

  const NAV = [
  { label: "Overview", icon: "⊞", to: "/dashboard" },
{ label: "My Rentals", icon: "🏠", to: "/my-rentals" },
// { label: "My Properties", icon: "🏠", to: "/properties" },
  { label: "Payments", icon: "💳", to: "/payments" },
  // { label: "AI Insights", icon: "🤖", to: "/ai-insights" },
  { label: "Notifications", icon: "🔔", to: "/notifications", badge: unreadCount },
  { label: "Roles", icon: "🎭", to: "/roles" },
  { label: "Users", icon: "👥", to: "/users" },
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
        !(event.target as Element).closest('.menu-btn')
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, closeSidebar]);

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar ${isSidebarOpen ? 'open' : ''}`} 
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      
      {/* User info */}
      <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--border-glow)" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(to top right, var(--neon-purple), var(--neon-blue))",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px"
        }}>
          👤
        </div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name ?? "Alex Kimani"}</div>
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
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
            {badge && (
              <span style={{ marginLeft: "auto", background: "var(--accent-danger)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 12 }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout button at bottom */}
      <button
        onClick={() => logout()}
        className="sidebar-item logout"
      >
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  );
}