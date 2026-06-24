"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../store/adminStore";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DynamicTable from "../components/ui/DynamicTable";

export default function UsersPage() {
  const {
    fetchUsers,
    fetchUserStats,
    userStats,
    users,
    lockUnlockUser,
    killUserSessions,
    resetUserPassword,
    loading: storeLoading,
  } = useAdminStore();

  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers("");
    fetchUserStats();
  }, [fetchUsers, fetchUserStats]);

  const [dialogAction, setDialogAction] = useState<
    "lock" | "unlock" | "killSessions" | "resetPassword" | null
  >(null);

  const openDialog = (
    action: "lock" | "unlock" | "killSessions" | "resetPassword",
    userId: number
  ) => {
    setSelectedUserId(userId);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
    setDialogAction(null);
  };

  const confirmAction = async () => {
    if (selectedUserId == null || !dialogAction) return;

    if (dialogAction === "lock") {
      await lockUnlockUser(selectedUserId, true);
    } else if (dialogAction === "unlock") {
      await lockUnlockUser(selectedUserId, false);
    } else if (dialogAction === "killSessions") {
      await killUserSessions(selectedUserId);
    } else if (dialogAction === "resetPassword") {
      await resetUserPassword(selectedUserId);
    }

    closeDialog();
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
          <span style={{ color: "var(--neon-secondary)", whiteSpace: "nowrap" }}>
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
  key: "status",
  header: "Status",
  render: (row: any) => {
    const locked = row.isLocked;

    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 18px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          background: locked
            ? "#0F52BA"
            : "transparent",
          color: locked ? "#ffffff" : "#0F52BA",
          border: locked
            ? "0.1px solid #0F52BA"
            : "0.1px solid #0F52BA",
          width: "fit-content",
        }}
      >
        

        {locked ? "Locked" : "Active"}
      </div>
    );
  },
  sortValue: (row: any) => (row.isLocked ? 1 : 0),
},
    ],
    []
  );

  const rowActions = useMemo(
    () =>
      [
        {
          key: "view",
          label: "View",
          onClick: (row: any) => router.push(`/users/view/${row.id}`),
        },
      ] as any,
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

      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#000000", marginBottom: "12px" }}>User Management</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 12 }}>
        {(() => {
         const cards = [
           { label: "Total Users", value: userStats.totalUsers },
           { label: "Active Users", value: userStats.activeUsers },
           { label: "Locked Users", value: userStats.lockedUsers },
         ];

          return cards.map((c) => (
            <div
              key={c.label}
              style={{
                borderRadius: 20,
                padding: "18px 16px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
                minHeight: 92,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 6,
              }}
            >
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 600,
              }}
            >
              {c.label}
            </div>

            <div
              style={{
               fontSize: 21,
               fontWeight: 800,
               letterSpacing: "0.2px",
               color: "var(--neon-purple)",
              }}
            >
               {c.value}
            </div>
           </div>
         ));
        })()}
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
        title={
          dialogAction === "lock"
            ? "Lock User"
            : dialogAction === "unlock"
              ? "Unlock User"
              : dialogAction === "killSessions"
                ? "Kill User Sessions"
                : "Reset User Password"
        }
        message={
          dialogAction === "lock"
            ? "This will lock the user account and invalidate their sessions."
            : dialogAction === "unlock"
              ? "This will unlock the user account."
              : dialogAction === "killSessions"
                ? "This will terminate all active sessions for this user."
                : "This will reset the user password and email the new password."
        }
        onConfirm={confirmAction}
        onCancel={closeDialog}
        confirmText={
          dialogAction === "lock"
            ? "Lock"
            : dialogAction === "unlock"
              ? "Unlock"
              : dialogAction === "killSessions"
                ? "Kill"
                : "Reset"
        }
      />
    </div>
  );
}