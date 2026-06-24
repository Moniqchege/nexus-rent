"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Role } from "../../store/adminStore";
import { CustomDropdown } from "../ui/CustomDropdown";

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
  floor?: string;
  unit?: string;
}

export default function UserForm({ onSubmit, onCancel, editingUser, isEdit = false }: UserFormProps) {
  const { roles, properties, fetchRoles, fetchProperties } = useAdminStore();
  const [leaseDocument, setLeaseDocument] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
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
        phone: editingUser.phone || "",
        
        plan: editingUser.plan || "FREE",
        username: editingUser.username || "",
      });
      const assignments = (editingUser.userProperties || []).map((up: any) => ({
      propertyId: up.propertyId,
      roleId: up.role?.id,
      propertyName: up.property?.title,
      roleName: up.role?.name,
    }));

    setPropertyAssignments(assignments);
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        plan: "FREE",
        username: "",
      });
      setPropertyAssignments([]);
    }
  }, [editingUser]);

      useEffect(() => {
  if (editingUser && roles.length && properties.length) {
    const assignments = (editingUser.userProperties || []).map((up: any) => ({
      propertyId: up.propertyId,
      roleId: up.role?.id,
      propertyName: up.property?.title,
      roleName: up.role?.name,
    }));
    setPropertyAssignments(assignments);
  }
}, [editingUser, roles, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);

    const formDataToSend = new FormData();

    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("plan", formData.plan);
    formDataToSend.append("username", formData.username);

    if (leaseDocument) {
      formDataToSend.append("leaseDocument", leaseDocument);
    }

    formDataToSend.append(
      "propertyAssignments",
      JSON.stringify(propertyAssignments)
    );

    await onSubmit(formDataToSend);
  } finally {
    setLoading(false);
  }
};

  const addPropertyAssignment = () => {
    setPropertyAssignments([...propertyAssignments, { propertyId: 0, roleId: 0 }]);
  };

  const updatePropertyAssignment = (index: number, field: keyof PropertyAssignment, value: number | string) => {
  const newAssignments = [...propertyAssignments];
  newAssignments[index] = { ...newAssignments[index], [field]: value };
  setPropertyAssignments(newAssignments);
};

  const removePropertyAssignment = (index: number) => {
    setPropertyAssignments(propertyAssignments.filter((_, i) => i !== index));
  };

  const isTenantRole = (roleId: number) => {
  return roles.find((r: any) => r.id === roleId)?.name?.toLowerCase() === "tenant";
};

  return (
    <div style={{
      backgroundColor: "#ffffff",
      backdropFilter: "blur(20px)",
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
      borderRadius: "24px",
      padding: "25px",
    }}>
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 700, 
        background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
        color: "#000000",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "#000000",
        marginBottom: "14px",
        // textAlign: "center"
      }}>
        {isEdit ? "Edit User" : "Create New User"}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
              backgroundColor: "#ffffff",
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
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "16px",
              color: "var(--text-primary)"
            }}
            placeholder="Enter email address"
            required
            disabled={isEdit} 
          />
        </div>
        </div>

        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
              backgroundColor: "#ffffff",
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
  <label style={{ 
    display: "block", 
    fontWeight: 600, 
    fontSize: "14px", 
    marginBottom: "8px", 
    color: "var(--neon-blue)" 
  }}>
    Phone Number *
  </label>
  <input
    type="tel"
    value={formData.phone || ""}
    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
    placeholder="e.g. 254712345678"
    required
    style={{
      width: "100%",
      backgroundColor: "#ffffff",
      border: "1px solid var(--border-glow)",
      borderRadius: "12px",
      padding: "14px 20px",
      fontSize: "16px",
      color: "var(--text-primary)"
    }}
  />
