"use client";
import React from "react";
import { useEffect, useState } from 'react';
import { Payment, RentSchedule } from '@/types/payment';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const es = new EventSource('/api/payments/sse'); 
    es.onmessage = (event) => {
      console.log('Payment alert:', event.data);
      loadData();
    };
    return () => es.close();
  }, []);

  const [upcomingBills, setUpcomingBills] = useState([
  { id: 1, due: 'Apr 20', status: 'due', amount: 'KSh 2,400', property: 'Unit 3A', type: 'electricity' },
  { id: 2, due: 'Apr 22', status: 'upcoming', amount: 'KSh 1,800', property: 'Unit 5B', type: 'water' },
]);

  const loadData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/payments/schedules?status=overdue,due'),
      ]);
      setPayments(await pRes.json());
      setSchedules(await sRes.json());
    } catch {}
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  const handleExport = () => {
    fetch('/api/payments/export-csv')
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'payments.csv';
        a.click();
      });
  };
  return (
    <div className="dashboard-content">
      <div className="page-tag">💳 PAYMENTS DASHBOARD</div>

      {/* Upcoming Utility Bills to Collect */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--neon-blue)" }}>
            Upcoming Utility Bills
          </div>
          <button style={{ padding: "8px 16px", backgroundColor: "rgba(0,240,255,0.1)", border: "1px solid var(--neon-blue)", borderRadius: "8px", color: "var(--neon-blue)", fontSize: "12px" }}>
            Send Reminders
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {upcomingBills.map((bill) => (
            <div key={bill.id} style={{ backgroundColor: "rgba(17,24,39,0.8)", border: "1px solid var(--border-glow)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Due {bill.due}
                </span>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: bill.status === "due" ? "rgba(255,59,129,0.2)" : "rgba(0,255,163,0.2)",
                    color: bill.status === "due" ? "var(--accent-danger)" : "var(--accent-success)",
                  }}
                >
                  {bill.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--neon-blue)", marginBottom: "4px" }}>
                {bill.amount}
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "12px" }}>
                {bill.property} - {bill.type.toUpperCase()}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ flex: 1, padding: "8px", backgroundColor: "rgba(0,240,255,0.1)", border: "1px solid var(--neon-blue)", borderRadius: "8px", color: "var(--neon-blue)", fontSize: "12px" }}>
                  Invoice
                </button>
                <button style={{ flex: 1, padding: "8px", backgroundColor: "rgba(0,255,163,0.1)", border: "1px solid var(--accent-success)", borderRadius: "8px", color: "var(--accent-success)", fontSize: "12px" }}>
                  Mark Paid
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Landlord Stats */}
     <section className="stats-section" style={{ marginBottom: "40px" }}>
        <div className="stats-row">
          <div className="overview-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", backgroundColor: "var(--accent-success)", boxShadow: "0 0 10px var(--accent-success)" }} />
            <div className="stat-icon" style={{ backgroundColor: "rgba(0,255,163,0.1)" }}>🏠</div>
            <div className="ov-label">Rent Collected</div>
            <div className="ov-value" style={{ color: "var(--accent-success)" }}>KSh 156K</div>
            <div className="ov-change" style={{ color: "var(--accent-success)" }}>↑ 8.7% MoM</div>
          </div>

          <div className="overview-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", backgroundColor: "var(--neon-blue)", boxShadow: "0 0 10px var(--neon-blue)" }} />
            <div className="stat-icon" style={{ backgroundColor: "rgba(0,240,255,0.1)" }}>⚡</div>
            <div className="ov-label">Electricity Bills</div>
            <div className="ov-value" style={{ color: "var(--neon-blue)" }}>KSh 12.4K</div>
            <div className="ov-change">Collected</div>
          </div>

          <div className="overview-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", backgroundColor: "var(--neon-purple)", boxShadow: "0 0 10px var(--neon-purple)" }} />
            <div className="stat-icon" style={{ backgroundColor: "rgba(124,58,237,0.1)" }}>💧</div>
            <div className="ov-label">Water Bills</div>
            <div className="ov-value" style={{ color: "var(--neon-purple)" }}>KSh 7.2K</div>
            <div className="ov-change">Collected</div>
          </div>

          <div className="overview-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", backgroundColor: "var(--accent-danger)", boxShadow: "0 0 10px var(--accent-danger)" }} />
            <div className="stat-icon" style={{ backgroundColor: "rgba(255,59,129,0.1)" }}>🔧</div>
            <div className="ov-label">Pending Utilities</div>
            <div className="ov-value" style={{ color: "var(--accent-danger)" }}>KSh 5.6K</div>
            <div className="ov-change">3 bills</div>
          </div>
        </div>
      </section>

      {/* Recent Transactions History */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-glow)', marginBottom: '40px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neon-blue)' }}>Recent Transactions</div>
            <button style={{ padding: '8px 16px', backgroundColor: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-blue)', borderRadius: '8px', color: 'var(--neon-blue)', fontSize: '12px' }}>View All</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(0,240,255,0.05)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
             {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-glow)' }}>
                  <td style={{ padding: '16px 20px', fontSize: '14px' }}>{payment.date}</td>
                  <td style={{ padding: '16px 20px', fontSize: '14px' }}>{payment.tenant.name}</td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--neon-purple)' }}>{payment.method}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-success)' }}>{payment.amount}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: payment.status === 'paid' ? 'rgba(0,255,163,0.1)' : 'rgba(255,59,129,0.1)',
                      color: payment.status === 'paid' ? 'var(--accent-success)' : 'var(--accent-danger)'
                    }}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts & Landlord Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Revenue Chart */}
        <div style={{ backgroundColor: 'rgba(17,24,39,0.8)', border: '1px solid var(--border-glow)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--neon-blue)' }}>Rent + Utilities Revenue</div>
          <div style={{ display: 'flex', alignItems: 'end', height: '240px', gap: '12px', padding: '20px 0' }}>
            {['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map((month, idx) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  height: `${50 + idx * 12}%`,
                  width: '32px',
                  backgroundColor: idx % 2 === 0 ? 'var(--neon-blue)' : 'var(--accent-success)',
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '12px',
                  opacity: 0.8,
                  boxShadow: '0 4px 16px rgba(0,240,255,0.3)'
                }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'rgba(17,24,39,0.8)', border: '1px solid var(--border-glow)', borderRadius: '20px', padding: '24px', height: 'fit-content' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', color: 'var(--neon-purple)' }}>Landlord Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={{ padding: '12px', backgroundColor: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-blue)', borderRadius: '10px', color: 'var(--neon-blue)', fontSize: '13px', cursor: 'pointer' }}>
              Generate Utility Invoices
            </button>
            <button style={{ padding: '12px', backgroundColor: 'rgba(0,255,163,0.1)', border: '1px solid var(--accent-success)', borderRadius: '10px', color: 'var(--accent-success)', fontSize: '13px', cursor: 'pointer' }}>
              Payout to Bank
            </button>
            <button style={{ padding: '12px', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid var(--neon-purple)', borderRadius: '10px', color: 'var(--neon-purple)', fontSize: '13px', cursor: 'pointer' }}>
              Download Reports
            </button>
            <button style={{ padding: '12px', backgroundColor: 'rgba(255,59,129,0.1)', border: '1px solid var(--accent-danger)', borderRadius: '10px', color: 'var(--accent-danger)', fontSize: '13px', cursor: 'pointer' }}>
              Late Fee Notices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
