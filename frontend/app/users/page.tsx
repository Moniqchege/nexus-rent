"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../store/adminStore";
import SearchBar from "../components/ui/SearchBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import UserTable from "../components/users/UserTable";

export default function UsersPage() {
  const { fetchUsers, users, deleteUser, loading: storeLoading } = useAdminStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers("");
  }, []);

  const handleDeleteClick = (userId: number) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUserId !== null) {
      await deleteUser(selectedUserId);
      setDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  const handleCancelDelete = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div className="page-tag">👥 USERS MANAGEMENT</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          // marginBottom: "24px",
        }}
      >
        <div className="section-label">ADMIN PANEL</div>

        <button
          onClick={() => router.push("/users/new")}
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
          + New User
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          User Accounts ({filteredUsers.length})
        </h2>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search users by name or email..."
      />

      <UserTable 
        onDeleteClick={handleDeleteClick}
        users={filteredUsers}
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

