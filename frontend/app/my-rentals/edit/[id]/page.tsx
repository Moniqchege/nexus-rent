"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/lib/api";
import PropertyForm from "@/app/components/properties/PropertyForm";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = parseInt(params.id as string);

  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/properties/${propertyId}`)
      .then(res => setPropertyData(res.data))
      .catch(() => router.push("/my-rentals"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const handleUpdate = async (updatedData: any) => {
    try {
      await api.patch(`/api/properties/${propertyId}`, updatedData);
      router.push("/my-rentals");
    } catch (error) {
      console.error("Failed to update property:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!propertyData) return <div>Property not found</div>;

  return (
    <div className="dashboard-content">
      <div className="page-tag">🏠 MY PROPERTIES</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--neon-blue)" }}>
          PROPERTY DETAILS
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

      <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-purple)", marginBottom: "20px" }}>
        Edit Property
      </h2>

      <PropertyForm
        initialData={propertyData}
        isEdit={true}
        submitLabel="Update Property"
        onSuccess={handleUpdate}
        onCancel={() => router.push("/my-rentals")}
      />
    </div>
  );
}