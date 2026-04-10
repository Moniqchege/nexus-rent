"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';

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
    }
  }[];
}

interface Property {
  id: number;
  title: string;
}

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTitle =
    properties.find((p) => p.id === value)?.title || "Select an apartment";

 return (
  <div ref={ref} style={{ position: "relative", minWidth: "420px" }}>
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: "12px",
        borderRadius: "12px",
        border: "1px solid var(--border-glow)",
        background: "rgba(255,255,255,0.03)",
        color: "var(--text-primary)",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {selectedTitle}
      <span
        style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid var(--text-primary)",
        }}
      />
    </div>

    {open && (
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 4px)", // Small gap below the input
          left: 0,
          width: "100%",
          maxHeight: "250px",      // Fixed height
          overflowY: "auto",
          borderRadius: "12px",
          background: "rgb(17, 24, 39)", // Pure solid background
          border: "1px solid var(--border-glow)",
          zIndex: 9999,            // Extremely high to clear all cards
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)", // Adds depth so it looks "on top"
        }}
      >
        {properties.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              onChange(p.id);
              setOpen(false);
            }}
            style={{
              padding: "12px",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontSize: "14px",
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {p.title}
          </div>
        ))}
      </div>
    )}
  </div>
);
}

export default function SendNotificationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState<number | ''>('');
  const [filterFloor, setFilterFloor] = useState('');
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState('');

  // Fetch properties for filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/api/properties');
        setProperties(res.data);
      } catch (err) {
        setError('Failed to load properties');
      } finally {
        setPropertiesLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch users with filters
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterPropertyId) params.append('propertyId', filterPropertyId.toString());
      if (filterFloor) params.append('floor', filterFloor);

      const res = await api.get(`/api/notifications/users?${params.toString()}`);
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterPropertyId, filterFloor]);

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || selectedUsers.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/notifications/send', {
        title: title.trim(),
        message: message.trim(),
        userIds: selectedUsers,
      });

      if (res.status === 201) {
        setError('Message sent successfully!');
        setMessage('');
        setSelectedUsers([]);
        fetchUsers(); 
        setTimeout(() => setError(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">📡 SEND NOTIFICATION</div>
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
            fontSize: "16px",
            color: "var(--neon-blue)"
          }}
        >
          NOTIFICATIONS
        </div>

        <button
          onClick={() => router.push("/notifications")}
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
      <h3 style={{ 
        fontSize: "20px", 
        fontWeight: 700, 
        background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "10px"
      }}>
       Send New Message
      </h3>

      {/* Filters */}
      <div className="glass-panel" style={{ marginBottom: "24px", position: "relative", zIndex: 100, isolation: "isolate" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>Apartment</label>
             <ApartmentDropdown
    properties={properties}
    value={filterPropertyId}
    onChange={setFilterPropertyId}
  />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>Floor</label>
            <input
              type="text"
              placeholder="e.g. 1, 2nd, Ground"
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              style={{
                minWidth: "420px",
                padding: "12px",
                border: "1px solid var(--border-glow)",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-primary)"
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
        {/* Users List */}
        <div className="glass-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <input
              type="checkbox"
              id="select-all"
              checked={selectedUsers.length === users.length && users.length > 0}
              onChange={selectAllUsers}
              style={{ width: "14px", height: "14px", accentColor: "var(--neon-blue)" }}
            />
            <label htmlFor="select-all" style={{ fontWeight: 500, fontSize: "14px", cursor: "pointer" }}>
              Select All ({selectedUsers.length} / {users.length})
            </label>
          </div>
          
          {usersLoading ? (
            <div>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px", color: "var(--text-secondary)" }}>
              No users match filters
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflow: "auto" }}>
              {users.map((user) => (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    style={{ width: "14px", height: "14px", accentColor: "var(--neon-blue)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: "12px" }}>{user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{user.email}</div>
                  </div>
                  {user.userProperties.map(up => (
                    <div key={up.property.id} style={{ fontSize: "12px", color: "var(--neon-purple)" }}>
                      {up.property.title} ({up.property.floor})
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message & Send */}
        <div className="glass-panel" style={{marginBottom: "40px"}}>
        <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>Message Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rent Reminder, Water Shutdown Notice"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid var(--border-glow)",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-primary)",
            marginBottom: "24px",
            fontSize: "14px"
          }}
        />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            style={{
              width: "100%",
              minHeight: "50px",
              padding: "16px",
              border: "1px solid var(--border-glow)",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-primary)",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "14px"
            }}
            // rows={2}
          />
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim() || !title.trim() || selectedUsers.length === 0}
              style={{
                padding: "12px 32px",
                background: loading || !message.trim() || selectedUsers.length === 0 
                  ? "rgba(59,130,246,0.3)" 
                  : "linear-gradient(135deg, var(--neon-blue), var(--neon-purple))",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending..." : `Send to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
