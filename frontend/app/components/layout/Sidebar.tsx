"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";

const NAV = [
  { label: "Overview", icon: "⊞", to: "/dashboard" },
  { label: "My Rentals", icon: "🏠", to: "/rentals" },
  { label: "Payments", icon: "💳", to: "/payments" },
  { label: "AI Insights", icon: "🤖", to: "/ai-insights" },
  { label: "Notifications", icon: "🔔", to: "/notifications", badge: 3 },
  { label: "Settings", icon: "⚙", to: "/settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [active, setActive] = useState("/dashboard");

  const handleNavClick = (to: string) => {
    router.push(to);
    setActive(to);
  };

  return (
    <aside className="flex flex-col h-screen w-[220px] bg-space-bg border-r border-space-border px-4 py-6">
      
      {/* User info */}
      <div className="text-center mb-6 pb-6 border-b border-space-border">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-neon-purple to-neon-blue flex items-center justify-center text-2xl mx-auto mb-3">
          👤
        </div>
        <div className="font-semibold text-sm">{user?.name ?? "Alex Kimani"}</div>
        <div className="text-xs text-text-secondary">
          {user?.name ?? "Tenant"} · Since Jan 2024
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {NAV.map(({ label, icon, to, badge }) => (
          <button
            key={to}
            onClick={() => handleNavClick(to)}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              active === to
                ? "bg-space-surface/20 border border-space-border text-neon-blue font-semibold"
                : "hover:bg-space-surface/10 text-text-secondary"
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <span className="ml-auto bg-accent-danger text-white text-[9px] px-1.5 py-[1px] rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout button at bottom */}
      <button
        onClick={() => logout()}
        className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-status-danger hover:bg-red-600/10 rounded transition-colors"
      >
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  );
}