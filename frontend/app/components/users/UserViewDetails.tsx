"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ViewDetailsLayout from "../shared/ViewDetailsLayout";
import DynamicTable from "../ui/DynamicTable";
import { useAdminStore } from "@/app/store/adminStore";

type UserLike = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  username?: string;
  createdAt?: string;
  isLocked?: boolean;
  role?: string;
};

type DialogAction = "lock" | "unlock" | "killSessions" | "resetPassword" | null;

type TabKey = "audit" | "permissions" | "assigned";

const tabs: { key: TabKey; label: string }[] = [
  { key: "audit", label: "Audit Trail" },
  { key: "permissions", label: "Permissions" },
  { key: "assigned", label: "Assigned Properties" },
];

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUnlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconKill = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default function UserViewDetails({ user: initialUser }: { user: UserLike | null }) {
  const router = useRouter();
  const { lockUnlockUser, killUserSessions, resetUserPassword, loading: storeLoading } = useAdminStore();

  const [user, setUser] = useState<UserLike | null>(initialUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);

  // Keep state in sync with prop changes
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const locked = Boolean(user?.isLocked);
  const initials = (user?.name ?? "?").charAt(0).toUpperCase();

  const openDialog = (action: Exclude<DialogAction, null>) => {
    if (!user?.id) return;
    setSelectedUserId(user.id);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
    setDialogAction(null);
  };

  const confirmAction = async () => {
    if (selectedUserId == null || !dialogAction || !user) return;

    if (dialogAction === "lock") {
      await lockUnlockUser(selectedUserId, true);
      setUser({ ...user, isLocked: true });
    } else if (dialogAction === "unlock") {
      await lockUnlockUser(selectedUserId, false);
      setUser({ ...user, isLocked: false });
    } else if (dialogAction === "killSessions") {
      await killUserSessions(selectedUserId);
    } else if (dialogAction === "resetPassword") {
      await resetUserPassword(selectedUserId);
    }

    closeDialog();
  };

  const tabsContent = useMemo(() => {
    return (
      tabs as { key: TabKey; label: string }[]
    ).map((t) => {
      const content =
        t.key === "audit" ? (
          <DynamicTable<any>
            key="audit-table"
            rows={(user as any)?.auditTrail ?? []}
            getRowId={(r) => r.id ?? `${r.type ?? "audit"}-${r.createdAt ?? ""}`}
            columns={
              [
                {
                  key: "createdAt",
                  header: "Date",
                  render: (row: any) =>
                    row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
                  sortValue: (row: any) =>
                    row.createdAt ? new Date(row.createdAt).getTime() : 0,
                },
                {
                  key: "action",
                  header: "Action",
                  render: (row: any) => row.action ?? row.type ?? "-",
                  sortValue: (row: any) =>
                    String(row.action ?? row.type ?? ""),
                },
                {
                  key: "actor",
                  header: "Actor",
                  render: (row: any) => row.actor ?? row.performedBy ?? "-",
                },
                {
                  key: "details",
                  header: "Details",
                  render: (row: any) => row.details ?? row.metadata ?? "-",
                },
              ] as any
            }
            search={{ enabled: true, placeholder: "Search audit..." }}
            pagination={{ enabled: true, defaultPageSize: 5, pageSizeOptions: [5, 10, 20, 50, 100] }}
            noRecordsMessage="No audit trail entries"
          />
        ) : t.key === "permissions" ? (
          <DynamicTable<any>
            key="permissions-table"
            rows={(user as any)?.permissions ?? (user as any)?.role?.permissions ?? []}
            getRowId={(r) => r.id ?? `${r.key ?? r.name ?? "perm"}-${r.grantedAt ?? ""}`}
            columns={
              [
                {
                  key: "key",
                  header: "Permission",
                  render: (row: any) => row.key ?? row.name ?? "-",
                  sortValue: (row: any) => String(row.key ?? row.name ?? ""),
                },
                {
                  key: "description",
                  header: "Description",
                  render: (row: any) => row.label ?? row.description ?? "-",
                },
                {
                  key: "source",
                  header: "Source",
                  render: (row: any) => row.source ?? row.grantedBy ?? row.role ?? "Role",
                },
              ] as any
            }
            search={{ enabled: true, placeholder: "Search permissions..." }}
            pagination={{ enabled: true, defaultPageSize: 5, pageSizeOptions: [5, 10, 20, 50, 100] }}
            noRecordsMessage="No permissions assigned"
          />
        ) : (
          <DynamicTable<any>
            key="assigned-table"
            rows={(user as any)?.userProperties ?? []}
            getRowId={(r) => r.id ?? r.propertyId ?? r.slug ?? JSON.stringify(r)}
            columns={
              [
                {
                  key: "property",
                  header: "Property",
                  render: (row: any) => row.property?.title ?? "-",
                  sortValue: (row: any) => String(row.property?.title ?? ""),
                },
                {
                  key: "location",
                  header: "Location",
                  render: (row: any) => row.property?.location ?? "-",
                },
                {
                  key: "role",
                  header: "Role",
                  render: (row: any) => row.role?.name ?? "-",
                },
              ] as any
            }
            search={{ enabled: true, placeholder: "Search properties..." }}
            pagination={{ enabled: true, defaultPageSize: 5, pageSizeOptions: [5, 10, 20, 50, 100] }}
            noRecordsMessage="No assigned properties"
          />
        );

      return {
        key: t.key,
        label: t.label,
        content,
      };
    });
  }, [user]);

  const dialogMeta: Record<Exclude<DialogAction, null>, { title: string; message: string; confirmText: string }> = {
    lock: {
      title: "Lock User",
      message: "This will lock the user account and invalidate their sessions.",
      confirmText: "Lock",
    },
    unlock: {
      title: "Unlock User",
      message: "This will unlock the user account.",
      confirmText: "Unlock",
    },
    killSessions: {
      title: "Kill User Sessions",
      message: "This will terminate all active sessions for this user.",
      confirmText: "Kill",
    },
    resetPassword: {
      title: "Reset User Password",
      message: "This will reset the user password and email the new password.",
      confirmText: "Reset",
    },
  };

  if (!user) {
    return (
      <ViewDetailsLayout
        header={{
          title: "Users Management",
          subtitle: "User details",
          backHref: "/users",
          backLabel: "← Back",
        }}
        identity={{ avatarText: "?", displayTitle: "User not found" }}
        dataBoxes={[]}
        actions={[]}
        tabs={[]}
        tabsTitle=""
        initialTabKey={"audit"}
        emptyFallback={
          <div style={{ padding: "60px", textAlign: "center", color: "#00F0FF" }}>
            User not found
          </div>
        }
      />
    );
  }

  return (
    <ViewDetailsLayout
      header={{
        title: "Users Management",
        subtitle: "User details",
        backHref: "/users",
        backLabel: "← Back",
      }}
      identity={{
        avatarText: initials,
        displayTitle: user.name || "-",
        badgeText: locked ? "LOCKED" : "ACTIVE",
        badgeTone: locked ? "locked" : "active",
      }}
      dataBoxes={[
        {
          rows: [
            { label: "Email", value: user.email || "-" },
            { label: "Phone", value: user.phone || "-" },
          ],
        },
        {
          rows: [
            { label: "Username", value: user.username || "-" },
            {
              label: "Created At",
              value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-",
            },
          ],
        },
      ]}
      actions={[
        {
          key: "edit",
          label: "Edit",
          icon: <IconEdit />,
          onClick: () => router.push(`/users/edit/${user.id}`),
          disabled: storeLoading,
        },
        {
          key: locked ? "unlock" : "lock",
          label: locked ? "Unlock" : "Lock",
          icon: locked ? <IconUnlock /> : <IconLock />,
          onClick: () => openDialog(locked ? "unlock" : "lock"),
          disabled: storeLoading,
        },
        {
          key: "resetPassword",
          label: "Reset Password",
          icon: <IconReset />,
          onClick: () => openDialog("resetPassword"),
          disabled: storeLoading,
        },
        {
          key: "killSessions",
          label: "Kill Sessions",
          icon: <IconKill />,
          onClick: () => openDialog("killSessions"),
          disabled: storeLoading,
        },
      ]}
      tabsTitle="User Audit & Access"
      tabs={tabsContent as any}
      initialTabKey={"audit"}
      confirm={
        dialogAction
          ? {
              open: dialogOpen,
              title: dialogMeta[dialogAction].title,
              message: dialogMeta[dialogAction].message,
              confirmText: dialogMeta[dialogAction].confirmText,
              onConfirm: confirmAction,
              onCancel: closeDialog,
            }
          : null
      }
    />
  );
}

