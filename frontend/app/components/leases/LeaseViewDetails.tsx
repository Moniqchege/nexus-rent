"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";
import DynamicTable from "../ui/DynamicTable";
import type { Lease } from "@/types/lease";
import { useAdminStore } from "@/app/store/adminStore";

type LeaseLike = Lease;

type DialogAction = "terminate" | "null";

type TabKey = "tenants" | "meta";

const C = {
  blue: "#2A5CAA",
  cyan: "#00F0FF",
  bgPage: "#0D1117",
  bgCard: "#111827",
  bgCardAlt: "rgba(0,165,228,0.06)",
  border: "#1E3A5F",
  borderCyan: "rgba(0,165,228,0.35)",
  textPrimary: "#E2E8F0",
  textMuted: "#94A3B8",
  textLabel: "#64748B",
  white: "#FFFFFF",
} as const;

const s = {
  page: {
    minHeight: "100vh",
    paddingLeft: "0px",
    paddingTop: "20px",
    backgroundColor: C.bgPage,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "padding-left 0.3s",
  } as React.CSSProperties,

  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px 40px",
  } as React.CSSProperties,

  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  } as React.CSSProperties,

  heading: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: C.cyan,
    textTransform: "uppercase" as const,
  },

  subheading: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: C.textMuted,
  } as React.CSSProperties,

  backBtn: {
    background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "12px 24px",
    fontSize: "14px",
  } as React.CSSProperties,

infoCard: {
  display: "flex",
  flexDirection: "column", 
  gap: "12px",
  marginBottom: "12px",
  backgroundColor: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: "12px",
  padding: "16px",
} as React.CSSProperties,

  avatarWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: C.blue,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "18px",
    color: C.white,
    fontWeight: 700,
  } as React.CSSProperties,

  nameBlock: {
    display: "flex",
    flexDirection: "column" as const,
    marginLeft: "8px",
    minWidth: 0,
  },

  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: C.cyan,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  },

  statusBadge: (active: boolean): React.CSSProperties => ({
    marginTop: "4px",
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: "999px",
    textAlign: "center",
    color: active ? "#00F0FF" : "#000",
    backgroundColor: active ? "transparent" : "#00F0FF",
    border: `1px solid ${"#00F0FF"}`,
  }),

  columnsWrap: {
  display: "flex",
  flexDirection: "row",
  gap: "12px",
  flexWrap: "wrap",
  width: "100%",
} as React.CSSProperties,

  dataBox: {
    flex: 1,
    minWidth: "320px",
    border: `1px solid ${C.borderCyan}`,
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: C.bgCardAlt,
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  dataLabel: {
    fontSize: "11px",
    fontWeight: 400,
    color: C.textLabel,
    minWidth: "90px",
  } as React.CSSProperties,

  dataValue: {
    fontSize: "11px",
    fontWeight: 600,
    color: C.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: "200px",
    textAlign: "right" as const,
  } as React.CSSProperties,

  actionsWrap: {
    marginLeft: "auto",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },

  topRow: {
  display: "flex",
  alignItems: "stretch",
  gap: "12px",
  flexWrap: "wrap",
} as React.CSSProperties,

identityBlock: {
  display: "flex",
  alignItems: "center",
  gap: "10px",
//   minWidth: "0px",
  flex: "1",
} as React.CSSProperties,

  actionBtn: {
    background: "rgba(0, 240, 255, 0.05)",
    color: "var(--neon-blue)",
    border: "1px solid rgba(0, 240, 255, 0.25)",
    borderRadius: "10px",
    padding: "8px 16px",
    fontSize: "12px",
    fontFamily: `'Orbitron', monospace`,
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s ease",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  } as React.CSSProperties,

  emptyCard: {
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "60px",
    textAlign: "center" as const,
  } as React.CSSProperties,
};

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

const IconDocs = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function LeaseViewDetails({ lease: initialLease }: { lease: LeaseLike | null }) {
  const router = useRouter();
  const { loading: storeLoading } = useAdminStore();

  const [lease, setLease] = useState<LeaseLike | null>(initialLease);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);

  const [tab, setTab] = useState<TabKey>("tenants");

  useEffect(() => {
    setLease(initialLease);
  }, [initialLease]);

  const isActive = Boolean(lease?.status === "active");

  const tabs = useMemo(
    () =>
      [
        { key: "tenants" as const, label: "Tenants" },
        { key: "meta" as const, label: "Lease Meta" },
      ] as const,
    []
  );

  const openDialog = (action: Exclude<DialogAction, null>) => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogAction(null);
  };

  const confirmAction = async () => {
    closeDialog();
  };

  if (!lease) {
    return (
      <section style={s.page}>
        <div style={s.inner}>
          <div style={s.emptyCard}>
            <span style={{ color: C.cyan, fontSize: "15px" }}>Lease not found</span>
          </div>
        </div>
      </section>
    );
  }

  const initials = (lease.property?.title ?? "?").charAt(0).toUpperCase();

  return (
    <section style={{ ...s.page, paddingLeft: "0px" }}>
      <div style={s.inner}>
        <div style={s.topBar}>
          <div>
            <h4 style={s.heading}>Leases Management</h4>
            <p style={s.subheading}>Lease details</p>
          </div>

          <button
            type="button"
            style={s.backBtn}
            onClick={() => router.push("/leases")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e4d99")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.blue)}
          >
            ← Back
          </button>
        </div>

        <div style={s.infoCard}>

  {/* ROW 1: avatar + boxes */}
  <div style={s.topRow}>
    
    {/* Avatar + Title */}
    <div style={s.identityBlock}>
      <div style={s.avatarWrap}>{initials}</div>
      <div style={s.nameBlock}>
        <h4 style={s.userName}>{lease.property?.title || "-"}</h4>
        <span style={s.statusBadge(isActive)}>
          {lease.status ? lease.status.toUpperCase() : "-"}
        </span>
      </div>
    </div>

    {/* Box 1 */}
    <div style={s.dataBox}>
      {[
        ["Start Date", lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "-"],
        ["End Date", lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "-"],
      ].map(([label, value]) => (
        <div key={label} style={s.dataRow}>
          <span style={s.dataLabel}>{label}</span>
          <span style={s.dataValue}>{value}</span>
        </div>
      ))}
    </div>

    {/* Box 2 */}
    <div style={s.dataBox}>
      {[
        ["Rent (KES)", lease.rentAmount?.toLocaleString?.() ?? "-"],
        ["Cycle", lease.billingCycle || "-"],
      ].map(([label, value]) => (
        <div key={label} style={s.dataRow}>
          <span style={s.dataLabel}>{label}</span>
          <span style={s.dataValue}>{value}</span>
        </div>
      ))}
    </div>
<div style={s.actionsWrap}>
            {[{ label: "Edit", icon: <IconEdit />, action: () => router.push(`/leases/${lease.id}`) }].map(
              ({ label, icon, action }) => (
                <button
                  key={label}
                  type="button"
                  style={s.actionBtn}
                  onClick={action}
                  disabled={storeLoading}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 165, 228, 0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 240, 255, 0.05)";
                  }}
                >
                  {icon}
                  {label}
                </button>
              )
            )}

            <button
              type="button"
              style={s.actionBtn}
              onClick={() => router.push(`/leases/${lease.id}/print`)}
              disabled={storeLoading}
            >
              <IconDocs />
              Print
            </button>

            <button
              type="button"
              style={s.actionBtn}
              onClick={() => router.push(`/leases/${lease.id}`)}
              disabled={storeLoading}
            >
              <IconArrow />
              Signed Upload
            </button>
          </div>
  </div>
