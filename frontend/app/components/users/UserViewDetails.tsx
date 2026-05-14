"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useAdminStore } from "@/app/store/adminStore";

type UserLike = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  username?: string;
  createdAt?: string;
  isLocked?: boolean;
  role?: string;
};

type DialogAction = "lock" | "unlock" | "killSessions" | "resetPassword" | null;

// ── Inline style tokens ──────────────────────────────────────────────────────
const C = {
  blue:        "#2A5CAA",
  cyan:        "#00A5E4",
  bgPage:      "#0D1117",
  bgCard:      "#111827",
  bgCardAlt:   "rgba(0,165,228,0.06)",
  border:      "#1E3A5F",
  borderCyan:  "rgba(0,165,228,0.35)",
  textPrimary: "#E2E8F0",
  textMuted:   "#94A3B8",
  textLabel:   "#64748B",
  white:       "#FFFFFF",
};

const s = {
  page: {
    minHeight: "100vh",
    paddingLeft: "0px",
    backgroundColor: C.bgPage,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    transition: "padding-left 0.3s",
  } as React.CSSProperties,

  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 24px 40px",
  } as React.CSSProperties,

  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  } as React.CSSProperties,

  heading: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: C.cyan,
    textTransform: "uppercase" as const,
  },

  subheading: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: C.textMuted,
  } as React.CSSProperties,

  backBtn: {
    background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "12px 24px",
    fontSize: "14px"
  } as React.CSSProperties,

  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "16px",
    flexWrap: "wrap" as const,
  },

  avatarWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: C.blue,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "18px",
    color: C.white,
    fontWeight: 700,
  } as React.CSSProperties,

  nameBlock: {
    display: "flex",
    flexDirection: "column" as const,
    marginLeft: "8px",
    minWidth: 0,
  },

  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: C.cyan,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  },

  statusBadge: (locked: boolean): React.CSSProperties => ({
    marginTop: "4px",
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: "999px",
    textAlign: "center",
    color: locked ? "#FCA5A5" : "#6EE7B7",
    backgroundColor: locked ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
    border: `1px solid ${locked ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),

  columnsWrap: {
    display: "flex",
    flex: 1,
    gap: "12px",
    flexWrap: "wrap" as const,
  },

  dataBox: {
    flex: 1,
    minWidth: "200px",
    border: `1px solid ${C.borderCyan}`,
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: C.bgCardAlt,
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,

  dataLabel: {
    fontSize: "11px",
    fontWeight: 400,
    color: C.textLabel,
    minWidth: "90px",
  } as React.CSSProperties,

  dataValue: {
    fontSize: "11px",
    fontWeight: 600,
    color: C.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: "200px",
    textAlign: "right" as const,
  },

  // ── Action buttons ──
  actionsWrap: {
    marginLeft: "auto",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },

 actionBtn: {
  background: 'rgba(0, 240, 255, 0.05)',
  color: 'var(--neon-blue)',
  border: '1px solid rgba(0, 240, 255, 0.25)',
  borderRadius: '10px',
  padding: '8px 16px',
  fontSize: '12px',
  fontFamily: `'Orbitron', monospace`,
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',

  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px', 
} as React.CSSProperties,

  // ── Summary card ──
  summaryCard: {
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "12px",
  } as React.CSSProperties,

  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 8px",
    borderBottom: `1px solid ${C.border}`,
  } as React.CSSProperties,

  summaryTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    color: C.blue,
  } as React.CSSProperties,

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    padding: "14px 16px",
  } as React.CSSProperties,

  // ── Empty state ──
  emptyCard: {
    backgroundColor: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "60px",
    textAlign: "center" as const,
  },
};

// ── SVG icon components (no broken img paths) ─────────────────────────────
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconUnlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconKill = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────
export default function UserViewDetails({ user }: { user: UserLike | null }) {
  const router = useRouter();
  const { lockUnlockUser, killUserSessions, resetUserPassword, loading: storeLoading } = useAdminStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);

  const displayStatus = useMemo(() => {
    if (!user) return "-";
    return user.isLocked ? "Locked" : "Active";
  }, [user]);

  const openDialog = (action: Exclude<DialogAction, null>) => {
    if (!user?.id) return;
    setSelectedUserId(user.id);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUserId(null);
    setDialogAction(null);
  };

  const confirmAction = async () => {
    if (selectedUserId == null || !dialogAction) return;
    if (dialogAction === "lock")          await lockUnlockUser(selectedUserId, true);
    else if (dialogAction === "unlock")   await lockUnlockUser(selectedUserId, false);
    else if (dialogAction === "killSessions")  await killUserSessions(selectedUserId);
    else if (dialogAction === "resetPassword") await resetUserPassword(selectedUserId);
    closeDialog();
  };

  if (!user) {
    return (
      <section style={s.page}>
        <div style={s.inner}>
          <div style={s.emptyCard}>
            <span style={{ color: C.cyan, fontSize: "15px" }}>User not found</span>
          </div>
        </div>
      </section>
    );
  }

  const locked = Boolean(user.isLocked);
  const initials = (user.name ?? "?").charAt(0).toUpperCase();

  // ── Dialog meta ──
  const dialogMeta: Record<Exclude<DialogAction, null>, { title: string; message: string; confirmText: string }> = {
    lock:          { title: "Lock User",           message: "This will lock the user account and invalidate their sessions.", confirmText: "Lock" },
    unlock:        { title: "Unlock User",          message: "This will unlock the user account.",                            confirmText: "Unlock" },
    killSessions:  { title: "Kill User Sessions",   message: "This will terminate all active sessions for this user.",       confirmText: "Kill" },
    resetPassword: { title: "Reset User Password",  message: "This will reset the user password and email the new password.", confirmText: "Reset" },
  };

  return (
    <section style={{ ...s.page, paddingLeft: "0px" }}>
      {/* Offset for sidebar on large screens via a wrapper div */}
        <div style={s.inner}>

          {/* ── Top bar ── */}
          <div style={s.topBar}>
            <div>
              <h4 style={s.heading}>Users Management</h4>
              <p style={s.subheading}>User details</p>
            </div>
            <button
              type="button"
              style={s.backBtn}
              onClick={() => router.push("/users")}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1e4d99")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.blue)}
            >
              ← Back
            </button>
          </div>

          {/* ── Info card ── */}
          <div style={s.infoCard}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={s.avatarWrap}>{initials}</div>
              <div style={s.nameBlock}>
                <h4 style={s.userName}>{user.name || "-"}</h4>
                <span style={s.statusBadge(locked)}>{displayStatus}</span>
              </div>
            </div>

            {/* Data columns */}
            <div style={s.columnsWrap}>
              <div style={s.dataBox}>
                {[
                  ["Email",    user.email    || "-"],
                  ["Phone",    user.phone    || "-"],
                  ["Username", user.username || "-"],
                ].map(([label, value]) => (
                  <div key={label} style={s.dataRow}>
                    <span style={s.dataLabel}>{label}</span>
                    <span style={s.dataValue}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={s.dataBox}>
                {[
                  ["Role",       user.role || "-"],
                  ["Created At", user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"],
                  ["User ID",    String(user.id)],
                ].map(([label, value]) => (
                  <div key={label} style={s.dataRow}>
                    <span style={s.dataLabel}>{label}</span>
                    <span style={s.dataValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={s.actionsWrap}>
              {[
                { label: "Edit",           icon: <IconEdit />,   action: () => router.push(`/users/edit/${user.id}`) },
                { label: locked ? "Unlock" : "Lock", icon: locked ? <IconUnlock /> : <IconLock />, action: () => openDialog(locked ? "unlock" : "lock") },
                { label: "Reset Password", icon: <IconReset />,  action: () => openDialog("resetPassword") },
                { label: "Kill Sessions",  icon: <IconKill />,   action: () => openDialog("killSessions") },
              ].map(({ label, icon, action }) => (
                <button
                  key={label}
                  type="button"
                  style={s.actionBtn}
                  onClick={action}
                  disabled={storeLoading}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.blue)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.cyan)}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── User Summary ── */}
          <div style={s.summaryCard}>
            <div style={s.summaryHeader}>
              <h4 style={s.summaryTitle}>User Summary</h4>
            </div>
            <div style={s.summaryGrid}>
              {[
                ["Status", locked ? "Locked" : "Active"],
                ["Role",   user.role || "-"],
              ].map(([label, value]) => (
                <div key={label} style={s.dataBox}>
                  <div style={s.dataRow}>
                    <span style={s.dataLabel}>{label}</span>
                    <span style={s.dataValue}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      {/* ── Confirm Dialog ── */}
      {dialogAction && (
        <ConfirmDialog
          open={dialogOpen}
          title={dialogMeta[dialogAction].title}
          message={dialogMeta[dialogAction].message}
          onConfirm={confirmAction}
          onCancel={closeDialog}
          confirmText={dialogMeta[dialogAction].confirmText}
        />
      )}
    </section>
  );
}