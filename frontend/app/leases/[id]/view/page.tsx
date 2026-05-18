"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/app/lib/api";
import type { Lease } from "@/types/lease";
import LeaseViewDetails from "@/app/components/leases/LeaseViewDetails";

export default function LeaseViewPage() {
  const params = useParams();
  const leaseId = Number(params.id);

  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await api.get(`/api/leases/${leaseId}`);
        setLease(res.data.lease as Lease);
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
        <div style={{ color: "var(--text-secondary)" }}>Loading lease...</div>
      </div>
    );
  }

  return <LeaseViewDetails lease={lease} />;
}

