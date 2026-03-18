import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { ReactNode } from "react";

export default function RolesLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <div className="dashboard-section">
        <div className="dashboard-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

