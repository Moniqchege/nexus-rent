"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lease } from "@/types/lease";
import LeaseAgreementTemplate from "@/app/components/leases/LeaseAgreementTemplate";
import api from "@/app/lib/api";
import { useAuthStore } from "@/app/store/authStore";

export default function PrintLeasePage() {
  const params = useParams();
  const leaseId = Number(params.id);
  const { user } = useAuthStore();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ color: "var(--text-secondary)" }}>Loading agreement...</div>
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
      <div className="page-tag">📄 PRINT AGREEMENT</div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Lease Agreement — {lease.property?.title}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
          Print this agreement, have both parties sign it physically, then upload the signed copy from the edit page.
        </p>
      </div>
      <LeaseAgreementTemplate lease={lease} landlordName={user?.name || "[Landlord Name]"} />
    </div>
  );
}

