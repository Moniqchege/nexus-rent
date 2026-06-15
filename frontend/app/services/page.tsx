"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { ServiceProvider } from "@/types/service";

import ConfirmDialog from "../components/ui/ConfirmDialog";
import DynamicTable from "../components/ui/DynamicTable";

export default function ServiceLendersPage() {
  const router = useRouter();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await api.get("/api/services/providers");
      setProviders(res.data.providers || []);
    } catch (error) {
      console.error("Load providers error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedId === null) return;

    try {
      await api.delete(`/api/services/providers/${selectedId}`);
      setProviders((prev) => prev.filter((p) => p.id !== selectedId));
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDialogOpen(false);
      setSelectedId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  const columns = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        width: 60,
        render: (_: ServiceProvider, index: number) => index + 1,
      },
      {
        key: "name",
        header: "Provider Name",
        render: (row: ServiceProvider) => (
          <span style={{ color: "var(--neon-secondary)" }}>
            {row.name || "-"}
          </span>
        ),
        sortValue: (row: ServiceProvider) => row.name ?? "",
      },
      {
        key: "category",
        header: "Category",
        render: (row: ServiceProvider) =>
          row.category?.name || "-",
        sortValue: (row: ServiceProvider) =>
          row.category?.name ?? "",
      },
      {
        key: "contact",
        header: "Contact",
        render: (row: ServiceProvider) =>
          row.phone || row.email || "-",
        sortValue: (row: ServiceProvider) =>
          row.phone || row.email || "",
      },
    ],
    []
  );

  const rowActions = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        onClick: (row: ServiceProvider) =>
          router.push(`/services/view/${row.id}`),
      },
    ],
    [router]
  );

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ padding: "60px", textAlign: "center" }}>
          Loading service providers...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="section-label">PROVIDERS</div>

        <button
          onClick={() => router.push("/services/new")}
          style={{
            background:
              "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + New Provider
        </button>
      </div>

      <div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#000000",
            marginBottom: "18px",
          }}
        >
          Providers Management
        </h2>
      </div>

      <DynamicTable<ServiceProvider>
        rows={providers}
        getRowId={(row) => row.id}
        columns={columns}
        rowActions={rowActions}
        search={{
          enabled: true,
          placeholder: "Search providers...",
          getSearchText: (row) =>
            `
              ${row.name ?? ""}
              ${row.category?.name ?? ""}
              ${row.phone ?? ""}
              ${row.email ?? ""}
            `.toLowerCase(),
        }}
        pagination={{
          enabled: true,
          defaultPageSize: 10,
          pageSizeOptions: [5, 10, 20, 50, 100],
        }}
        noRecordsMessage="No service providers found"
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete Provider"
        message="Are you sure you want to delete this provider? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}