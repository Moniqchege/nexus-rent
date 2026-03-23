"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Role } from "../../store/adminStore";

interface UserFormProps {
  onSubmit: (userData: any) => void;
  onCancel: () => void;
  editingUser?: any;
  isEdit?: boolean;
}

export default function UserForm({ onSubmit, onCancel, editingUser, isEdit = false }: UserFormProps) {
  const { roles, fetchRoles } = useAdminStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    plan: "FREE",
    username: "",
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role || "",
        plan: editingUser.plan || "FREE",
        username: editingUser.username || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        plan: "FREE",
        username: "",
      });
    }
  }, [editingUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = isEdit && !formData.password 
      ? { name: formData.name, role: formData.role, plan: formData.plan, username: formData.username }
      : formData;
    onSubmit(submitData);
  };

  return (
    <div style={{
      backgroundColor: "rgba(17,24,39,0.95)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--border-glow)",
      borderRadius: "24px",
      padding: "25px",
      maxWidth: "950px",
      margin: "0 auto"
    }}>
      <h3 style={{ 
        fontSize: "20px", 
        fontWeight: 700, 
        background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "14px",
        // textAlign: "center"
      }}>
        {isEdit ? "Edit User" : "Create New User"}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px"
        }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Full Name *
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
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)"
            }}
            placeholder="Enter full name"
            required
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)"
            }}
            placeholder="Enter email address"
            required
            disabled={isEdit} // Can't change email on edit
          />
        </div>
        </div>

        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px"
        }}>
             <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)"
            }}
            placeholder="Username (optional)"
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px", color: "var(--neon-blue)" }}>
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{
              width: "100%",
              backgroundColor: "rgba(17,24,39,0.5)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)"
            }}
            required
          >
            <option value="">Select Role</option>
            {roles.map((role: Role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        </div>      

        <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end"}}>
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
              cursor: "pointer",
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
            {isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

