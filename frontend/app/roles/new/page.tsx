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
      <div className="section-label">ACCESS CONTROL</div>

      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--neon-purple)",
          marginBottom: "32px"
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