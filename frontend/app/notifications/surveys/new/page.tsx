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

function CustomDropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder,
  minWidth = "120px"
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (val: T) => void;
  placeholder?: string;
  minWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div ref={ref} style={{ position: "relative", minWidth }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid var(--border-glow)",
          background: "rgba(255,255,255,0.02)",
          color: "var(--text-primary)",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {selectedLabel}
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid var(--text-primary)",
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            borderRadius: "8px",
            background: "rgb(17, 24, 39)",
            border: "1px solid var(--border-glow)",
            zIndex: 9999,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                fontSize: "13px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApartmentDropdown({
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
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            maxHeight: "250px",
            overflowY: "auto",
            borderRadius: "12px",
            background: "rgb(17, 24, 39)",
            border: "1px solid var(--border-glow)",
            zIndex: 9999,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
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

export default function NewSurveyPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ question: '', type: 'text' as 'text' | 'multiple' | 'rating' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterPropertyId, setFilterPropertyId] = useState<number | ''>('');
  const [filterFloor, setFilterFloor] = useState('');
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const { user } = useAuthStore();
  const router = useRouter();

  // Fetch properties
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

   const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterPropertyId) params.append('propertyId', filterPropertyId.toString());
      if (filterFloor) params.append('floor', filterFloor);

      const res = await api.get(`/notifications/users?${params.toString()}`);
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

  const addQuestion = () => {
    setQuestions([...questions, { question: '', type: 'text' }]);
  };

  const updateQuestion = (index: number, field: 'question' | 'type', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const sendSurvey = async () => {
    if (!title.trim() || selectedUsers.length === 0 || questions.some(q => !q.question.trim())) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/notifications/surveys/send', {
        title: title.trim(),
        questions,
        userIds: selectedUsers,
      });

      if (res.status === 201) {
        setError('Survey sent successfully!');
        setTitle('');
        setQuestions([{ question: '', type: 'text' }]);
        setSelectedUsers([]);
        fetchUsers();
        setTimeout(() => {
          router.push('/notifications/surveys');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">🛡️CREATE SURVEY</div>
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
            color: "var(--neon-purple)"
          }}
        >
          SURVEYS
        </div>

        <button
          onClick={() => router.push("/notifications/surveys")}
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
        Create New Survey
      </h3>

      {/* Title */}
      <div className="glass-panel" style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>Survey Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Monthly Satisfaction Survey, Maintenance Feedback"
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid var(--border-glow)",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-primary)",
            fontSize: "14px"
          }}
        />
      </div>

      {/* Questions */}
      <div className="glass-panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <label style={{ fontWeight: 600, fontSize: "12px" }}>Questions ({questions.length})</label>
          <button
            onClick={addQuestion}
           className="action-btn"
          >
            + Add Question
          </button>
        </div>
        {questions.map((q, index) => (
          <div key={index} style={{ border: "1px solid var(--border-glow)", borderRadius: "8px", padding: "16px", marginBottom: "12px", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ display: "block", fontWeight: 500, fontSize: "11px", marginBottom: "4px", color: "var(--neon-secondary)" }}>Question {index + 1}</label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  placeholder={`Question ${index + 1}...`}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--text-primary)",
                    fontSize: "13px"
                  }}
                />
              </div>
              <div style={{ minWidth: "120px" }}>
                <label style={{ display: "block", fontWeight: 500, fontSize: "11px", marginBottom: "4px", color: "var(--neon-secondary)" }}>Type</label>
                <CustomDropdown
  value={q.type}
  onChange={(val) => updateQuestion(index, 'type', val)}
  options={[
    { label: "Text", value: "text" },
    { label: "Multiple Choice", value: "multiple" },
    { label: "Rating (1-5)", value: "rating" },
  ]}
/>
              </div>
             {questions.length > 1 && (
  <button
    onClick={() => removeQuestion(index)}
   className="action-btn"
    title="Remove question"
  >
    ✖️
  </button>
)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Users (same as send page) */}
      <div className="glass-panel" style={{ marginBottom: "24px", position: "relative", zIndex: 100 }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "8px" }}>Filter: Apartment</label>
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

        <div className="glass-panel" style={{ textAlign: "right", marginBottom: "54px" }}>
          <button
            onClick={sendSurvey}
            disabled={loading || !title.trim() || selectedUsers.length === 0 || questions.some(q => !q.question.trim())}
            style={{
              padding: "16px 32px",
              background: loading || !title.trim() || selectedUsers.length === 0 || questions.some(q => !q.question.trim())
                ? "rgba(59,130,246,0.3)" 
                : "linear-gradient(135deg, var(--neon-purple), var(--neon-pink))",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
            }}
          >
            {loading ? "Creating..." : `Send Survey to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          background: error.includes('successfully') ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
          border: `1px solid ${error.includes('successfully') ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
          borderRadius: "8px",
          color: error.includes('successfully') ? "var(--neon-green)" : "var(--neon-red)",
          marginTop: "16px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
