"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

interface RoleFormProps {
  onSubmit: (roleData: any) => void;
  onCancel: () => void;
  editingRole?: any;
}

export default function RoleForm({ onSubmit, onCancel, editingRole }: RoleFormProps) {
  const { permissions, roles, updateRole } = useAdminStore();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
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
  onSubmit(formData);
};

  return (
    <div style={{
      backgroundColor: "rgba(17,24,39,0.95)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--border-glow)",
      borderRadius: "24px",
      padding: "25px",
      maxWidth: "950px",
      marginBottom: "32px"
    }}>
      <h3 style={{ 
        fontSize: "20px", 
        fontWeight: 700, 
        background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px"
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
    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "var(--neon-blue)" }}>
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
    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "var(--neon-blue)" }}>
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
          <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px", color: "var(--neon-blue)" }}>
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
  <label style={{ fontWeight: 600, fontSize: "12px", color: "var(--neon-blue)" }}>
    Permissions ({formData.permissions.length} selected)
  </label>

  <div style={{ position: "relative", marginTop: "10px" }}>
    <button
      type="button"
      onClick={() => setShowPermissionsModal(true)}
      style={{
        width: "100%",
        background: "transparent",
        border: "1px solid var(--border-glow)",
        padding: "12px 40px 12px 16px", 
        borderRadius: "10px",
        color: "var(--text-primary)",
        cursor: "pointer",
        textAlign: "left",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {formData.permissions.length === 0
        ? "Select Permissions"
        : (() => {
            const selectedLabels = formData.permissions
              .map(key => {
                const perm = permissions.find(p => p.key === key);
                return perm?.label || key;
              })
              .filter(Boolean);

            const firstThree = selectedLabels.slice(0, 3);
            const remainingCount = selectedLabels.length - firstThree.length;
            return (
              firstThree.join(", ") + (remainingCount > 0 ? ` +${remainingCount} more` : "")
            );
          })()}
    </button>

    {/* Search Icon */}
    <Search
      size={18}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--text-secondary)",
        pointerEvents: "none"
      }}
    />
  </div>
</div>

{showPermissionsModal &&
createPortal(
  <div
    className="popup-overlay"
    onClick={() => setShowPermissionsModal(false)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: "100px"
    }}
  >
    <div
      className="popup-card"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative",
        width: "900px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setShowPermissionsModal(false)}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "transparent",
          border: "none",
          fontSize: "20px",
          color: "var(--neon-purple)",
          cursor: "pointer"
        }}
      >
        ✕
      </button>

      {/* Header */}
      <h2 style={{ color: "#fff", marginBottom: "12px" }}>
        Select Permissions
      </h2>

      {/* Scrollable content */}
      <div className="popup-scroll">
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            paddingRight: "8px"
          }}
        >
          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const allSelected = perms.every(p =>
              formData.permissions.includes(p.key)
            );

            const someSelected =
              perms.some(p => formData.permissions.includes(p.key)) &&
              !allSelected;

            return (
              <div
                key={category}
                style={{
                  border: "1px solid var(--border-glow)",
                  borderRadius: "12px",
                  padding: "12px",
                  background: "rgba(17,24,39,0.6)"
                }}
              >
                {/* Parent */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 400,
                    color: "var(--neon-purple)",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => {
                      let newPermissions = [...formData.permissions];

                      if (e.target.checked) {
                        const keys = perms.map(p => p.key);
                        newPermissions = Array.from(
                          new Set([...newPermissions, ...keys])
                        );
                      } else {
                        const keys = perms.map(p => p.key);
                        newPermissions = newPermissions.filter(
                          p => !keys.includes(p)
                        );
                      }

                      setFormData({
                        ...formData,
                        permissions: newPermissions
                      });
                    }}
                    style={{
                      width: "14px",
                      height: "14px",
                      accentColor: "var(--neon-purple)"
                    }}
                  />
                  {category}
                </label>

                {/* Children */}
                <div
                  style={{
                    marginTop: "10px",
                    marginLeft: "24px",
                    display: "grid",
                    gap: "8px"
                  }}
                >
                  {perms.map((perm) => (
                    <label
                      key={perm.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#ddd",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={(e) => {
                          let newPermissions = [...formData.permissions];

                          if (e.target.checked) {
                            newPermissions.push(perm.key);
                          } else {
                            newPermissions = newPermissions.filter(
                              p => p !== perm.key
                            );
                          }

                          setFormData({
                            ...formData,
                            permissions: newPermissions
                          });
                        }}
                        style={{
                          width: "14px",
                          height: "14px",
                          accentColor: "var(--neon-purple)"
                        }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px"
        }}
      >
        <button
          onClick={() => setShowPermissionsModal(false)}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "var(--neon-purple)",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Done
        </button>
      </div>
    </div>
  </div>,
  document.body
)}

        <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 28px",
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
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {editingRole ? "Update Role" : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
}

