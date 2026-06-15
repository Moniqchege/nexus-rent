"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import api from "@/app/lib/api";
import { ArrowLeft, Send, ChevronDown, Users } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  userProperties: {
    property: {
      id: number;
      title: string;
      floor: string;
    };
  }[];
}

interface Property {
  id: number;
  title: string;
}

// ── Apartment dropdown ────────────────────────────────────────────────────────
export function ApartmentDropdown({
  properties,
  value,
  onChange,
}: {
  properties: { id: number; title: string }[];
  value: number | "";
  onChange: (id: number | "") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedTitle =
    properties.find((p) => p.id === value)?.title || "All apartments";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: "220px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #ccc3d8",
          background: "#ffffff",
          color: "#0b1c30",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {selectedTitle}
        <ChevronDown
          size={15}
          style={{
            color: "#7b7487",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxHeight: "220px",
            overflowY: "auto",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #ccc3d8",
            zIndex: 9999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          {[{ id: "" as "", title: "All apartments" }, ...properties].map((p) => (
            <div
              key={p.id}
              onClick={() => { onChange(p.id as number | ""); setOpen(false); }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                color: "#0b1c30",
                fontSize: "14px",
                borderBottom: "1px solid #e5eeff",
                background: value === p.id ? "#eff4ff" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9ff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  value === p.id ? "#eff4ff" : "transparent")
              }
            >
              {p.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
  <label
    style={{
      display: "block",
      fontSize: "12px",
      fontWeight: 600,
      color: "#7b7487",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: "8px",
    }}
  >
    {children}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #ccc3d8",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#0b1c30",
  fontSize: "14px",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SendNotificationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [filterPropertyId, setFilterPropertyId] = useState<number | "">("");
  const [filterFloor, setFilterFloor] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/api/properties").then((r) => setProperties(r.data)).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (filterPropertyId) params.append("propertyId", filterPropertyId.toString());
      if (filterFloor) params.append("floor", filterFloor);
      const res = await api.get(`/api/notifications/users?${params}`);
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterPropertyId, filterFloor]);

  const toggleUser = (id: number) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () =>
    setSelectedUsers(
      selectedUsers.length === users.length ? [] : users.map((u) => u.id)
    );

  const sendMessage = async () => {
    if (!message.trim() || !title.trim() || !selectedUsers.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/notifications/send", {
        title: title.trim(),
        message: message.trim(),
        userIds: selectedUsers,
      });
      if (res.status === 201) {
        setSuccessMsg("Message sent successfully!");
        setMessage("");
        setTitle("");
        setSelectedUsers([]);
        fetchUsers();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const canSend = !loading && !!message.trim() && !!title.trim() && selectedUsers.length > 0;

  return (
    <>
      {/* Card header */}
      <div
        style={{
          padding: "28px 32px",
          borderBottom: "1px solid #e5eeff",
          background: "#f8f9ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(99,14,212,0.1)",
              color: "#630ed4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              send
            </span>
          </div>
          <div>
            <h3
              style={{ fontSize: "18px", fontWeight: 700, color: "#0b1c30", margin: 0 }}
            >
              Send Notification
            </h3>
            <p style={{ fontSize: "13px", color: "#4a4455", marginTop: "2px" }}>
              Compose and deliver a message to selected residents.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/notifications")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "#ffffff",
            color: "#0b1c30",
            border: "1px solid #ccc3d8",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: "28px 32px" }}>
        {/* Toasts */}
        {successMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#d1fae5",
              color: "#065f46",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "20px",
              border: "1px solid #6ee7b7",
            }}
          >
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fde8e8",
              color: "#9b1c1c",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "20px",
              border: "1px solid #f8b4b4",
            }}
          >
            {error}
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5eeff",
            background: "#f8f9ff",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#7b7487",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            Filter Recipients
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <Label>Apartment</Label>
              <ApartmentDropdown
                properties={properties}
                value={filterPropertyId}
                onChange={setFilterPropertyId}
              />
            </div>
            <div>
              <Label>Floor</Label>
              <input
                type="text"
                placeholder="e.g. 1, 2nd, Ground"
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                style={{ ...inputStyle, minWidth: "180px" }}
                onFocus={(e) => (e.target.style.borderColor = "#630ed4")}
                onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
              />
            </div>
          </div>
        </div>

        {/* Two columns: recipients + compose */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* Recipients */}
          <div
            style={{
              border: "1px solid #e5eeff",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid #e5eeff",
                background: "#f8f9ff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={selectAll}
                  style={{ width: 15, height: 15, accentColor: "#630ed4", cursor: "pointer" }}
                />
                <label
                  htmlFor="select-all"
                  style={{ fontSize: "13px", fontWeight: 600, color: "#0b1c30", cursor: "pointer" }}
                >
                  Recipients
                </label>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: selectedUsers.length > 0 ? "#ede0ff" : "#e5eeff",
                  color: "#630ed4",
                }}
              >
                {selectedUsers.length} / {users.length}
              </span>
            </div>

            <div style={{ maxHeight: "380px", overflowY: "auto" }}>
              {usersLoading ? (
                <div
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#7b7487",
                    fontSize: "14px",
                  }}
                >
                  Loading residents…
                </div>
              ) : users.length === 0 ? (
                <div
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#7b7487",
                    fontSize: "14px",
                  }}
                >
                  No residents match filters.
                </div>
              ) : (
                users.map((u, i) => (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 18px",
                      borderBottom: i < users.length - 1 ? "1px solid #e5eeff" : "none",
                      cursor: "pointer",
                      background: selectedUsers.includes(u.id) ? "#f8f4ff" : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedUsers.includes(u.id))
                        e.currentTarget.style.background = "#f8f9ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selectedUsers.includes(u.id)
                        ? "#f8f4ff"
                        : "transparent";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 15, height: 15, accentColor: "#630ed4", cursor: "pointer", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#0b1c30",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#7b7487" }}>{u.email}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                      {u.userProperties.map((up) => (
                        <span
                          key={up.property.id}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "5px",
                            background: "#eff4ff",
                            color: "#630ed4",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {up.property.title} · {up.property.floor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Compose */}
          <div
            style={{
              border: "1px solid #e5eeff",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e5eeff",
                background: "#f8f9ff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0b1c30",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#630ed4" }}>
                edit
              </span>
              Compose Message
            </div>

            <div style={{ padding: "18px" }}>
              <div style={{ marginBottom: "16px" }}>
                <Label>Title</Label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rent Reminder, Water Shutdown Notice"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#630ed4")}
                  onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <Label>Message</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here…"
                  rows={8}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: "1.6",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#630ed4")}
                  onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
                />
              </div>

              {selectedUsers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#eff4ff",
                    border: "1px solid #d2bbff",
                    fontSize: "13px",
                    color: "#4a4455",
                    marginBottom: "16px",
                  }}
                >
                  <Users size={14} style={{ color: "#630ed4", flexShrink: 0 }} />
                  Sending to{" "}
                  <strong style={{ color: "#0b1c30" }}>
                    {selectedUsers.length} resident
                    {selectedUsers.length !== 1 ? "s" : ""}
                  </strong>
                </div>
              )}

              <button
                onClick={sendMessage}
                disabled={!canSend}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: canSend ? "#630ed4" : "#e5eeff",
                  color: canSend ? "#ffffff" : "#7b7487",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: canSend ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s",
                  boxShadow: canSend ? "0 4px 14px rgba(99,14,212,0.25)" : "none",
                }}
              >
                <Send size={15} />
                {loading
                  ? "Sending…"
                  : selectedUsers.length > 0
                  ? `Send to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? "s" : ""}`
                  : "Select recipients to send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}