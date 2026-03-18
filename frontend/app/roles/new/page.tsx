"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "../../store/adminStore";
import RoleForm from "../../components/roles/RoleForm";

export default function NewRolePage() {
  const router = useRouter();
  const { createRole } = useAdminStore();

  const handleCreateRole = async (roleData: any) => {
    await createRole(roleData);
    router.push("/roles"); 
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">🎭 ROLES & PERMISSIONS</div>

      {/* Section label with back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        //   marginBottom: "16px"
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "16px",
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
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--neon-purple)",
          marginBottom: "20px"
        }}
      >
        Create Role
      </h2>

      <RoleForm
        onSubmit={handleCreateRole}
        onCancel={() => router.push("/roles")}
      />
    </div>
  );
}