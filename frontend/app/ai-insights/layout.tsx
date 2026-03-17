
import Sidebar from "@/app/components/layout/Sidebar";
import type { ReactNode } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function AiInsightsLayout({
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
      <Footer />
    </div>
  );
}