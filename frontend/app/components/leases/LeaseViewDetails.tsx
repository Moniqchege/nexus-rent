"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicTable from "../ui/DynamicTable";
import type { Lease } from "@/types/lease";
import { useAdminStore } from "@/app/store/adminStore";

type LeaseLike = Lease;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fcf8ff",
    color: "#1b1b24",
    fontFamily: "Inter, sans-serif",
  },

  container: {
    padding: "24px 32px",
  },

  back: {
    color: "#0F52BA",
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: "16px",
    display: "inline-block",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    fontSize: "26px",
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    color: "#464555",
    marginTop: "6px",
    fontSize: "16px",
  },

  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  btnFlex: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
},

icon: {
  fontSize: "16px",   
  lineHeight: "1",
  display: "inline-flex",
},

  btn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #c7c4d8",
    background: "#ffffff",
    cursor: "pointer",
  },

  btnPrimary: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#2aabe4",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(53,37,205,0.15)",
  },

  card: {
  marginTop: "24px",
  background: "#ffffff",
  border: "1px solid #c7c4d8",
  borderRadius: "16px",
  padding: "20px 28px",

  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "24px",
},

divider: {
  width: "1px",
  height: "70%",
  background: "#E5E7EB",   
  justifySelf: "center",
  alignSelf: "center",
  opacity: 0.9,
},

  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "#0F52BA",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: 700,
  },

 badge: {
  padding: "4px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 400,

  color: "#16a34a",          
  border: "1px solid #F2F3F5", 

  background: "#F2F3F5",  
  letterSpacing: "0.5px",
},

  rent: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0F52BA",
  },

  tabs: {
    marginTop: "28px",
    borderRadius: "16px",
    border: "1px solid #c7c4d8",
    background: "#fff",
    overflow: "hidden",
  },

  tabHeader: {
    display: "flex",
    borderBottom: "1px solid #c7c4d8",
  },

  tabBtn: {
    padding: "14px 18px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#464555",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
  },

  tabBtnActive: {
    color: "#0F52BA",
    borderBottom: "2px solid #0F52BA",
  },

  content: {
    padding: "18px",
  },

  backBtn: {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #c7c4d8",
  background: "transparent",
  color: "#0F52BA",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
},
};

