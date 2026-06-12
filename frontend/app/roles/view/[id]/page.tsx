"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import RoleViewDetails from "@/app/components/roles/RoleViewDetails";

type RoleLike = {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
};

export default function ViewRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = parseInt(params.id as string);

  const [role, setRole] = useState<RoleLike | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleId || Number.isNaN(roleId)) {
      router.push("/roles");
      return;
    }

    let cancelled = false;

    const fetchRole = async () => {
      try {
        const res = await api.get(`/api/roles/${roleId}`);
        if (cancelled) return;
        setRole((res.data?.role ?? res.data) as RoleLike);
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [roleId, router]);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--neon-blue)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <RoleViewDetails role={role} />
    </div>
  );
}
