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
      <div className="page-tag">📄 EDIT LEASE</div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
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

      {/* Signed Document Upload Section */}
      <div
        style={{
          backgroundColor: "rgba(17,24,39,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-glow)",
          borderRadius: "24px",
          padding: "25px",
          maxWidth: "950px",
          margin: "24px auto 0",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--neon-purple)",
            marginBottom: "14px",
          }}
        >
          Signed Lease Document
        </h3>

        {lease.signedDocumentUrl && (
          <div style={{ marginBottom: "16px" }}>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${lease.signedDocumentUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--neon-blue)",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              View Current Signed Document
            </a>
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "12px",
              marginBottom: "8px",
              color: "var(--neon-blue)",
            }}
          >
            Upload Signed Document (PDF or DOCX)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
              ];
              if (!allowedTypes.includes(file.type)) {
                setUploadError("Only PDF or DOCX files are allowed");
                setSignedFile(null);
                return;
              }
              setUploadError("");
              setSignedFile(file);
            }}
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "12px",
              color: "var(--text-primary)",
            }}
          />
          {uploadError && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
              {uploadError}
            </p>
          )}
        </div>

        <button
          onClick={handleUploadSigned}
          disabled={!signedFile}
          style={{
            background: signedFile
              ? "linear-gradient(to right, var(--neon-blue), var(--neon-purple))"
              : "rgba(17,24,39,0.5)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: signedFile ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          Upload Signed Document
        </button>
      </div>
    </div>
  );
}

