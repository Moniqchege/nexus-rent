"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import LeaseForm from "@/app/components/leases/LeaseForm";
import { Lease } from "@/types/lease";
import api from "@/app/lib/api";

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isRenew = searchParams.get("mode") === "renew";

  const leaseId = Number(params.id);
  const { updateLease, renewLease, uploadSignedLease } = useAdminStore();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [requiresNewSignature, setRequiresNewSignature] = useState(true);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await api.get(`/api/leases/${leaseId}`);
        setLease(res.data.lease);
      } catch {
        setLease(null);
      } finally {
        setLoading(false);
      }
    };
    if (leaseId) fetchLease();
  }, [leaseId]);

  const handleUpdate = async (data: any) => {
    await updateLease(leaseId, data);
    router.push("/leases");
  };

  const handleRenew = async (data: any) => {
    const newLease = await renewLease(leaseId, { ...data, requiresNewSignature });
    router.push(`/leases/${newLease.id}`);
  };

  const handleUploadSigned = async () => {
    if (!signedFile) return;
    setUploadError("");
    const formData = new FormData();
    formData.append("signedDocument", signedFile);
    try {
      await uploadSignedLease(leaseId, formData);
      setSignedFile(null);
      const res = await api.get(`/api/leases/${leaseId}`);
      setLease(res.data.lease);
    } catch {
      setUploadError("Failed to upload signed document");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>Loading lease...</div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>Lease not found.</div>
      </div>
    );
  }

  if (isRenew && lease.renewedFromId === undefined && (lease as any).renewedTo) {
    // already renewed — belt and suspenders, backend also blocks this
  }

  return (
    <div className="dashboard-content">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "16px",
            color: "var(--neon-blue)"
          }}
        >
          LEASES
        </div>

        <button
          onClick={() => router.push("/leases")}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "12px 24px",
            fontSize: "14px"
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center"}}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#000000" }}>
          {isRenew ? "Renew Lease Agreement" : "Edit Lease Agreement"}
        </h2>
      </div>

      {isRenew && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <input
            type="checkbox"
            id="requiresNewSignature"
            checked={requiresNewSignature}
            onChange={(e) => setRequiresNewSignature(e.target.checked)}
          />
          <label htmlFor="requiresNewSignature" style={{ fontSize: 13, color: "#1e3a8a" }}>
            Require a new signed document before this renewed lease becomes active
          </label>
        </div>
      )}

      {!isRenew && (
        <LeaseForm
          initialData={lease}
          isEdit
          submitLabel="Update Lease"
          onSuccess={handleUpdate}
          onCancel={() => router.push("/leases")}
        />
      )}

      {isRenew && (
        <LeaseForm
          initialData={{
            ...lease,
            startDate: undefined,
            endDate: undefined,
          }}
          isEdit
          submitLabel="Create Renewal"
          onSuccess={handleRenew}
          onCancel={() => router.push(`/leases/${leaseId}`)}
        />
      )}
    </div>
  );
}