</div>
        </div>   

        <section style={{ marginTop: "16px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
    <span style={{
      width: "4px",
      height: "20px",
      backgroundColor: "#0F52BA",
      borderRadius: "4px"
    }} />
    <h3 style={{
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase",
      color: "#0F52BA",
      letterSpacing: "0.08em"
    }}>
      Lease Document
    </h3>
  </div>

  <div style={{ position: "relative" }}>
    <input
      id="lease-upload"
      type="file"
      accept=".pdf,.doc,.docx,image/jpeg,image/jpg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "image/jpeg",
          "image/jpg"
        ];

        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
          setFileError("Only PDF, DOCX or JPG files are allowed");
          setLeaseDocument(null);
          return;
        }

        if (file.size > maxSize) {
          setFileError("File size must be 10MB or less");
          setLeaseDocument(null);
          return;
        }

        setFileError("");
        setLeaseDocument(file);
      }}
    />

    <label
      htmlFor="lease-upload"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "130px",
        border: "2px dashed #e5e7eb",
        borderRadius: "16px",
        backgroundColor: "#f9fafb",
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "center"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLLabelElement).style.borderColor = "#0F52BA";
        (e.currentTarget as HTMLLabelElement).style.backgroundColor = "#eff6ff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLLabelElement).style.borderColor = "#e5e7eb";
        (e.currentTarget as HTMLLabelElement).style.backgroundColor = "#f9fafb";
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "32px",
          color: "#9ca3af",
          marginBottom: "8px",
          transition: "color 0.2s ease"
        }}
      >
        cloud_upload
      </span>

      <p style={{ fontSize: "14px", color: "#6b7280" }}>
        <span style={{ fontWeight: 600, color: "#0F52BA" }}>
          Click to upload
        </span>{" "}
        or drag and drop
      </p>

      <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
        PDF, DOCX or JPG (MAX. 10MB)
      </p>
    </label>
  </div>

  {fileError && (
    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
      {fileError}
    </p>
  )}

  {leaseDocument && (
    <p style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
      Selected: <strong>{leaseDocument.name}</strong>
    </p>
  )}
</section>

        {/* New Property Assignments Section */}
        <div style={{ marginTop: "10px" }}>
  {/* HEADER ROW */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    }}
  >
    <label
      style={{
        fontWeight: 600,
        fontSize: "16px",
        color: "transparent",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "#0F52BA",
      }}
    >
      <span className="w-1 h-6 bg-primary rounded-full"></span>
       Property Assignments
    </label>

    <button
      type="button"
      onClick={addPropertyAssignment}
      style={{
        backgroundColor: "#ffffff",
        color: "#0F52BA",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "10px 16px",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "13px",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      + Add Assignment
    </button>
  </div>

  {/* EMPTY STATE */}
  {propertyAssignments.length === 0 ? (
    <div
      style={{
        padding: "24px",
        textAlign: "center",
        color: "#6b7280",
        border: "1px dashed #e5e7eb",
        borderRadius: "12px",
        backgroundColor: "#fafafa",
      }}
    >
      No properties assigned. Click “Add Assignment” to begin.
    </div>
  ) : (
    /* ASSIGNMENT LIST */
    <div style={{ display: "grid", gap: "12px" }}>
      {propertyAssignments.map((assignment, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: isTenantRole(assignment.roleId)
              ? "1fr 1fr auto 1fr 1fr"  // Property | Role | Delete | Floor | Unit
              : "1fr 1fr auto",
            gap: "12px",
            alignItems: "end",
            backgroundColor: "#ffffff",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* PROPERTY */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "12px",
                marginBottom: "6px",
                color: "#0F52BA",
              }}
            >
              Property
            </label>

            <CustomDropdown
              options={properties}
              value={assignment.propertyId}
              onChange={(val) =>
                updatePropertyAssignment(index, "propertyId", Number(val))
              }
              labelKey="title"
              valueKey="id"
              placeholder="Select Property"
            />
          </div>

          {/* ROLE */}
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: "12px",
                marginBottom: "6px",
                color: "#0F52BA",
              }}
            >
              Role
            </label>

            <CustomDropdown
              options={roles}
              value={assignment.roleId}
              onChange={(val) =>
                updatePropertyAssignment(index, "roleId", Number(val))
              }
              labelKey="name"
              valueKey="id"
              placeholder="Select Role"
            />
          </div>

          {/* DELETE */}
          <button
            type="button"
            onClick={() => removePropertyAssignment(index)}
            style={{
              backgroundColor: "#ffffff",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
              padding: "10px 12px",
              cursor: "pointer",
              height: "42px",
              alignSelf: "end",
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
          {/* FLOOR + UNIT — only for Tenant role */}
          {isTenantRole(assignment.roleId) && (
            <>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "#0F52BA" }}>
                  Floor
                </label>
                <input
                  type="text"
                  value={assignment.floor || ""}
                  onChange={(e) => updatePropertyAssignment(index, "floor", e.target.value)}
                  placeholder="e.g. 2nd Floor"
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "6px", color: "#0F52BA" }}>
                  Unit
                </label>
                <input
                  type="text"
                  value={assignment.unit || ""}
                  onChange={(e) => updatePropertyAssignment(index, "unit", e.target.value)}
                  placeholder="e.g. A3"
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )}
</div>

        <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end"}}>
          <button
            type="button"
            disabled={loading}
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
            disabled={loading} 
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

