"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ViewDetailsLayout, { type TabKey } from "../shared/ViewDetailsLayout";
import DynamicTable from "../ui/DynamicTable";
import { Permission, useAdminStore } from "@/app/store/adminStore";

type RoleLike = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
};

type DialogAction = "delete" | null;

const IconEdit = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function RoleViewDetails({
  role: initialRole,
}: {
  role: RoleLike | null;
}) {
  const router = useRouter();
  const {
    permissions: allPermissions,
    fetchPermissionsFromDb,
    deleteRole,
    loading: storeLoading,
  } = useAdminStore();

  const [role, setRole] = useState<RoleLike | null>(initialRole);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);

  // Keep state in sync with prop changes
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  // Ensure permissions are loaded so we can resolve labels
  useEffect(() => {
    if (!allPermissions || allPermissions.length === 0) {
      fetchPermissionsFromDb();
    }
  }, [allPermissions, fetchPermissionsFromDb]);

  const initials = (role?.name ?? "?").charAt(0).toUpperCase();
  const isAdmin = (role?.permissions ?? []).includes("*");

  const resolvedPermissions = useMemo(() => {
    const keys = role?.permissions ?? [];
    if (keys.includes("*")) {
      return (allPermissions ?? []).map((p: Permission) => ({
        id: p.key,
        key: p.key,
        label: p.label,
        group: p.group,
        category: p.category,
      }));
    }
    return keys.map((k) => {
      const p = (allPermissions ?? []).find((x) => x.key === k);
      return {
        id: k,
        key: k,
        label: p?.label ?? k,
        group: p?.group ?? "—",
        category: p?.category ?? "—",
      };
    });
  }, [role, allPermissions]);

  const openDialog = (action: Exclude<DialogAction, null>) => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
  };

  const confirmAction = async () => {
    if (!role?.id || !dialogAction) return;
    if (dialogAction === "delete") {
      await deleteRole(role.id);
      closeDialog();
      router.push("/roles");
      return;
    }
    closeDialog();
  };

  if (!role) {
    return (
      <ViewDetailsLayout
        header={{
          title: "Roles & Permissions",
          subtitle: "Role details",
          backHref: "/roles",
          backLabel: "← Back",
        }}
        identity={{ avatarText: "?", displayTitle: "Role not found" }}
        dataBoxes={[]}
        actions={[]}
        tabs={[]}
        tabsTitle=""
        initialTabKey={"permissions" satisfies TabKey}
        emptyFallback={
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#00F0FF",
            }}
          >
            Role not found
          </div>
        }
      />
    );
  }

  const tabsContent = useMemo(() => {
    const list: { key: TabKey; label: string; content: React.ReactNode }[] = [
      {
        key: "permissions",
        label: "Permissions",
        content: (
          <DynamicTable<any>
            key="role-permissions-table"
            rows={resolvedPermissions}
            getRowId={(r) => r.id ?? r.key}
            columns={
              [
                {
                  key: "label",
                  header: "Permission",
                  render: (row: any) => row.label ?? row.key ?? "-",
                  sortValue: (row: any) => String(row.label ?? row.key ?? ""),
                },
                {
                  key: "key",
                  header: "Key",
                  render: (row: any) => row.key ?? "-",
                },
                {
                  key: "group",
                  header: "Group",
                  render: (row: any) => row.group ?? "-",
                },
                {
                  key: "category",
                  header: "Category",
                  render: (row: any) => row.category ?? "-",
                },
              ] as any
            }
            search={{ enabled: true, placeholder: "Search permissions..." }}
            pagination={{
              enabled: true,
              defaultPageSize: 5,
              pageSizeOptions: [5, 10, 20, 50, 100],
            }}
            noRecordsMessage="No permissions assigned"
          />
        ),
      },
      {
        key: "meta",
        label: "Role Meta",
        content: (
          <DynamicTable<any>
            key="role-meta-table"
            rows={[
              {
                key: "name",
                label: "Role Name",
                value: role.name || "-",
              },
              {
                key: "code",
                label: "Role Code",
                value: role.code || "-",
              },
              {
                key: "description",
                label: "Description",
                value: role.description || "No description",
              },
              {
                key: "permissionsCount",
                label: "Permissions Count",
                value: isAdmin
                  ? `${resolvedPermissions.length} (All)`
                  : `${resolvedPermissions.length}`,
              },
              {
                key: "status",
                label: "Access Level",
                value: isAdmin ? "Full Access" : "Scoped",
              },
            ]}
            getRowId={(r) => r.key}
            columns={
              [
                {
                  key: "label",
                  header: "Field",
                  render: (row: any) => row.label ?? "-",
                },
                {
                  key: "value",
                  header: "Value",
                  render: (row: any) => row.value ?? "-",
                },
              ] as any
            }
            search={{ enabled: false }}
            pagination={{ enabled: false, pageSizeOptions: [5], defaultPageSize: 5 }}
            noRecordsMessage="No metadata"
          />
        ),
      },
    ];

    return list;
  }, [role, resolvedPermissions, isAdmin]);

  return (
    <ViewDetailsLayout
      header={{
        title: "Roles & Permissions",
        subtitle: "Role details",
        backHref: "/roles",
        backLabel: "← Back",
      }}
      identity={{
        avatarText: initials,
        displayTitle: role.name || "-",
        badgeText: isAdmin ? "FULL ACCESS" : "SCOPED",
        badgeTone: isAdmin ? "active" : "neutral",
      }}
      dataBoxes={[
        {
          rows: [
            { label: "Role Code", value: role.code || "-" },
            {
              label: "Description",
              value: role.description || "No description",
            },
          ],
        },
        {
          rows: [
            {
              label: "Permissions",
              value: isAdmin
                ? `All (${resolvedPermissions.length})`
                : `${resolvedPermissions.length} assigned`,
            },
            {
              label: "Access Level",
              value: isAdmin ? "Full Access" : "Scoped",
            },
          ],
        },
      ]}
      actions={[
        {
          key: "edit",
          label: "Edit",
          icon: <IconEdit />,
          onClick: () => router.push(`/roles/edit/${role.id}`),
          disabled: storeLoading,
        },
        {
          key: "delete",
          label: "Delete",
          icon: <IconTrash />,
          onClick: () => openDialog("delete"),
          disabled: storeLoading,
        },
      ]}
      tabsTitle="Role Permissions & Meta"
      tabs={tabsContent as any}
      initialTabKey={"permissions" satisfies TabKey}
      confirm={
        dialogAction
          ? {
              open: dialogOpen,
              title: "Delete Role",
              message:
                "Are you sure you want to delete this role? This action cannot be undone.",
              confirmText: "Delete",
              onConfirm: confirmAction,
              onCancel: closeDialog,
            }
          : null
      }
    />
  );
}
