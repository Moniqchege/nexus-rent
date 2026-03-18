"use client";

import { useEffect, useState } from "react";
import { Role, useAdminStore } from "../../store/adminStore";
// import { Role } from "../../store/adminStore";


interface UserTableProps {}

export default function UserTable({}: UserTableProps) {
  const { users, roles, loading, updateUserRole, fetchRoles } = useAdminStore();
  const [selectedRole, setSelectedRole] = useState<{[key: number]: string}>({});

  // Load roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const handleRoleChange = (userId: number, roleName: string) => {
    updateUserRole(userId, roleName);
    setSelectedRole(prev => ({ ...prev, [userId]: roleName }));
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: "rgba(17,24,39,0.8)",
        border: "1px solid var(--border-glow)",
        borderRadius: "20px",
        padding: "60px",
        textAlign: "center"
      }}>
        <div style={{ color: "var(--neon-blue)", fontSize: "16px" }}>Loading users...</div>
      </div>
    );
  }

  return (
    <div className="table-container" style={{
      backgroundColor: "rgba(17,24,39,0.8)",
      border: "1px solid var(--border-glow)",
      borderRadius: "20px",
      overflow: "hidden"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse"
      }}>
        <thead>
          <tr style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white"
          }}>
            <th style={{ padding: "20px 24px", textAlign: "left", fontWeight: 600 }}>Name</th>
            <th style={{ padding: "20px 24px", textAlign: "left", fontWeight: 600 }}>Email</th>
            <th style={{ padding: "20px 24px", textAlign: "left", fontWeight: 600 }}>Role</th>
            <th style={{ padding: "20px 24px", textAlign: "left", fontWeight: 600 }}>Created</th>
            <th style={{ padding: "20px 24px", textAlign: "left", fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{
              borderBottom: "1px solid var(--border-glow)"
            }}>
              <td style={{ padding: "20px 24px", fontWeight: 500 }}>
                {user.name}
              </td>
              <td style={{ padding: "20px 24px", color: "var(--text-secondary)" }}>
                {user.email}
              </td>
              <td style={{ padding: "20px 24px" }}>
                <select
                  value={selectedRole[user.id] || user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  style={{
                    backgroundColor: "rgba(17,24,39,0.5)",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "12px",
                    padding: "8px 16px",
                    color: "var(--text-primary)",
                    fontSize: "14px"
                  }}
                >
                  {roles.map((role: Role) => (
                    <option key={role.name} value={role.name}>
                      {role.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "20px 24px", color: "var(--text-secondary)" }}>
                {user.createdAt}
              </td>
              <td style={{ padding: "20px 24px" }}>
                <button style={{
                  backgroundColor: "var(--accent-danger)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div style={{
          padding: "80px 40px",
          textAlign: "center",
          color: "var(--text-secondary)"
        }}>
          <div style={{ fontSize: "18px", marginBottom: "12px" }}>👥 No users found</div>
          <div>Create your first user to get started</div>
        </div>
      )}
    </div>
  );
}

