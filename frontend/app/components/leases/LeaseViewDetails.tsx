"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicTable from "../ui/DynamicTable";
import type { Lease } from "@/types/lease";
import { useAdminStore } from "@/app/store/adminStore";
import ViewDetailsLayout, { TabKey } from "../shared/ViewDetailsLayout";

type LeaseLike = Lease;

type DialogAction = "terminate" | "null";

export default function LeaseViewDetails({
  lease: initialLease,
}: {
  lease: LeaseLike | null;
}) {
  const router = useRouter();
  const { loading: storeLoading } = useAdminStore();

  const [lease, setLease] = useState<LeaseLike | null>(initialLease);
  const [tabKey, setTabKey] = useState<TabKey>("tenants");

  useEffect(() => {
    setLease(initialLease);
  }, [initialLease]);

  const tabs = useMemo(
    () => [
      { key: "tenants" as const, label: "Tenants" },
      { key: "meta" as const, label: "Lease Meta" },
    ],
    []
  );

  const isActive = Boolean(lease?.status === "active");
  const initials = (lease?.property?.title ?? "?").charAt(0).toUpperCase();

  if (!lease) {
    return <ViewDetailsLayout
      header={{
        title: "Leases Management",
        subtitle: "Lease details",
        backHref: "/leases",
        backLabel: "← Back",
      }}
      identity={{ avatarText: "?", displayTitle: "Lease not found" }}
      dataBoxes={[]}
      actions={[]}
      tabs={[]}
      tabsTitle=""
      initialTabKey={"tenants"}
      emptyFallback={
        <div style={{ padding: "60px", textAlign: "center", color: "#00F0FF" }}>
          Lease not found
        </div>
      }
    />;
  }

  const leaseMetaRows = [
    {
      key: "rent",
      label: "Rent",
      value: `${lease.rentAmount?.toLocaleString?.() ?? "-"} KES`,
    },
    {
      key: "late",
      label: "Late Fee %",
      value: `${lease.lateFeePercent ?? 0}%`,
    },
    {
      key: "grace",
      label: "Grace Days",
      value: `${lease.graceDays ?? 0} days`,
    },
    {
      key: "signed",
      label: "Signed Document",
      value: lease.signedDocumentUrl ? "Uploaded" : "Not uploaded",
    },
  ];

  return (
    <ViewDetailsLayout
      header={{
        title: "Leases Management",
        subtitle: "Lease details",
        backHref: "/leases",
        backLabel: "← Back",
      }}
      identity={{
        avatarText: initials,
        displayTitle: lease.property?.title || "-",
        badgeText: lease.status ? lease.status.toUpperCase() : "-",
        badgeTone: isActive ? "active" : "neutral",
      }}
      dataBoxes={[
        {
          rows: [
            {
              label: "Start Date",
              value: lease.startDate
                ? new Date(lease.startDate).toLocaleDateString()
                : "-",
            },
            {
              label: "End Date",
              value: lease.endDate
                ? new Date(lease.endDate).toLocaleDateString()
                : "-",
            },
          ],
        },
        {
          rows: [
            {
              label: "Rent (KES)",
              value: lease.rentAmount?.toLocaleString?.() ?? "-",
            },
            { label: "Cycle", value: lease.billingCycle || "-" },
          ],
        },
      ]}
      actions={[
        {
          key: "edit",
          label: "Edit",
          icon: (
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
          ),
          onClick: () => router.push(`/leases/${lease.id}`),
          disabled: storeLoading,
        },
        {
          key: "print",
          label: "Print",
          icon: (
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          ),
          onClick: () => router.push(`/leases/${lease.id}/print`),
          disabled: storeLoading,
        },
        {
          key: "signed",
          label: "Signed Upload",
          icon: (
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          ),
          onClick: () => router.push(`/leases/${lease.id}`),
          disabled: storeLoading,
        },
      ]}
      tabsTitle="Lease Tenants & Meta"
      tabs={[
        {
          key: "tenants",
          label: "Tenants",
          content: (
            <DynamicTable<any>
              key="lease-tenants-table"
              rows={lease.tenants ?? []}
              getRowId={(r) => r.tenantId ?? r.id ?? JSON.stringify(r)}
              columns={
                [
                  {
                    key: "name",
                    header: "Tenant",
                    render: (row: any) => row.tenant?.name ?? "-",
                    sortValue: (row: any) =>
                      String(row.tenant?.name ?? ""),
                  },
                  {
                    key: "email",
                    header: "Email",
                    render: (row: any) => row.tenant?.email ?? "-",
                  },
                  {
                    key: "phone",
                    header: "Phone",
                    render: (row: any) => row.tenant?.phone ?? "-",
                  },
                ] as any
              }
              search={{ enabled: true, placeholder: "Search tenants..." }}
              pagination={{
                enabled: true,
                defaultPageSize: 5,
                pageSizeOptions: [5, 10, 20, 50, 100],
              }}
              noRecordsMessage="No tenants on this lease"
            />
          ),
        },
        {
          key: "meta",
          label: "Lease Meta",
          content: (
            <DynamicTable<any>
              key="lease-meta-table"
              rows={leaseMetaRows}
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
              noRecordsMessage="No lease metadata"
            />
          ),
        },
      ]}
      initialTabKey={tabKey}
      confirm={null}
    />
  );
}

