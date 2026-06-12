"use client";
import { useEffect, useMemo, useState } from "react";
import { Role, useAdminStore } from "../store/adminStore";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DynamicTable from "../components/ui/DynamicTable";



export default function RolesPage() {
  const { fetchRoles, roles, deleteRole, permissions } = useAdminStore();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeleteClick = (roleId: number) => {
    setSelectedRoleId(roleId);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRoleId !== null) {
      deleteRole(selectedRoleId);
    }
    setDialogOpen(false);
    setSelectedRoleId(null);
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedRoleId(null);
  };

  const formatPermissions = (permKeys: string[]) => {
    if (permKeys.includes("*")) return "All Permissions";
    if (permKeys.length === 0) return "-";

    const first = permissions.find((p) => p.key === permKeys[0]);
    const firstLabel = first ? first.label : permKeys[0];

    const remainingCount = permKeys.length - 1;

    return remainingCount > 0
      ? `${firstLabel} +${remainingCount}`
      : firstLabel;
  };

  const columns = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        width: 50,
        render: (_: Role, index: number) => index + 1,
      },
      {
        key: "name",
        header: "Role Name",
        render: (row: Role) => (
          <span style={{ color: "var(--neon-secondary)" }}>
            {row.name || "-"}
          </span>
        ),
        sortValue: (row: Role) => row.name ?? "",
      },
      {
        key: "code",
        header: "Role Code",
        render: (row: Role) => row.code || "-",
        sortValue: (row: Role) => row.code ?? "",
      },
      {
        key: "description",
        header: "Description",
        render: (row: Role) => row.description || "No description",
        sortValue: (row: Role) => row.description ?? "",
      },
      {
        key: "permissions",
        header: "Permissions",
        render: (row: Role) => (
          <span title={row.permissions.join(", ")}>
            {formatPermissions(row.permissions)}
          </span>
        ),
        sortValue: (row: Role) => row.permissions.length ?? "",
      },
    ],
    [permissions]
  );

  const rowActions = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        onClick: (row: Role) => router.push(`/roles/view/${row.id}`),
      },
      {
        key: "edit",
        label: "Edit",
        onClick: (row: Role) => router.push(`/roles/edit/${row.id}`),
      },
      {
        key: "delete",
        label: "Delete",
        onClick: (row: Role) => handleDeleteClick(row.id),
      },
    ],
    [router]
  );

  return (
    <div className="dashboard-content">
      <div className="page-tag">🎭 ROLES & PERMISSIONS</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="section-label">ACCESS CONTROL</div>

        <button
          onClick={() => router.push("/roles/new")}
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
          + New Role
        </button>
      </div>

      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Roles ({roles.length})
        </h2>
      </div>

      <DynamicTable<Role>
        rows={roles}
        getRowId={(r) => r.id}
        columns={columns}
        rowActions={rowActions}
        search={{
          enabled: true,
          placeholder: "Search roles...",
          getSearchText: (row) =>
            `${row.name} ${row.code} ${row.description}`.toLowerCase(),
        }}
        pagination={{
    enabled: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20, 50, 100],
  }}
        noRecordsMessage="No roles defined"
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}