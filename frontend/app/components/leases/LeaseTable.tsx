"use client";

import { Lease } from "@/types/lease";
import { useRouter } from "next/navigation";

interface LeaseTableProps {
  leases: Lease[];
  onDeleteClick: (id: number) => void;
}

export default function LeaseTable({ leases, onDeleteClick }: LeaseTableProps) {
  const router = useRouter();

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "ended":
        return "#ef4444";
      case "suspended":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-glow)" }}>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Property</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Tenant</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Start Date</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>End Date</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Rent (KES)</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Cycle</th>
            <th style={{ textAlign: "left", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Status</th>
            <th style={{ textAlign: "right", padding: "12px", fontSize: "12px", color: "var(--neon-blue)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leases.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                No leases found.
              </td>
            </tr>
          )}
          {leases.map((lease) => (
            <tr key={lease.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td style={{ padding: "12px", fontSize: "14px" }}>
                {lease.property?.title || "—"}
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{lease.property?.location}</div>
              </td>
              <td style={{ padding: "12px", fontSize: "14px" }}>{lease.tenant?.name || "—"}</td>
              <td style={{ padding: "12px", fontSize: "14px" }}>{lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "12px", fontSize: "14px" }}>{lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "12px", fontSize: "14px" }}>{lease.rentAmount?.toLocaleString()}</td>
              <td style={{ padding: "12px", fontSize: "14px", textTransform: "capitalize" }}>{lease.billingCycle}</td>
              <td style={{ padding: "12px", fontSize: "14px" }}>
                <span
                  style={{
                    backgroundColor: `${statusColor(lease.status)}20`,
                    color: statusColor(lease.status),
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {lease.status}
                </span>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => router.push(`/leases/${lease.id}`)}
                    style={{
                      background: "rgba(17,24,39,0.5)",
                      color: "var(--neon-blue)",
                      border: "1px solid var(--border-glow)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => router.push(`/leases/${lease.id}/print`)}
                    style={{
                      background: "rgba(17,24,39,0.5)",
                      color: "var(--neon-purple)",
                      border: "1px solid var(--border-glow)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Print
                  </button>
                  <button
                    onClick={() => onDeleteClick(lease.id)}
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

