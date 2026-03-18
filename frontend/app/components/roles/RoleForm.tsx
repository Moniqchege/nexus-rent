"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";

interface RoleFormProps {
  onSubmit: (roleData: any) => void;
  onCancel: () => void;
  editingRole?: any;
}

export default function RoleForm({ onSubmit, onCancel, editingRole }: RoleFormProps) {
  const { permissions, roles, updateRole } = useAdminStore();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    permissions: [] as string[]
  });

  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        code: editingRole.code,
        description: editingRole.description || "",
        permissions: editingRole.permissions || []
      });
    }
  }, [editingRole]);

  const groupedPermissions = permissions.reduce((acc: Record<string, any[]>, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, any[]>);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateRole({ ...editingRole, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div style={{
      backgroundColor: "rgba(17,24,39,0.95)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--border-glow)",
      borderRadius: "24px",
      padding: "25px",
      maxWidth: "800px",
      marginBottom: "32px"
    }}>
      <h3 style={{ 
        fontSize: "28px", 
        fontWeight: 700, 
        background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "12px"
      }}>
        {editingRole ? "Edit Role" : "Create New Role"}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
     <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  }}
>
  <div>
    <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", color: "var(--neon-blue)" }}>
      Role Name *
    </label>
    <input
      type="text"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      style={{
        width: "100%",
        backgroundColor: "rgba(17,24,39,0.5)",
        border: "1px solid var(--border-glow)",
        borderRadius: "12px",
        padding: "10px 20px",
        fontSize: "16px",
        color: "var(--text-primary)"
      }}
      placeholder="Enter the role's name"
      required
    />
  </div>

  <div>
    <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", color: "var(--neon-blue)" }}>
      Role Code
    </label>
    <input
      type="text"
      value={formData.code}
      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
      style={{
        width: "100%",
        backgroundColor: "rgba(17,24,39,0.5)",
        border: "1px solid var(--border-glow)",
        borderRadius: "12px",
        padding: "10px 20px",
        fontSize: "16px",
        color: "var(--text-primary)"
      }}
      placeholder="Enter role code (e.g. 001)"
      required
    />
  </div>
</div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "var(--neon-blue)" }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "16px",
              color: "var(--text-primary)",
              resize: "vertical"
            }}
            placeholder="Brief description of this role's purpose..."
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "16px", color: "var(--neon-blue)" }}>
            Permissions ({formData.permissions.length} selected)
          </label>
          
          {Object.entries(groupedPermissions).map(([category, perms]: [string, any[]]) => (
            <div key={category} style={{ marginBottom: "24px" }}>
              <div style={{
                fontWeight: 600,
                color: "var(--neon-purple)",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid var(--border-glow)"
              }}>
                {category} ({perms.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {perms.map((perm) => (
                  <label key={perm.key} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={(e) => {
                        const newPerms = e.target.checked
                          ? [...formData.permissions, perm.key]
                          : formData.permissions.filter(p => p !== perm.key);
                        setFormData({ ...formData, permissions: newPerms });
                      }}
                      style={{ width: "20px", height: "20px", accentColor: "var(--neon-blue)" }}
                    />
                    <span style={{ fontSize: "14px" }}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "16px 32px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {editingRole ? "Update Role" : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
}