</div>

        {/* Tabs */}
        <div
          style={{
            marginTop: 12,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: C.bgCard,
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.blue }}>Lease Tenants & Meta</h4>
          </div>

          <div style={{ paddingTop: 10, paddingLeft: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tabs.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: `1px solid ${active ? "rgba(0,165,228,0.55)" : C.border}`,
                    background: active ? "rgba(0,165,228,0.12)" : "rgba(0,0,0,0.15)",
                    color: active ? C.cyan : C.textMuted,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: 16 }}>
            {tab === "tenants" && (
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
                      sortValue: (row: any) => String(row.tenant?.name ?? ""),
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
                pagination={{ enabled: true, defaultPageSize: 5, pageSizeOptions: [5, 10, 20, 50, 100] }}
                noRecordsMessage="No tenants on this lease"
              />
            )}

            {tab === "meta" && (
              <DynamicTable<any>
                key="lease-meta-table"
                rows={[
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
                ]}
                getRowId={(r) => r.key}
                columns={
                  [
                    { key: "label", header: "Field", render: (row: any) => row.label ?? "-" },
                    { key: "value", header: "Value", render: (row: any) => row.value ?? "-" },
                  ] as any
                }
                search={{ enabled: false }}
                pagination={{ enabled: false, pageSizeOptions: [5], defaultPageSize: 5 }}
                noRecordsMessage="No lease metadata"
              />
            )}
          </div>
        </div>
      </div>

      {dialogAction && (
        <ConfirmDialog
          open={dialogOpen}
          title="Lease action"
          message="This action is not implemented yet."
          onConfirm={confirmAction}
          onCancel={closeDialog}
          confirmText="Ok"
        />
      )}
    </section>
  );
}

