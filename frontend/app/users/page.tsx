"use client";

import { useEffect } from "react";
import { useAdminStore } from "../store/adminStore";
import UserTable from "../components/users/UserTable";

export default function UsersPage() {
  const { fetchUsers, users } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="dashboard-content">
      <div className="page-tag">👥 USERS MANAGEMENT</div>
      <div className="section-label">ADMIN PANEL</div>
      
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          User Accounts ({users.length})
        </h2>
      </div>

      <UserTable />
    </div>
  );
}

