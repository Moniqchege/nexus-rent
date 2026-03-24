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

interface PropertyAssignment {
  propertyId: number;
  roleId: number;
  propertyName?: string;
  roleName?: string;
}

export default function UserForm({ onSubmit, onCancel, editingUser, isEdit = false }: UserFormProps) {
  const { roles, properties, fetchRoles, fetchProperties } = useAdminStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    plan: "FREE",
    username: "",
  });
  const [propertyAssignments, setPropertyAssignments] = useState<PropertyAssignment[]>([]);

  useEffect(() => {
    fetchRoles();
    fetchProperties();
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
      // TODO: Load existing propertyAssignments for edit
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        plan: "FREE",
        username: "",
      });
      setPropertyAssignments([]);
    }
  }, [editingUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ... (isEdit && !formData.password 
        ? { name: formData.name, role: formData.role, plan: formData.plan, username: formData.username }
        : formData),
      propertyAssignments,
    };
    onSubmit(submitData);
  };

  const addPropertyAssignment = () => {
    setPropertyAssignments([...propertyAssignments, { propertyId: 0, roleId: 0 }]);
  };

  const updatePropertyAssignment = (index: number, field: keyof PropertyAssignment, value: number) => {
    const newAssignments = [...propertyAssignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setPropertyAssignments(newAssignments);
  };

  const removePropertyAssignment = (index: number) => {
    setPropertyAssignments(propertyAssignments.filter((_, i) => i !== index));
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

        {/* New Property Assignments Section */}
        <div style={{ marginTop: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: 600, 
            fontSize: "16px", 
            marginBottom: "16px", 
            color: "var(--neon-purple)",
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            🏠 Property Assignments ({propertyAssignments.length})
          </label>
          <button
            type="button"
            onClick={addPropertyAssignment}
            style={{
              backgroundColor: "rgba(17,24,39,0.5)",
              color: "var(--neon-blue)",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "16px"
            }}
          >
            + Add Property Assignment
          </button>
          {propertyAssignments.length === 0 ? (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--text-secondary)",
              border: "1px dashed var(--border-glow)",
              borderRadius: "12px"
            }}>
              No properties assigned. Click above to add.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {propertyAssignments.map((assignment, index) => (
                <div key={index} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "end",
                  backgroundColor: "rgba(17,24,39,0.3)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glow)"
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "var(--neon-blue)" }}>
                      Property
                    </label>
                    <select
                      value={assignment.propertyId}
                      onChange={(e) => updatePropertyAssignment(index, "propertyId", parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(17,24,39,0.5)",
                        border: "1px solid var(--border-glow)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        fontSize: "14px",
                        color: "var(--text-primary)"
                      }}
                      required
                    >
                      <option value={0}>Select Property</option>
                      {properties.map((prop: any) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.title} - {prop.location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "var(--neon-blue)" }}>
                      Role for this Property
                    </label>
                    <select
                      value={assignment.roleId}
                      onChange={(e) => updatePropertyAssignment(index, "roleId", parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(17,24,39,0.5)",
                        border: "1px solid var(--border-glow)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        fontSize: "14px",
                        color: "var(--text-primary)"
                      }}
                      required
                    >
                      <option value={0}>Select Role</option>
                      {roles.map((role: Role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePropertyAssignment(index)}
                    style={{
                      backgroundColor: "rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "44px",
                      height: "fit-content"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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

