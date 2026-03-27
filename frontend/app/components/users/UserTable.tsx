"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Role, useAdminStore } from "../../store/adminStore";
import ConfirmDialog from "../ui/ConfirmDialog";

interface UserTableProps {
  users: any[];
  onDeleteClick: (userId: number) => void;
}

export default function UserTable({ users, onDeleteClick }: UserTableProps) {
  const router = useRouter();
  const { roles, updateUserRole, fetchRoles, deleteUser, loading: storeLoading } = useAdminStore();
  const [selectedRole, setSelectedRole] = useState<{[key: number]: string}>({});
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

    const handleDeleteClick = (roleId: number) => {
    setSelectedRoleId(roleId);
    setDialogOpen(true);
  };

   const handleConfirmDelete = () => {
    if (selectedRoleId !== null) {
      deleteUser(selectedRoleId);
      setDialogOpen(false);
      setSelectedRoleId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedRoleId(null);
  };

  if (storeLoading) {
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
    <div style={{
      backgroundColor: "rgba(17,24,39,0.8)",
      border: "1px solid var(--border-glow)",
      borderRadius: "20px",
      overflow: "hidden"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse"
      }}>
        <thead className="table-head">
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
            <th>#</th>
            <th style={{ padding: "12px" }}>Name</th>
            <th style={{ padding: "12px" }}>Email</th>
            <th style={{ padding: "12px" }}>Phone Number</th>
            {/* <th style={{ padding: "12px" }}>Properties</th> */}
            <th style={{ padding: "12px" }}>Created At</th>
            <th style={{ padding: "12px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id} style={{
              borderBottom: "1px solid var(--border-glow)",
              backgroundColor: "rgba(17,24,39,0.4)"
            }}>
              <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                {index + 1}
              </td>
              <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                {user.name}
              </td>
              <td style={{  padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                {user.email}
              </td>
              <td style={{  padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                {user.phone}
              </td>
              <td style={{  padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td style={{  padding: "12px", display: "flex", gap: "8px" }}>
                <button
                  className="action-btn"
                  onClick={() => router.push(`/users/edit/${user.id}`)}
                >
                  View
                </button>
                <button
                  className="action-btn"
                  onClick={() => router.push(`/users/edit/${user.id}`)}
                >
                  Edit
                </button>
                <button
                  className="action-btn"
                  onClick={() => onDeleteClick(user.id)}
                >
                  Delete
                </button>
                <ConfirmDialog
                        open={dialogOpen}
                        title="Delete User"
                        message="Are you sure you want to delete this user? This action cannot be undone."
                        onConfirm={handleConfirmDelete}
                        onCancel={handleCancelDelete}
                      />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div style={{
          padding: "120px 40px",
          textAlign: "center",
          color: "var(--text-secondary)"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "24px" }}>👥</div>
          <div style={{ fontSize: "24px", marginBottom: "16px", color: "var(--neon-blue)" }}>No users found</div>
          <div style={{ fontSize: "16px", marginBottom: "32px" }}>Create your first user to get started</div>
          <button
            onClick={() => router.push("/users/new")}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 32px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Create First User
          </button>
        </div>
      )}
    </div>
  );
}

