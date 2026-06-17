"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import ViewDetails, { Action } from "@/app/components/ui/ViewDetails";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

type ProviderLike = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  categoryId?: number;
  hourlyRate?: number;
  location?: string;
  rating?: number;
  isActive?: boolean;
  bio?: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
  };
};

export default function ViewProviderPage() {
  const router = useRouter();
  const params = useParams();

  const providerId = Number(params.id);

  const [provider, setProvider] = useState<ProviderLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const openDeleteDialog = () => {
    if (!provider) return;

    setPendingDelete({
      title: "Delete Provider?",
      message: `Are you sure you want to delete "${provider.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setStoreLoading(true);
          await api.delete(`/api/services/providers/${provider.id}`);
          router.push("/services");
        } catch (error) {
          console.error("Failed to delete provider", error);
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
    if (!providerId || Number.isNaN(providerId)) {
      router.push("/services");
      return;
    }

    let cancelled = false;

    const fetchProvider = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/api/services/providers/${providerId}`);

        if (cancelled) return;

        setProvider((res.data?.provider ?? res.data) as ProviderLike);
      } catch {
        if (!cancelled) setProvider(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProvider();

    return () => {
      cancelled = true;
    };
  }, [providerId, router]);

  const tabs = useMemo(() => {
    return [
      {
        key: "overview",
        label: "Overview",
        table: {
          rows: [
            {
              key: "phone",
              label: "Phone",
              value: provider?.phone ?? "-",
            },
            {
              key: "email",
              label: "Email",
              value: provider?.email ?? "-",
            },
            {
              key: "location",
              label: "Location",
              value: provider?.location ?? "-",
            },
            {
              key: "hourlyRate",
              label: "Hourly Rate",
              value: provider?.hourlyRate ? `ksh ${provider.hourlyRate}` : "-",
            },
            {
              key: "rating",
              label: "Rating",
              value: provider?.rating ?? "-",
            },
            {
              key: "status",
              label: "Active",
              value: provider?.isActive ? "Active" : "Inactive",
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

      {
        key: "category",
        label: "Category",
        table: {
          rows: provider?.category
            ? [
                {
                  id: provider.category.id,
                  name: provider.category.name,
                  slug: provider.category.slug,
                  icon: provider.category.icon ?? "-",
                },
              ]
            : [],
          columns: [
            {
              key: "name",
              header: "Name",
              render: (row: any) => row.name,
            },
            {
              key: "slug",
              header: "Slug",
              render: (row: any) => row.slug,
            },
            {
              key: "icon",
              header: "Icon",
              render: (row: any) => row.icon ?? "-",
            },
          ],
          search: {
            enabled: false,
          },
        },
      },
    ];
  }, [provider]);

const actions = useMemo<Action[]>(
  () => [
    {
      label: "Edit",
      icon: "edit",
      variant: "primary",
      onClick: () => {
        if (!provider?.id) return;
        router.push(`/services/edit/${provider.id}`);
      },
      disabled: storeLoading,
    },
    {
      label: "Delete",
      icon: "delete",
      onClick: openDeleteDialog,
      disabled: storeLoading,
    },
  ],
  [provider, providerId, storeLoading] 
);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#0F52BA" }}>
        Loading...
      </div>
    );
  }

  if (!provider) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Provider not found
      </div>
    );
  }

  return (
    <>
      <ViewDetails
        title="Provider Details"
        subtitle="View provider profile, services, and category"

        onBack={() => router.push("/services")}
        backLabel="Back to Providers"

        entity={{
          avatar: provider.name?.charAt(0)?.toUpperCase() ?? "P",
          title: provider.name ?? "Unnamed Provider",
          subtitle: provider.category?.name ?? provider.location ?? "",
          status: provider.isActive ? "active" : "inactive",
        }}

        metrics={[
          {
            label: "Rating",
            value: provider.rating ?? "-",
          },
          {
            label: "Hourly Rate",
            value: provider.hourlyRate ? `ksh ${provider.hourlyRate}` : "-",
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