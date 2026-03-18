"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import RoleForm from "../components/roles/RoleForm";
import PermissionsList from "../components/roles/PermissionsList";
import { useRouter } from "next/navigation";

export default function RolesPage() {
  const { fetchRoles, roles, createRole } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="dashboard-content">
      <div className="page-tag">🎭 ROLES & PERMISSIONS</div>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div className="section-label">ACCESS CONTROL</div>

  <button
    onClick={() => router.push("/roles/new")}
    style={{
      background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
      color: "white",
      border: "none",
      borderRadius: "12px",
      padding: "12px 24px",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "14px"
    }}
  >
    + New Role
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
  System Roles
</h2>

      <div style={{ display: "grid", gap: "24px" }}>
        {roles.map((role) => (
          <div
            key={role.id}
            style={{
              backgroundColor: "rgba(17,24,39,0.8)",
              border: "1px solid var(--border-glow)",
              borderRadius: "20px",
              padding: "32px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--neon-purple)", marginBottom: "4px" }}>
                  {role.name.toUpperCase()}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{role.description || 'No description'}</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  // onClick={() => handleEditRole(role)}
                  style={{
                    backgroundColor: "var(--neon-blue)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>
                <button
                  style={{
                    backgroundColor: "var(--accent-danger)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <PermissionsList permissions={role.permissions} />
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div style={{
          padding: "120px 40px",
          textAlign: "center",
          color: "var(--text-secondary)"
        }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🎭 No roles defined</div>
          <p>Create your first role to manage permissions</p>
          <button
            // onClick={() => setShowForm(true)}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "pointer",
              marginTop: "24px"
            }}
          >
            Create First Role
          </button>
        </div>
      )}
    </div>
  );
}

