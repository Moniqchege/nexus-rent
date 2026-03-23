"use client";

import PropertyForm from "@/app/components/properties/PropertyForm";
import { useAdminStore } from "@/app/store/adminStore";
import { useRouter } from "next/navigation";

export default function NewRentalPage() {
  const router = useRouter();
  const { createProperty } = useAdminStore();

  const handleSuccess = async (setData: any) => {
    await createProperty(setData);
    router.push("/my-rentals");
    router.refresh(); 
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">📊 PROPERTIES DASHBOARD</div>
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
          MY PROPERTIES
        </div>

        <button
          onClick={() => router.push("/my-rentals")}
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
       <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--neon-purple)",
          marginBottom: "32px"
        }}
      >
        Create New Rental
      </h2>
      <PropertyForm
  onSuccess={handleSuccess}
  onCancel={() => router.push("/my-rentals")}
  submitLabel="Create Rental"
/>
    </div>
  )
}

