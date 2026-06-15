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
    { name: 'Notifications', href: '/notifications', icon: '📡' },
    { name: 'Reviews', href: '/notifications/reviews', icon: '💠' },
    { name: 'Surveys', href: '/notifications/surveys', icon: '🛡️' },
  ];

  const getActiveTab = () => {
  if (pathname.startsWith("/notifications/reviews")) return "/notifications/reviews";
  if (pathname.startsWith("/notifications/surveys")) return "/notifications/surveys";
  return "/notifications";
};

const active = getActiveTab();

  const activeTab = tabs.find(tab => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="dashboard-section">
        <div className="dashboard-layout">
          <Sidebar />
          <main>
            <div className="glass-panel" style={{ marginTop: '24px', padding: '16px 24px' }}>
             <div
  style={{
    display: "flex",
    gap: 6,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 10,
  }}
>
 {tabs.map((tab) => {
  const isActive = active === tab.href;
  const isDefaultTab = tab.href === "/notifications";

  return (
    <button
      key={tab.href}
      onClick={() => router.push(tab.href)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,

        padding: "8px 14px",
        borderRadius: 8,

        fontSize: 14,
        fontWeight: 500,

        cursor: "pointer",
        transition: "all 0.15s ease",

        border: "1px solid transparent",

        // 🔑 IMPORTANT CHANGE:
        background: isActive
          ? "#F3F6FF"
          : "white", // default is ALWAYS white when not active

        color: isActive ? "#1D4ED8" : "#374151",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#F9FAFB";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "white";
        }
      }}
    >
      <span style={{ fontSize: 16 }}>{tab.icon}</span>
      <span>{tab.name}</span>

      {isActive && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#1D4ED8",
            marginLeft: 4,
          }}
        />
      )}
    </button>
  );
})}
</div>
            </div>
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
