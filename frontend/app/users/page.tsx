"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../store/adminStore";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DynamicTable from "../components/ui/DynamicTable";

export default function UsersPage() {
  const {
    fetchUsers,
    users,
    deleteUser,
    loading: storeLoading,
  } = useAdminStore();

  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers("");
  }, []);

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUserId !== null) {
      await deleteUser(selectedUserId);
    }

    setDialogOpen(false);
    setSelectedUserId(null);
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
  };

  const columns = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        width: 50,
        render: (_: any, index: number) => index + 1,
      },
      {
        key: "name",
        header: "Name",
        render: (row: any) => (
          <span style={{ color: "var(--neon-secondary)" }}>
            {row.name || "-"}
          </span>
        ),
        sortValue: (row: any) => row.name ?? "",
      },
      {
        key: "email",
        header: "Email",
        render: (row: any) => row.email || "-",
        sortValue: (row: any) => row.email ?? "",
      },
      {
        key: "phone",
        header: "Phone Number",
        render: (row: any) => row.phone || "-",
        sortValue: (row: any) => row.phone ?? "",
      },
      {
        key: "createdAt",
        header: "Created At",
        render: (row: any) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "-",
        sortValue: (row: any) =>
          row.createdAt
            ? new Date(row.createdAt).getTime()
            : 0,
      },
    ],
    []
  );

  const rowActions = useMemo(
    () => [
      {
        key: "view",
        label: "View",
        onClick: (row: any) =>
          router.push(`/users/edit/${row.id}`),
      },
      {
        key: "edit",
        label: "Edit",
        onClick: (row: any) =>
          router.push(`/users/edit/${row.id}`),
      },
      {
        key: "delete",
        label: "Delete",
        onClick: (row: any) =>
          handleDeleteClick(row.id),
      },
    ],
    [router]
  );

  if (storeLoading) {
    return (
      <div
        style={{
          backgroundColor: "rgba(17,24,39,0.8)",
          border: "1px solid var(--border-glow)",
          borderRadius: "20px",
          padding: "60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "var(--neon-blue)",
            fontSize: "16px",
          }}
        >
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="page-tag">👥 USERS MANAGEMENT</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="section-label">ADMIN PANEL</div>

        <button
          onClick={() => router.push("/users/new")}
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
          + New User
        </button>
      </div>

      <div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--neon-blue)",
          }}
        >
          User Accounts ({users.length})
        </h2>
      </div>

      <DynamicTable<any>
        rows={users}
        getRowId={(r) => r.id}
        columns={columns}
        rowActions={rowActions}
        search={{
          enabled: true,
          placeholder: "Search users by name, email or phone...",
          getSearchText: (row) =>
            `${row.name} ${row.email} ${row.phone}`.toLowerCase(),
        }}
        pagination={{
          enabled: true,
          defaultPageSize: 5,
          pageSizeOptions: [5, 10, 20, 50, 100],
        }}
        noRecordsMessage="No users found"
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}