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

type LeaseRow = any;

export default function LeasesPage() {
  const { fetchLeases, leases, deleteLease } = useAdminStore();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

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
