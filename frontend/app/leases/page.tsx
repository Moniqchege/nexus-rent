"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import SearchBar from "@/app/components/ui/SearchBar";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import LeaseTable from "@/app/components/leases/LeaseTable";

export default function LeasesPage() {
  const { fetchLeases, leases, deleteLease, loading: storeLoading } = useAdminStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeases();
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

  const filteredLeases = leases.filter((lease) =>
    lease.property?.title?.toLowerCase().includes(search.toLowerCase()) ||
    lease.tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
    lease.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div className="page-tag">📄 LEASE MANAGEMENT</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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
          + New Lease
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Lease Agreements ({filteredLeases.length})
        </h2>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search leases by property, tenant, or status..."
      />

      <LeaseTable leases={filteredLeases} onDeleteClick={handleDeleteClick} />

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

