 "use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import type { ReactNode } from "react";
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

  const activeTab = tabs.find(tab => pathname === tab.href || pathname.startsWith(tab.href + '/')) || tabs[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="dashboard-section">
        <div className="dashboard-layout">
          <Sidebar />
          <main>
            <div className="glass-panel" style={{ marginTop: '24px', padding: '16px 24px' }}>
              <div className="tabs-container" style={{
                display: 'flex',
                gap: '28px',
                borderBottom: '1px solid var(--border-glow)',
                paddingBottom: '12px'
              }}>
                {tabs.map((tab) => (
                 <button
  key={tab.href}
  onClick={() => router.push(tab.href)}
style={{
  padding: '8px 46px',
  borderRadius: '8px 8px 0 0',
  background: pathname === tab.href ? 'rgba(17, 24, 39, 0.7)' : 'transparent',
  borderBottom: pathname === tab.href
    ? '2px solid var(--neon-blue)'
    : '2px solid transparent',
  boxShadow: pathname === tab.href
    ? '0 4px 10px -2px rgba(0, 225, 255, 0.3)'
    : 'none',
  color: pathname === tab.href
    ? 'var(--neon-blue)'
    : 'var(--text-secondary)',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.3s ease'
}}
>
  {tab.icon} {tab.name}
</button>
                ))}
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
