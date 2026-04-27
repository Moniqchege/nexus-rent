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
      <div
  style={{
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
  }}
>
  <h2
    style={{
      fontSize: "24px",
      fontWeight: 700,
      color: "var(--neon-blue)",
    }}
  >
    Create Lease Agreement
  </h2>

</div>
      <LeaseForm onSuccess={handleCreate} onCancel={() => router.push("/leases")} />
    </div>
  );
}

