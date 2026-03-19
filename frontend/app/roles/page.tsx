"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import { useRouter } from "next/navigation";
import SearchBar from "../components/ui/SearchBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function RolesPage() {
  const { fetchRoles, roles, deleteRole, permissions } = useAdminStore();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeleteClick = (roleId: number) => {
    setSelectedRoleId(roleId);
    setDialogOpen(true);
  };

   const handleConfirmDelete = () => {
    if (selectedRoleId !== null) {
      deleteRole(selectedRoleId);
      setDialogOpen(false);
      setSelectedRoleId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedRoleId(null);
  };

  // const handleDelete = (roleId: number) => {
  //   if (confirm("Are you sure you want to delete this role?")) {
  //     deleteRole(roleId);
  //   }
  // };

  const formatPermissions = (permKeys: string[]) => {
  if (permKeys.includes("*")) return "All Permissions";

  if (permKeys.length === 0) return "-";

  const first = permissions.find(p => p.key === permKeys[0]);
  const firstLabel = first ? first.label : permKeys[0];

  const remainingCount = permKeys.length - 1;

  return remainingCount > 0
    ? `${firstLabel} +${remainingCount}`
    : firstLabel;
};

const filteredRoles = roles.filter((role) =>
  role.name.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="dashboard-content">
      <div className="page-tag">🎭 ROLES & PERMISSIONS</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
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
            fontSize: "14px",
          }}
        >
          + New Role
        </button>
      </div>

      <SearchBar
  value={search}
  onChange={setSearch}
  placeholder="Search roles..."
/>

      {roles.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="table-head">
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
              <th>#</th>
              <th style={{ padding: "12px" }}>Role Name</th>
              <th style={{ padding: "12px" }}>Role Code</th>
              <th style={{ padding: "12px" }}>Description</th>
              <th style={{ padding: "12px" }}>Permission Count</th>
              <th style={{ padding: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role, index) => (
              <tr
                key={role.id}
                style={{ borderBottom: "1px solid var(--border-glow)", backgroundColor: "rgba(17,24,39,0.8)" }}
              >
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
        {index + 1}
      </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                  {role.name || "-"}
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                  {role.code || "-"}
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {role.description || "No description"}
                </td>
                <td
  style={{ padding: "12px", fontSize: "12px", }}
  title={role.permissions.join(", ")}
>
  {formatPermissions(role.permissions)}
</td>
               <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
  <button
    className="action-btn"
    onClick={() => router.push(`/roles/edit/${role.id}`)}
  >
    View
  </button>

  <button
    className="action-btn"
    onClick={() => router.push(`/roles/edit/${role.id}`)}
  >
    Edit
  </button>

  <button
    className="action-btn"
    onClick={() => handleDeleteClick(role.id)}
  >
    Delete
  </button>
  <ConfirmDialog
        open={dialogOpen}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            padding: "80px 40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "20px", marginBottom: "16px" }}>🎭 No roles defined</div>
          <p style={{ fontSize: "16px", marginBottom: "1px" }}>Create your first role to manage permissions</p>
          <button
            onClick={() => router.push("/roles/new")}
            style={{
              background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px 32px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "pointer",
              marginTop: "14px",
            }}
          >
            Create First Role
          </button>
        </div>
      )}
    </div>
  );
}