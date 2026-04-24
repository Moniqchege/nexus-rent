"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "@/app/store/adminStore";
import LeaseForm from "@/app/components/leases/LeaseForm";

export default function NewLeasePage() {
  const router = useRouter();
  const { createLease } = useAdminStore();

  const handleCreate = async (data: any) => {
    await createLease(data);
    router.push("/leases");
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">📄 NEW LEASE</div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Create Lease Agreement
        </h2>
      </div>
      <LeaseForm onSuccess={handleCreate} onCancel={() => router.push("/leases")} />
    </div>
  );
}

