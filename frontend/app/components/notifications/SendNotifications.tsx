"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { ArrowLeft, Send, ChevronDown, Users, ChevronRight, X, CheckCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationFormValues {
  title: string;
  message: string;
  userIds: number[];
}

export interface SendNotificationFormProps {
  initialValues?: Partial<NotificationFormValues>;
  onSubmit: (values: NotificationFormValues) => Promise<void>;
  submitLabel?: string;
  loadingLabel?: string;
  heading?: string;
  subheading?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
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

// ── Apartment Dropdown ────────────────────────────────────────────────────────

function ApartmentDropdown({
  properties,
  value,
  onChange,
}: {
  properties: Property[];
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

  const selectedTitle = properties.find((p) => p.id === value)?.title || "All Properties";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #ccc3d8",
          background: "#ffffff",
          color: "#191c20",
          fontSize: "14px",
          fontWeight: 400,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          fontFamily: "'Inter', sans-serif",
          textAlign: "left",
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
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            maxHeight: "220px",
            overflowY: "auto",
            borderRadius: "8px",
            background: "#ffffff",
            border: "1px solid #ccc3d8",
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          }}
        >
          {[{ id: "" as "", title: "All Properties" }, ...properties].map((p) => (
            <div
              key={p.id}
              onClick={() => { onChange(p.id as number | ""); setOpen(false); }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                color: "#191c20",
                fontSize: "14px",
                borderBottom: "1px solid #f2f3f9",
                background: value === p.id ? "#eaddff" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (value !== p.id) e.currentTarget.style.background = "#f2f3f9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === p.id ? "#eaddff" : "transparent"; }}
            >
              {p.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared field styles ───────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#191c20",
  marginBottom: "8px",
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #ccc3d8",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#191c20",
  fontSize: "14px",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

// ── Main Form ─────────────────────────────────────────────────────────────────

export default function SendNotificationForm({
  initialValues,
  onSubmit,
  submitLabel = "Send Now",
  loadingLabel = "Sending…",
  heading = "Send Notification",
  subheading = "Send important updates and announcements to users.",
}: SendNotificationFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [message, setMessage] = useState(initialValues?.message ?? "");
  const [selectedUsers, setSelectedUsers] = useState<number[]>(initialValues?.userIds ?? []);

  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filterPropertyId, setFilterPropertyId] = useState<number | "">("");
  const [filterFloor, setFilterFloor] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/properties").then((r) => setProperties(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setUsersLoading(true);
        const params = new URLSearchParams();
        if (filterPropertyId) params.append("propertyId", filterPropertyId.toString());
        if (filterFloor) params.append("floor", filterFloor);
        const res = await api.get(`/api/notifications/users?${params}`);
        if (!cancelled) setUsers(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load users");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterPropertyId, filterFloor]);

  const toggleUser = (id: number) =>
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map((u) => u.id));

  const handleSubmit = async () => {
    if (!message.trim() || !title.trim() || !selectedUsers.length) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit({ title: title.trim(), message: message.trim(), userIds: selectedUsers });
      setSuccessMsg(`Message sent successfully to ${selectedUsers.length} residents!`);
      setMessage("");
      setTitle("");
      setSelectedUsers([]);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const canSend = !loading && !!message.trim() && !!title.trim() && selectedUsers.length > 0;

  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#191c20" }}>

      {/* ── Toast ── */}
      {successMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#d3e3ff",
            color: "#0b1c30",
            fontSize: "15px",
            fontWeight: 500,
            marginBottom: "24px",
            border: "1px solid #b7c7e2",
          }}
        >
          <CheckCircle size={18} style={{ color: "#4800a0", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4a4455", display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#ffdad6",
            color: "#93000a",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "20px",
            border: "1px solid #f8b4b4",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Breadcrumb + page heading ── */}
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "32px",
    fontFamily: "'Inter', sans-serif",
  }}
>
  {/* Left side */}
  <div>
    <h2
      style={{
        fontSize: "18px",
        color: "var(--neon-blue)",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: "40px",
        margin: 0,
      }}
    >
      {heading}
    </h2>

    <p
      style={{
        fontSize: "12px",
        color: "#4a4455",
        margin: 0,
      }}
    >
      {subheading}
    </p>
  </div>

  {/* Right side */}
  <button
    type="button"
    onClick={() => router.push("/messages")}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: "none",
      border: "1px solid var(--neon-blue)",
      padding: "7px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      color: "var(--neon-blue)",
      fontSize: "14px",
      fontWeight: 600,
      transition: "color 0.15s",
    }}
    onMouseOver={(e) => (e.currentTarget.style.color = "var(--neon-blue)")}
    onMouseOut={(e) => (e.currentTarget.style.color = "#4a4455")}
  >
    <ArrowLeft size={18} />
    Back
  </button>
</div>

      {/* ── Filter section ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ccc3d8",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto auto",
          gap: "24px",
          alignItems: "end",
        }}
      >
        <div>
          <label style={fieldLabelStyle}>Apartment</label>
          <ApartmentDropdown
            properties={properties}
            value={filterPropertyId}
            onChange={setFilterPropertyId}
          />
        </div>
        <div>
          <label style={fieldLabelStyle}>Floor</label>
          <input
            type="text"
            placeholder="e.g. 2nd Floor"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            style={inputBaseStyle}
            onFocus={(e) => (e.target.style.borderColor = "#4800a0")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
          />
        </div>
        <button
  type="button"
  onClick={() => {
    setFilterPropertyId("");
    setFilterFloor("");
  }}
  style={{
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #ccc3d8",
    background: "transparent",
    color: "#4a4455",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
    transition: "background 0.15s, color 0.15s",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.background = "#e7e8ee"; 
    e.currentTarget.style.color = "#2f2a36";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.color = "#4a4455";
  }}
>
  Clear Filters
</button>
      </div>

      {/* ── Two-column grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "5fr 7fr",
          gap: "24px",
          alignItems: "start",
          marginBottom: "24px",
        }}
      >
        {/* Recipients column */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #ccc3d8",
            borderRadius: "12px",
            overflow: "hidden",
            height: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Column header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #ccc3d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="checkbox"
                id="select-all"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={selectAll}
                style={{ width: 14, height: 14, accentColor: "var(--neon-blue)", cursor: "pointer" }}
              />
              <label
                htmlFor="select-all"
                style={{ fontSize: "16px", fontWeight: 700, color: "#191c20", cursor: "pointer" }}
              >
                Recipients
              </label>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "#eae7f0",
                color: "var(--neon-blue)",
              }}
            >
              {selectedUsers.length} / {users.length} Selected
            </span>
          </div>

          {/* Scrollable list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {usersLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#7b7487", fontSize: "14px" }}>
                Loading residents…
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#7b7487", fontSize: "14px" }}>
                No residents match the current filters.
              </div>
            ) : (
              users.map((u) => {
                const checked = selectedUsers.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderBottom: "1px solid #f2f3f9",
                      cursor: "pointer",
                      background: checked ? "rgba(234,221,255,0.25)" : "transparent",
                      borderLeft: checked ? "3px solid var(--neon-blue)" : "3px solid transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked) e.currentTarget.style.background = "#f2f3f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = checked ? "rgba(234,221,255,0.25)" : "transparent";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(u.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 14, height: 14, accentColor: "var(--neon-blue)", cursor: "pointer", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#191c20",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name}
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                        {u.userProperties.map((up) => (
                          <span key={up.property.id} style={{ display: "inline-flex", gap: "4px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "#e8dff4",
                                color: "#1e1928",
                              }}
                            >
                              {up.property.title}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "#d3e3ff",
                                color: "#0b1c30",
                              }}
                            >
                              {up.property.floor}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Compose column */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #ccc3d8",
            borderRadius: "12px",
            overflow: "hidden",
            height: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Column header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #ccc3d8",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#191c20", margin: 0 }}>
              Compose Message
            </h3>
          </div>

          {/* Form body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Title field */}
            <div>
              <label style={fieldLabelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                style={inputBaseStyle}
                onFocus={(e) => (e.target.style.borderColor = "#4800a0")}
                onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
              />
            </div>

            {/* Message field */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label style={fieldLabelStyle}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                style={{
                  ...inputBaseStyle,
                  flex: 1,
                  resize: "none",
                  lineHeight: "1.6",
                  minHeight: "160px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4800a0")}
                onBlur={(e) => (e.target.style.borderColor = "#ccc3d8")}
              />
            </div>

            {/* Footer: recipient info + actions */}
            <div
              style={{
                borderTop: "1px solid #ccc3d8",
                paddingTop: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4a4455", fontSize: "14px" }}>
                <Users size={16} style={{ color: "#4a4455", flexShrink: 0 }} />
                Sending to{" "}
                <strong style={{ color: "var(--neon-blue)" }}>
                  {selectedUsers.length} resident{selectedUsers.length !== 1 ? "s" : ""}
                </strong>{" "}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  style={{
                    padding: "7px 20px",
                    borderRadius: "8px",
                    border: "1px solid #ccc3d8",
                    background: "transparent",
                    color: "#4a4455",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f2f3f9")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSend}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: canSend
                              ? "linear-gradient(to right, var(--neon-blue), var(--neon-purple))"
                              : "#e5e7eb",
                    color: canSend ? "#ffffff" : "#7b7487",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: canSend ? "pointer" : "not-allowed",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: canSend ? "0 4px 14px rgba(99,14,212,0.25)" : "none",
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                  onMouseOver={(e) => { if (canSend) e.currentTarget.style.opacity = "0.9"; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <Send size={16} />
                  {loading ? loadingLabel : submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}