"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import type { Lease } from "@/types/lease";
import ViewDetails from "@/app/components/ui/ViewDetails";

export default function LeaseViewPage() {
  const params = useParams();
  const router = useRouter();

  const leaseId = Number(params?.id);

  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leaseId || Number.isNaN(leaseId)) return;

    const fetchLease = async () => {
      try {
        const res = await api.get(`/api/leases/${leaseId}`);
        setLease(res.data.lease as Lease);
      } catch (err) {
        console.error("Failed to fetch lease:", err);
        setLease(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLease();
  }, [leaseId]);

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>
          Loading lease...
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>
          Lease not found.
        </div>
      </div>
    );
  }

  const startDate = lease.startDate
    ? new Date(lease.startDate).toLocaleDateString()
    : "-";

  const endDate = lease.endDate
    ? new Date(lease.endDate).toLocaleDateString()
    : "-";

  const tenantColumns = [
    {
      key: "name",
      header: "Tenant",
      render: (r: any) => r?.tenant?.name ?? "-",
    },
    {
      key: "email",
      header: "Email",
      render: (r: any) => r?.tenant?.email ?? "-",
    },
    {
      key: "phone",
      header: "Phone",
      render: (r: any) => r?.tenant?.phone ?? "-",
    },
  ];

  const metaRows = [
    {
      key: "rent",
      label: "Rent",
      value: `Ksh ${lease.rentAmount?.toLocaleString() ?? "-"}`,
    },
    {
      key: "late",
      label: "Late Fee %",
      value: `${lease.lateFeePercent ?? 0}%`,
    },
    {
      key: "grace",
      label: "Grace Days",
      value: lease.graceDays ?? 0,
    },
    {
      key: "signed",
      label: "Signed",
      value: lease.signedDocumentUrl ? "Verified" : "Not Uploaded",
    },
  ];

  const metaColumns = [
    {
      key: "label",
      header: "Field",
      render: (r: any) => r.label,
    },
    {
      key: "value",
      header: "Value",
      render: (r: any) => r.value,
    },
  ];

  return (
    <ViewDetails
      title="Lease Management"
      subtitle="Detailed lease agreement"
      backLabel="Back to Leases"
      onBack={() => router.push("/leases")}
      entity={{
        avatar: lease.property?.title?.[0] ?? "?",
        title: lease.property?.title ?? "",
        subtitle: lease.property?.location ?? "",
        status: lease.status,
      }}
      metrics={[
        {
          label: "Lease Period",
          value: `${startDate} → ${endDate}`,
        },
        {
          label: "Monthly Rent",
          value: `Ksh ${lease.rentAmount?.toLocaleString() ?? "-"}`,
        },
      ]}
      actions={[
        {
          label: "Print",
          icon: "print",
          onClick: () => router.push(`/leases/${lease.id}/print`),
        },
        {
          label: "Signed Upload",
          icon: "upload_file",
          onClick: () => router.push(`/leases/${lease.id}/upload`),
        },
        {
          label: "Edit Lease",
          icon: "edit",
          variant: "primary",
          onClick: () => router.push(`/leases/${lease.id}`),
        },
      ]}
      tabs={[
        {
          key: "tenants",
          label: "Tenants",
          table: {
            rows: lease.tenants ?? [],
            columns: tenantColumns,
          },
        },
        {
          key: "meta",
          label: "Lease Meta",
          table: {
            rows: metaRows,
            columns: metaColumns,
            search: false,
          },
        },
      ]}
    />
  );
}