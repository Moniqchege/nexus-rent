"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import DynamicTable, {
  type DynamicTableColumn,
  type DynamicTableRowAction,
} from "@/app/components/ui/DynamicTable";
import { Plus } from "lucide-react";
import api from "@/app/lib/api";

type LeaseRow = any;

interface RenewalRecord {
  leaseId: number;
  propertyId: number;
  propertyTitle: string;
  tenantId: number;
  tenantName: string;
  endDate: string;
  tenureMonths: number;
  riskScore: number;
  riskCategory: "Low" | "Medium" | "High";
  isFlightRisk: boolean;
  incentive: string;
}

export default function LeasesPage() {
  const { fetchLeases, leases, deleteLease } = useAdminStore();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);

  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [renewalLoading, setRenewalLoading] = useState(true);
  const [renewalError, setRenewalError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  useEffect(() => {
    setRenewalLoading(true);
    api.get('/api/ai/leases/renewals')
      .then((res) => setRenewals(res.data ?? []))
      .catch(() => setRenewalError('Failed to load AI renewal data.'))
      .finally(() => setRenewalLoading(false));
  }, []);

  const handleDeleteClick = (leaseId: number) => {
    setSelectedLeaseId(leaseId);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedLeaseId !== null) {
      await deleteLease(selectedLeaseId);
      setDialogOpen(false);
      setSelectedLeaseId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedLeaseId(null);
  };

  const sortedLeases = useMemo(() => {
    return [...leases].sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
  }, [leases]);

  const columns: DynamicTableColumn<LeaseRow>[] = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        width: 60,
        render: (_: any, index: number) => (
          <span style={{ color: "var(--text-secondary)" }}>{index + 1}</span>
        ),
      },
      {
        key: "property",
        header: "Property",
        render: (row: any) => (
          <div>
            <div
              style={{
                fontSize: 14,
                whiteSpace: "nowrap",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {row.property?.title || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {row.property?.location || ""}
            </div>
          </div>
        ),
        sortValue: (row: any) => String(row.property?.title ?? ""),
      },
      {
        key: "startDate",
        header: "Start Date",
        render: (row: any) =>
          row.startDate ? new Date(row.startDate).toLocaleDateString() : "—",
        sortValue: (row: any) => (row.startDate ? new Date(row.startDate).getTime() : 0),
      },
      {
        key: "endDate",
        header: "End Date",
        render: (row: any) =>
          row.endDate ? new Date(row.endDate).toLocaleDateString() : "—",
        sortValue: (row: any) => (row.endDate ? new Date(row.endDate).getTime() : 0),
      },
      {
        key: "rentAmount",
        header: "Rent (ksh)",
        render: (row: any) =>
          row.rentAmount != null
            ? Number(row.rentAmount).toLocaleString()
            : "—",
        sortValue: (row: any) => Number(row.rentAmount ?? 0),
      },
      {
        key: "billingCycle",
        header: "Cycle",
        render: (row: any) => String(row.billingCycle ?? "—"),
        sortValue: (row: any) => String(row.billingCycle ?? ""),
      },
    ],
    []
  );

  const rowActions: DynamicTableRowAction<LeaseRow>[] = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        onClick: (row: any) => router.push(`/leases/${row.id}/view`),
      },
    ],
    [router]
  );

  function renewalBadge(isFlightRisk: boolean, riskCategory: string) {
    if (isFlightRisk) return { bg: "#fffbeb", color: "#f59e0b", border: "#fde68a", label: "⚠ Flight Risk" };
    if (riskCategory === "High") return { bg: "#fff1f2", color: "#ef4444", border: "#fecaca", label: "High Risk" };
    return { bg: "#f0fdf4", color: "#10b981", border: "#bbf7d0", label: "Standard" };
  }

  return (
    <div className="dashboard-content">
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div className="section-label">LEASES</div>
        <button
          onClick={() => router.push("/leases/new")}
          style={{ 
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <Plus size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          New Lease
        </button>
      </div>

      {/* AI RENEWAL ASSISTANT PANEL */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>AI Renewal Assistant</h3>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>60–90 day lease expiry window</span>
        </div>

        {renewalLoading ? (
          <div style={{ padding: "24px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            ⏳ Loading renewal intelligence...
          </div>
        ) : renewalError ? (
          <div style={{ padding: "16px 20px", color: "#ef4444", fontSize: 13 }}>⚠ {renewalError}</div>
        ) : renewals.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>✅ No renewals due in the next 60–90 days</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Tenant</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Property</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Tenure</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Risk</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Incentive</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase" as const }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => {
                  const badge = renewalBadge(r.isFlightRisk, r.riskCategory);
                  return (
                    <tr key={r.leaseId} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{r.tenantName}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{r.propertyTitle}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{r.tenureMonths} months</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", maxWidth: 240 }}>{r.incentive}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => router.push(`/notifications/send?tenant=${encodeURIComponent(r.tenantName)}&template=Lease+Renewal`)}
                          style={{
                            padding: "5px 12px", borderRadius: 8, border: "none",
                            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
                            color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          ✉ Notify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#000000", marginBottom: "16px" }}>Lease Agreements</h2>

      <DynamicTable<any>
        rows={sortedLeases}
        getRowId={(r) => r.id}
        columns={columns}
        rowActions={rowActions}
        search={{
          enabled: true,
          placeholder: "Search leases by property, tenant, or status...",
          getSearchText: (row: any) => {
            const tenantName = Array.isArray(row.tenants)
              ? row.tenants.map((t: any) => t?.tenant?.name ?? "").join(" ")
              : "";
            const singleTenantName = row.tenant?.name ?? "";
            return `${row.property?.title ?? ""} ${singleTenantName} ${tenantName} ${
              row.status ?? ""
            }`.toLowerCase();
          },
        }}
        pagination={{
          enabled: true,
          defaultPageSize: 5,
          pageSizeOptions: [5, 10, 20, 50, 100],
        }}
        noRecordsMessage="No leases found"
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete Lease"
        message="Are you sure you want to delete this lease? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
