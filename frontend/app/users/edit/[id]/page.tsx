"use client";

import UserForm from "@/app/components/users/UserForm";
import { useAdminStore } from "@/app/store/adminStore";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { users, fetchUser, updateUser } = useAdminStore();

 useEffect(() => {
  if (!userId) return;

  fetchUser(userId)
    .then((user) => setEditingUser(user))
    .catch(() => router.push("/users"))
    .finally(() => setLoading(false));
}, [userId]);

  const handleUpdate = async (userData: any) => {
    await updateUser(userId, userData);
    router.push("/users");
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--neon-blue)" }}>Loading...</div>;
  if (!editingUser) return <div>User not found</div>;

  return (
    <div className="dashboard-content">
      <div className="page-tag">👥 USERS MANAGEMENT</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--neon-blue)" }}>
          ADMIN PANEL
        </div>
        <button 
          onClick={() => router.push("/users")} 
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "12px 24px",
            fontSize: "14px"
          }}
        >
          ← Back
        </button>
      </div>
      <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-purple)", marginBottom: "32px" }}>
        Edit User
      </h2>
      <UserForm 
        onSubmit={handleUpdate} 
        onCancel={() => router.push("/users")} 
        editingUser={editingUser}
        isEdit={true}
      />
    </div>
  );
}

