"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import ViewDetails, { Action } from "@/app/components/ui/ViewDetails";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

type RoleLike = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  permissions?: any[];
  status?: string;
};

export default function ViewRolePage() {
  const router = useRouter();
  const params = useParams();

  const roleId = Number(params.id);

  const [role, setRole] = useState<RoleLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
} | null>(null);

const openDeleteDialog = () => {
  if (!role) return;

  setPendingDelete({
    title: "Delete Role?",
    message: `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
    onConfirm: async () => {
      try {
        setStoreLoading(true);

        await api.delete(`/api/roles/${role.id}`);

        router.push("/roles");
      } catch (error) {
        console.error("Failed to delete role", error);
      } finally {
        setStoreLoading(false);
      }
    },
  });

  setDialogOpen(true);
};

const handleConfirm = async () => {
  if (!pendingDelete) return;

  await pendingDelete.onConfirm();

  setDialogOpen(false);
  setPendingDelete(null);
};

const handleCancel = () => {
  setDialogOpen(false);
  setPendingDelete(null);
};

  useEffect(() => {
    if (!roleId || Number.isNaN(roleId)) {
      router.push("/roles");
      return;
    }

    let cancelled = false;

    const fetchRole = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/roles/${roleId}`);

        if (cancelled) return;

        setRole((res.data?.role ?? res.data) as RoleLike);
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [roleId, router]);

  const permissions = role?.permissions ?? [];

  const tabs = useMemo(() => {
    return [
      {
        key: "permissions",
        label: "Permissions",
        table: {
          rows: permissions.map((p: any, i: number) => ({
            id: i + 1,
            label: p.label ?? p.key ?? p,
            key: p.key ?? p,
            group: p.group ?? "-",
            category: p.category ?? "-",
          })),
          columns: [
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
          ],
          search: {
            enabled: true,
            placeholder: "Search permissions...",
            getSearchText: (row: any) =>
              `${row.label ?? ""} ${row.key ?? ""} ${row.group ?? ""} ${row.category ?? ""}`,
          },
        },
      },

      {
        key: "meta",
        label: "Role Meta",
        table: {
          rows: [
            {
              key: "name",
              label: "Role Name",
              value: role?.name ?? "-",
            },
            {
              key: "code",
              label: "Role Code",
              value: role?.code ?? "-",
            },
            {
              key: "description",
              label: "Description",
              value: role?.description ?? "No description",
            },
            {
              key: "permissionsCount",
              label: "Permissions Count",
              value: permissions.length,
            },
            {
              key: "status",
              label: "Status",
              value: role?.status ?? "-",
            },
          ],
          columns: [
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
          ],
          search: {
            enabled: false,
          },
          pagination: {
            enabled: false,
            defaultPageSize: 10,
            pageSizeOptions: [10],
          },
        },
      },
    ];
  }, [permissions, role]);

const actions = useMemo<Action[]>(() => [
  {
    label: "Edit",
    icon: "edit",
    variant: "primary",
    onClick: () => router.push(`/roles/edit/${roleId}`),
    disabled: storeLoading,
  },
  {
    label: "Delete",
    icon: "delete",
    onClick: openDeleteDialog,
    disabled: storeLoading,
  },
], [router, roleId, role, storeLoading]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#0F52BA" }}>
        Loading...
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Role not found
      </div>
    );
  }

  return (
    <>
    <ViewDetails
      title="Role Details"
      subtitle="View role configuration and permissions"

      onBack={() => router.push("/roles")}
      backLabel="Back to Roles"

      entity={{
        avatar: role.name?.charAt(0)?.toUpperCase() ?? "R",
        title: role.name ?? "Unnamed Role",
        subtitle: role.code ?? "",
        status: role.status ?? "active",
      }}

      metrics={[
        {
          label: "Permissions",
          value: permissions.length,
        },
        {
          label: "Role Code",
          value: role.code ?? "-",
        },
      ]}

      actions={actions}
      tabs={tabs}
    />

    <ConfirmDialog
      open={dialogOpen}
      title={pendingDelete?.title}
      message={pendingDelete?.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText="Delete"
      cancelText="Cancel"
    />
    </>
  );
}