export default function LeaseViewDetails({
  lease: initialLease,
}: {
  lease: LeaseLike | null;
}) {
  const router = useRouter();
  const { loading: storeLoading } = useAdminStore();

  const [lease, setLease] = useState<LeaseLike | null>(initialLease);
  const [tab, setTab] = useState<"tenants" | "meta">("tenants");

  useEffect(() => {
    setLease(initialLease);
  }, [initialLease]);

  if (!lease) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>Lease not found</div>
      </div>
    );
  }

  const initials = (lease.property?.title ?? "?")[0].toUpperCase();
  const isActive = lease.status === "active";

  const metaRows = [
    {
      key: "rent",
      label: "Rent",
      value: `${lease.rentAmount?.toLocaleString?.() ?? "-"} ksh`,
    },
    { key: "late", label: "Late Fee %", value: `${lease.lateFeePercent ?? 0}%` },
    { key: "grace", label: "Grace Days", value: `${lease.graceDays ?? 0}` },
    {
      key: "signed",
      label: "Signed",
      value: lease.signedDocumentUrl ? "Verified" : "Not uploaded",
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back */}
       <button
  type="button"
  style={styles.backBtn}
  onClick={() => router.push("/leases")}
>
  <span
    className="material-symbols-outlined"
    style={{ fontSize: "18px", lineHeight: 1 }}
  >
    arrow_back
  </span>
  Back to Leases
</button>

        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Leases Management</h1>
            <div style={styles.subtitle}>
              Detailed lease agreement and metadata
            </div>
          </div>

         <div style={styles.actionRow}>
  <button
    onClick={() => router.push(`/leases/${lease.id}/print`)}
    disabled={storeLoading}
    style={{ ...styles.btn, ...styles.btnFlex }}
  >
    <span style={styles.icon} className="material-symbols-outlined">
      print
    </span>
    Print
  </button>

  <button
    onClick={() => router.push(`/leases/${lease.id}/upload`)}
    disabled={storeLoading}
    style={{ ...styles.btn, ...styles.btnFlex }}
  >
    <span style={styles.icon} className="material-symbols-outlined">
      upload_file
    </span>
    Signed Upload
  </button>

  <button
    style={{ ...styles.btnPrimary, ...styles.btnFlex }}
    onClick={() => router.push(`/leases/${lease.id}`)}
    disabled={storeLoading}
  >
    <span style={styles.icon} className="material-symbols-outlined">
      edit
    </span>
    Edit Lease
  </button>
</div>
        </div>

        {/* Identity Card */}
       <div style={styles.card}>
  {/* LEFT SIDE */}
  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
    <div style={styles.avatar}>{initials}</div>

    <div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
          {lease.property?.title}
        </h2>

        <span
          style={{
            ...styles.badge,
            color: isActive ? "#16a34a" : "#6b7280",
            border: isActive ? "1px solid #F2F3F5" : "1px solid #9ca3af",
          }}
        >
          {lease.status?.toUpperCase()}
        </span>
      </div>

      <div style={{ color: "#464555", marginTop: "6px", fontSize: "14px" }}>
        {lease.property?.location ?? "-"}
      </div>
    </div>
  </div>

  {/* DIVIDER */}
  <div style={styles.divider} />

  {/* RIGHT SIDE */}
  <div
    style={{
      display: "flex",
    justifyContent: "flex-start",
    gap: "154px",
    alignItems: "center",
    }}
  >
    <div>
      <div style={{ fontSize: "11px", color: "#777" }}>
        Lease Period
      </div>
      <div style={{ fontWeight: 600 }}>
        {lease.startDate
          ? new Date(lease.startDate).toLocaleDateString()
          : "-"}{" "}
        →{" "}
        {lease.endDate
          ? new Date(lease.endDate).toLocaleDateString()
          : "-"}
      </div>
    </div>

    <div>
      <div style={{ fontSize: "11px", color: "#777" }}>
        Monthly Rent
      </div>
      <div style={styles.rent}>
        ksh {lease.rentAmount?.toLocaleString?.() ?? "-"}
      </div>
    </div>
  </div>
</div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <div style={styles.tabHeader}>
            <button
              style={{
                ...styles.tabBtn,
                ...(tab === "tenants" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTab("tenants")}
            >
              Tenants
            </button>

            <button
              style={{
                ...styles.tabBtn,
                ...(tab === "meta" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTab("meta")}
            >
              Lease Meta
            </button>
          </div>

          <div style={styles.content}>
            {tab === "tenants" && (
              <DynamicTable<any>
                rows={lease.tenants ?? []}
                getRowId={(r) => r.tenantId ?? r.id}
                columns={[
                  {
                    key: "name",
                    header: "Tenant",
                    render: (r: any) => r.tenant?.name ?? "-",
                  },
                  {
                    key: "email",
                    header: "Email",
                    render: (r: any) => r.tenant?.email ?? "-",
                  },
                  {
                    key: "phone",
                    header: "Phone",
                    render: (r: any) => r.tenant?.phone ?? "-",
                  },
                ]}
                search={{ enabled: true, placeholder: "Search tenants..." }}
                pagination={{
                  enabled: true,
                  defaultPageSize: 5,
                  pageSizeOptions: [5, 10, 20, 50, 100],
                }}
                noRecordsMessage="No tenants found"
              />
            )}

            {tab === "meta" && (
              <DynamicTable<any>
                rows={metaRows}
                getRowId={(r) => r.key}
                columns={[
                  { key: "label", header: "Field", render: (r) => r.label },
                  { key: "value", header: "Value", render: (r) => r.value },
                ]}
                search={{ enabled: false }}
                pagination={{
                  enabled: false,
                  defaultPageSize: 5,
                  pageSizeOptions: [5],
                }}
                noRecordsMessage="No metadata"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}