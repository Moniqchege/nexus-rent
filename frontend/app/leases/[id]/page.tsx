"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import LeaseForm from "@/app/components/leases/LeaseForm";
import { Lease } from "@/types/lease";
import api from "@/app/lib/api";

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = Number(params.id);
  const { updateLease, uploadSignedLease } = useAdminStore();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");

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

  const handleUploadSigned = async () => {
    if (!signedFile) return;
    setUploadError("");
    const formData = new FormData();
    formData.append("signedDocument", signedFile);
    try {
      await uploadSignedLease(leaseId, formData);
      setSignedFile(null);
      // Refresh lease data
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
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center"}}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#000000" }}>
          Edit Lease Agreement
        </h2>
      </div>

      <LeaseForm
        initialData={lease}
        isEdit
        submitLabel="Update Lease"
        onSuccess={handleUpdate}
        onCancel={() => router.push("/leases")}
      />
    </div>
  );
}

