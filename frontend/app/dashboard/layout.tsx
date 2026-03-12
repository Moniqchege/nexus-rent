import Sidebar from "@/app/components/layout/Sidebar";
import type { ReactNode } from "react";
import Navbar from "../components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="dashboard-section">
        <div className="dashboard-layout">
          <Sidebar />
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}