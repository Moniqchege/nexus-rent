"use client";

import { useRouter } from "next/navigation";
import { useAdminStore } from "../../store/adminStore";
import UserForm from "../../components/users/UserForm";

export default function NewUserPage() {
  const router = useRouter();
  const { createUser } = useAdminStore();

  const handleCreateUser = async (userData: any) => {
    await createUser(userData);
    router.push("/users"); 
  };

  return (
    <div className="dashboard-content">
      {/* Section label with back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--neon-blue)"
          }}
        >
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

      {/* Main heading */}
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#000000",
          marginBottom: "32px"
        }}
      >
        Create User
      </h2>

      <UserForm
        onSubmit={handleCreateUser}
        onCancel={() => router.push("/users")}
      />
    </div>
  );
}

