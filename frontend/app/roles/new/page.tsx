"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "../../store/adminStore";
import RoleForm from "../../components/roles/RoleForm";
import { useState } from "react";

export default function NewRolePage() {
  const router = useRouter();
  const { createRole } = useAdminStore();
  const [loading, setLoading] = useState(false);

  const handleCreateRole = async (roleData: any) => {
    setLoading(true);
    try {
      await createRole(roleData);
      router.push("/roles");
    } catch (error) {
      console.error("Error creating role:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Section label with back button */}
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
            fontSize: "12px",
            color: "var(--neon-blue)"
          }}
        >
          ACCESS CONTROL
        </div>

        <button
          onClick={() => router.push("/roles")}
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

      {/* Main heading */}
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#000000",
          marginBottom: "20px"
        }}
      >
        Create Role
      </h2>

      <RoleForm
        onSubmit={handleCreateRole}
        onCancel={() => router.push("/roles")}
        loading={loading}
      />
    </div>
  );
}