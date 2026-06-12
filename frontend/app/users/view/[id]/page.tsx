"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import ViewDetails from "@/app/components/ui/ViewDetails";
import DynamicTable from "@/app/components/ui/DynamicTable";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

interface PendingAction {
  type: "reset-password" | "lock-unlock" | "kill-sessions";
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();

  const userId = Number(params?.id);

  const {
    fetchUser,
    users,
    fetchUsers,
    lockUnlockUser,
    killUserSessions,
    resetUserPassword,
    loading,
  } = useAdminStore();

  const [user, setUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;

    const load = async () => {
      const res = await fetchUser(userId);

      if (res) {
        setUser(res);
        return;
      }

      if (!users?.length) {
        await fetchUsers("");
      }

      const match = (users || []).find((u: any) => u.id === userId);
      setUser(match ?? null);
    };

    load();
  }, [userId]);

  const metaColumns = [
    { key: "label", header: "Field", render: (r: any) => r.label },
    { key: "value", header: "Value", render: (r: any) => r.value },
  ];

  const openConfirmDialog = (action: PendingAction) => {
    setPendingAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction.onConfirm();
      setDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setPendingAction(null);
  };

  const tabs = useMemo(
    () => [
      {
        key: "audit",
        label: "Audit Trail",
        table: {
          rows: user?.auditTrail ?? [],
          columns: [
            {
              key: "date",
              header: "Date",
              render: (r: any) =>
                r.createdAt
                  ? new Date(r.createdAt).toLocaleString()
                  : "-",
            },
            {
              key: "action",
              header: "Action",
              render: (r: any) => r.action ?? "-",
            },
            {
              key: "actor",
              header: "Actor",
              render: (r: any) => r.actor ?? "-",
            },
          ],
          search: false,
        },
      },
      {
        key: "permissions",
        label: "Permissions",
        table: {
          rows: user?.permissions ?? [],
          columns: [
            {
              key: "name",
              header: "Permission",
              render: (r: any) => r.name ?? "-",
            },
            {
              key: "desc",
              header: "Description",
              render: (r: any) => r.description ?? "-",
            },
          ],
          search: false,
        },
      },
      {
        key: "assigned",
        label: "Assigned Properties",
        table: {
          rows: user?.userProperties ?? [],
          columns: [
            {
              key: "property",
              header: "Property",
              render: (r: any) => r.property?.title ?? "-",
            },
            {
              key: "location",
              header: "Location",
              render: (r: any) => r.property?.location ?? "-",
            },
          ],
          search: false,
        },
      },
    ],
    [user]
  );

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>
          Loading user...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>
          User not found.
        </div>
      </div>
    );
  }

  const metaRows = [
    { label: "Email", value: user.email ?? "-" },
    { label: "Phone", value: user.phone ?? "-" },
    { label: "Username", value: user.username ?? "-" },
    { label: "Role", value: user.role ?? "-" },
  ];

  return (
    <>
      <ViewDetails
        title="User Management"
        subtitle="User profile details"
        backLabel="Back to Users"
        onBack={() => router.push("/users")}
        entity={{
          avatar: user.name?.[0]?.toUpperCase() ?? "?",
          title: user.name,
          subtitle: user.email,
          status: user.isLocked ? "LOCKED" : "ACTIVE",
        }}
        metrics={[
          { label: "Phone", value: user.phone ?? "-" },
          { label: "Role", value: user.role ?? "-" },
        ]}
        actions={[
          {
            label: "Reset Password",
            icon: "lock_reset",
            onClick: () =>
              openConfirmDialog({
                type: "reset-password",
                onConfirm: () => resetUserPassword(user.id),
                title: "Reset Password?",
                message: `Are you sure you want to reset the password for ${user.name}? They will receive an email with instructions to set a new password.`,
              }),
          },
          {
            label: user.isLocked ? "Unlock" : "Lock",
            icon: "lock",
            onClick: () => {
              const isLocking = !user.isLocked;
              openConfirmDialog({
                type: "lock-unlock",
                onConfirm: () =>
                  lockUnlockUser(user.id, !user.isLocked),
                title: isLocking ? "Lock User?" : "Unlock User?",
                message: isLocking
                  ? `Are you sure you want to lock ${user.name}? They will not be able to log in.`
                  : `Are you sure you want to unlock ${user.name}? They will regain access to the system.`,
              });
            },
          },
          {
            label: "Kill Sessions",
            icon: "close",
            onClick: () =>
              openConfirmDialog({
                type: "kill-sessions",
                onConfirm: () => killUserSessions(user.id),
                title: "End All Sessions?",
                message: `Are you sure you want to end all active sessions for ${user.name}? They will be logged out immediately.`,
              }),
          },
          {
            label: "Edit",
            icon: "edit",
            variant: "primary",
            onClick: () => router.push(`/users/edit/${user.id}`),
          },
        ]}
        tabs={tabs}
      />

      <ConfirmDialog
        open={dialogOpen}
        title={pendingAction?.title}
        message={pendingAction?.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={
          pendingAction?.type === "lock-unlock"
            ? user.isLocked
              ? "Unlock"
              : "Lock"
            : pendingAction?.type === "reset-password"
              ? "Reset"
              : "End Sessions"
        }
        cancelText="Cancel"
      />
    </>
  );
}