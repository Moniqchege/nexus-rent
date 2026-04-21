import Sidebar from "@/app/components/layout/Sidebar";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import type { ReactNode } from "react";
import Paymentsnav from "./_lib/Paymentsnav";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="dashboard-section">
        <div className="dashboard-layout">
          <Sidebar />
          <main>
            <div className="dashboard-content">
              <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
                ::-webkit-scrollbar { width:4px; height:4px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
              `}</style>

              {/* Page header */}
              <div className="page-tag">💳 PAYMENT MANAGEMENT</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div className="section-label">PAYMENTS</div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neon-purple)", marginTop: 4 }}>
                    <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#00ff87", marginRight:6, boxShadow:"0 0 6px #00ff87", animation:"pulse 1.5s infinite" }} />
                    Payment Hub
                  </h2>
                </div>
                {/* Quick-action button navigates to /payments/initiate */}
                <a
                  href="/payments/initiate"
                  style={{
                    background: "linear-gradient(to right,var(--neon-blue),var(--neon-purple))",
                    color: "white", border: "none", borderRadius: 12,
                    padding: "11px 22px", fontWeight: 600, cursor: "pointer",
                    fontSize: 14, textDecoration: "none", display: "inline-block",
                  }}
                >
                  + New Payment
                </a>
              </div>

              {/* Tab navigation — active state is handled client-side in PaymentsNav */}
              <Paymentsnav />

              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}