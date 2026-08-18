"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import type { Lease } from "@/types/lease";
import ViewDetails from "@/app/components/ui/ViewDetails";
import { useAdminStore } from "@/app/store/adminStore";

export default function LeaseViewPage() {
  const params = useParams();
  const router = useRouter();
  const { cancelLease } = useAdminStore();

  const leaseId = Number(params?.id);

  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  useEffect(() => {
    if (!leaseId || Number.isNaN(leaseId)) return;
    fetchLease();
  }, [leaseId]);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelLease(leaseId, cancelReason || undefined);
      setShowCancelDialog(false);
      setCancelReason("");
      await fetchLease();
    } finally {
      setCancelling(false);
    }
  };

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
    { key: "name", header: "Tenant", render: (r: any) => r?.tenant?.name ?? "-" },
    { key: "email", header: "Email", render: (r: any) => r?.tenant?.email ?? "-" },
    { key: "phone", header: "Phone", render: (r: any) => r?.tenant?.phone ?? "-" },
  ];

  const metaRows = [
    { key: "rent", label: "Rent", value: `Ksh ${lease.rentAmount?.toLocaleString() ?? "-"}` },
    { key: "late", label: "Late Fee %", value: `${lease.lateFeePercent ?? 0}%` },
    { key: "grace", label: "Grace Days", value: lease.graceDays ?? 0 },
    { key: "signed", label: "Signed", value: lease.signedDocumentUrl ? "Verified" : "Not Uploaded" },
  ];

  const metaColumns = [
    { key: "label", header: "Field", render: (r: any) => r.label },
    { key: "value", header: "Value", render: (r: any) => r.value },
  ];

  const canRenew = lease.status === "active" || lease.status === "suspended";
  const canCancel = lease.status !== "cancelled" && lease.status !== "ended";

  return (
    <>
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
          { label: "Lease Period", value: `${startDate} → ${endDate}` },
          { label: "Monthly Rent", value: `Ksh ${lease.rentAmount?.toLocaleString() ?? "-"}` },
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
          ...(canRenew
            ? [{
                label: "Renew",
                icon: "autorenew",
                onClick: () => router.push(`/leases/${lease.id}?mode=renew`),
              }]
            : []),
          ...(canCancel
            ? [{
                label: "Cancel Lease",
                icon: "cancel",
                onClick: () => setShowCancelDialog(true),
              }]
            : []),
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
            table: { rows: lease.tenants ?? [], columns: tenantColumns },
          },
          {
            key: "meta",
            label: "Lease Meta",
            table: { rows: metaRows, columns: metaColumns, search: false },
          },
        ]}
      />

      {showCancelDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => !cancelling && setShowCancelDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              width: 420,
              maxWidth: "90vw",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
              Cancel this lease?
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
              This will mark the lease as cancelled. This action cannot be undone.
            </p>

            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginTop: 16, marginBottom: 6 }}>
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                resize: "vertical",
              }}
              placeholder="e.g. Tenant moving out early, mutual agreement..."
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
                style={{
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Keep Lease
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}