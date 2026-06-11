"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import api from "@/app/lib/api";
import { Lease } from "@/types/lease";

export default function UploadSignedLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = Number(params.id);

  const { uploadSignedLease, loading } = useAdminStore();

  const [lease, setLease] = useState<Lease | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await api.get(`/api/leases/${leaseId}`);
        setLease(res.data.lease);
      } catch {
        setLease(null);
      } finally {
        setPageLoading(false);
      }
    };
    if (leaseId) fetchLease();
  }, [leaseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected: File | undefined) => {
    setError(null);
    setSuccess(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(selected.type)) {
      setError("Only PDF, DOC, or DOCX files are allowed.");
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSetFile(dropped);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file before uploading.");
      return;
    }
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("signedDocument", file);

    try {
      await uploadSignedLease(leaseId, formData);
      setSuccess("Signed lease uploaded successfully.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh lease data
      const res = await api.get(`/api/leases/${leaseId}`);
      setLease(res.data.lease);
    } catch {
      setError("Failed to upload signed document. Please try again.");
    }
  };

  if (pageLoading) {
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="dashboard-content">
      {/* Header */}
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
            color: "var(--neon-blue)",
          }}
        >
          LEASES
        </div>

        <button
          onClick={() => router.push(`/leases/${leaseId}/view`)}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "12px 24px",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#000000" }}>
          Upload Signed Lease
        </h2>
        <div
          style={{
            marginTop: "6px",
            color: "var(--text-secondary)",
            fontSize: "14px",
          }}
        >
          Lease for{" "}
          <strong style={{ color: "var(--neon-blue)" }}>
            {lease.property?.title || "—"}
          </strong>
        </div>
      </div>

      {/* Card */}
      <section
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: "28px",
          maxWidth: "720px",
        }}
      >
        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        {/* Already uploaded notice */}
        {lease.signedDocumentUrl && (
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e3a8a",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              info
            </span>
            A signed document has already been uploaded. Uploading a new file
            will replace it.
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleChooseFile}
          style={{
            border: `2px dashed ${
              dragOver ? "var(--neon-blue)" : "#d1d5db"
            }`,
            backgroundColor: dragOver ? "rgba(37,99,235,0.04)" : "#fafafa",
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "20px",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "48px",
              color: "var(--neon-blue)",
              display: "block",
              marginBottom: "12px",
            }}
          >
            cloud_upload
          </span>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            Drag & drop your signed lease here
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            or click to browse — PDF, DOC, DOCX (Max 10MB)
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Choose File button (always visible) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={handleChooseFile}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#111827",
              padding: "12px 20px",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              attach_file
            </span>
            Choose File
          </button>

          {file && (
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "13px",
                color: "#111827",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--neon-blue)", fontSize: "20px" }}
              >
                description
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {file.name}
                </div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>
                  {formatBytes(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setError(null);
                  setSuccess(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: 0,
                  display: "flex",
                }}
                aria-label="Remove file"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  close
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push(`/leases/${leaseId}/view`)}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#111827",
              padding: "12px 20px",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              backgroundColor: !file || loading ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: !file || loading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              {loading ? "hourglass_bottom" : "upload"}
            </span>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </section>
    </div>
  );
}
