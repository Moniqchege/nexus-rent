"use client";

import RoleForm from "@/app/components/roles/RoleForm";
import { Role, useAdminStore } from "@/app/store/adminStore";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = parseInt(params.id as string);
 const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const { roles, fetchRoles, updateRole } = useAdminStore();

  useEffect(() => {
    fetchRoles().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      const role = roles.find(r => r.id === roleId);
      if (role) setEditingRole(role);
      else router.push("/roles");
    }
  }, [roles, roleId]);

  const handleUpdate = async (roleData: Omit<Role, "id">) => {
    await updateRole({ id: roleId, ...roleData });
    router.push("/roles");
  };

  if (loading) return <div>Loading...</div>;
  if (!editingRole) return <div>Role not found</div>;

  return (
    <div className="dashboard-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--neon-blue)" }}>
          ACCESS CONTROL
        </div>
        <button onClick={() => router.push("/roles")} style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "12px 24px",
            fontSize: "14px"
          }}>
          ← Back
        </button>
      </div>
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#000000", marginBottom: "18px" }}>
        Edit Role
      </h2>
      <RoleForm onSubmit={handleUpdate} onCancel={() => router.push("/roles")} editingRole={editingRole} />
    </div>
  );
}
