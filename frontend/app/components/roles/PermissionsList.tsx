"use client";

import { useAdminStore } from "../../store/adminStore";

interface PermissionsListProps {
  permissions: string[];
}

export default function PermissionsList({ permissions }: PermissionsListProps) {
  const { permissions: allPermissions } = useAdminStore();

  const permissionLabels = permissions.map(key => {
    const perm = allPermissions.find(p => p.key === key);
    return perm ? perm.label : key;
  });

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "12px"
    }}>
      {permissionLabels.map((label, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "rgba(124,58,237,0.2)",
            border: "1px solid var(--neon-purple)",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "13px",
            color: "var(--neon-purple)"
          }}
        >
          {label}
        </div>
      ))}
      {permissions.length === 0 && (
        <div style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          padding: "24px",
          color: "var(--text-secondary)",
          fontStyle: "italic"
        }}>
          No permissions assigned
        </div>
      )}
      {permissions.includes('*') && (
        <div style={{
          gridColumn: "1 / -1",
          backgroundColor: "rgba(0,255,163,0.2)",
          border: "1px solid var(--accent-success)",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          fontWeight: 600,
          color: "var(--accent-success)"
        }}>
          🌟 FULL ACCESS (All permissions)
        </div>
      )}
    </div>
  );
}

