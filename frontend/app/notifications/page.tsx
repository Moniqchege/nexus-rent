"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";

interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  tenant: { name: string; email: string };
  property: { title: string; location: string };
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  property: { title: string; location: string };
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "messages">("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuthStore();

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    } else {
      fetchTenants();
    }
  }, [activeTab]);

  const fetchReviews = async () => {
  try {
    const token = sessionStorage.getItem("token");
    const res = await fetch("http://localhost:4000/notifications/reviews", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch reviews");
    }

    const data = await res.json();

    setReviews(data);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Failed to load reviews");
  }
};

  const fetchTenants = async () => {
    try {
    const token = sessionStorage.getItem("token");
    const res = await fetch("http://localhost:4000/notifications/tenants", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch tenants");
    }

    const data = await res.json();

    setReviews(data);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Failed to load tenants");
  }
  };

  const sendMessage = async () => {
  if (!message.trim() || selectedTenants.length === 0) return;

  setLoading(true);
  try {
    const token = sessionStorage.getItem("token");
    if (!token) throw new Error("Missing auth token");

    const res = await fetch("http://localhost:4000/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
        tenantIds: selectedTenants,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to send message");
    }

    // Clear input & refresh tenants
    setMessage("");
    setSelectedTenants([]);
    setError("Message sent successfully!");
    fetchTenants();
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Failed to send message");
  } finally {
    setLoading(false);
  }
};

  const toggleTenant = (tenantId: number) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const selectAllTenants = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map(t => t.id));
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">🔔 NOTIFICATIONS DASHBOARD</div>

      {error && (
        <div className="glass-panel" style={{ marginBottom: "24px", padding: "16px", color: "var(--accent-danger)" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px", borderBottom: "1px solid var(--border-glow)" }}>
        <button 
          className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
          style={{ padding: "12px 24px", border: "none", background: "none", cursor: "pointer" }}
        >
          <img
      src="/notifications-icon.png"
      alt="Tenant Reviews"
      style={{ width: "20px", height: "20px", marginRight: "8px", verticalAlign: "middle"  }}
    />
          Tenant Reviews ({reviews.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
          onClick={() => setActiveTab("messages")}
          style={{ padding: "12px 24px", border: "none", background: "none", cursor: "pointer" }}
        >
           <img
      src="/message-icon.png"
      alt="Send Messages"
      style={{ width: "20px", height: "20px", marginRight: "8px", verticalAlign: "middle"  }}
    />
           Send Messages ({tenants.length} tenants)
        </button>
      </div>

      {activeTab === "reviews" && (
        <div>
          <div className="section-label" style={{ marginBottom: "16px" }}>Latest Reviews</div>
          {reviews.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "64px 32px", color: "var(--text-secondary)" }}>
              No reviews yet. Tenants will leave reviews here.
            </div>
          ) : (
            <div className="glass-panel" style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-glow)" }}>
                    <th style={{ padding: "16px 20px 12px 0", textAlign: "left", fontWeight: 600 }}>Property</th>
                    <th style={{ padding: "16px 20px 12px 0", textAlign: "left", fontWeight: 600 }}>Tenant</th>
                    <th style={{ padding: "16px 20px 12px 0", textAlign: "left", fontWeight: 600 }}>Rating</th>
                    <th style={{ padding: "16px 20px 12px 0", textAlign: "left", fontWeight: 600 }}>Comment</th>
                    <th style={{ padding: "16px 20px 12px 0", textAlign: "left", fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "16px 20px 16px 0" }}>
                        <div>{review.property.title}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{review.property.location}</div>
                      </td>
                      <td style={{ padding: "16px 20px 16px 0" }}>
                        <div style={{ fontWeight: 500 }}>{review.tenant.name}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{review.tenant.email}</div>
                      </td>
                      <td style={{ padding: "16px 20px 16px 0" }}>
                        <div style={{ 
                          color: review.rating >= 4 ? "var(--accent-success)" : "var(--accent-warning)",
                          fontWeight: 600,
                          fontSize: "16px"
                        }}>
                          ★ {review.rating}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px 16px 0", maxWidth: "300px" }}>
                        {review.comment || "No comment"}
                      </td>
                      <td style={{ padding: "16px 20px 16px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div>
          <div className="section-label" style={{ marginBottom: "16px" }}>Send Message to Tenants</div>
          
          {tenants.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "64px 32px", color: "var(--text-secondary)" }}>
              No tenants yet. Add properties and tenants to send messages.
            </div>
          ) : (
            <div>
              <div className="glass-panel" style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedTenants.length === tenants.length && tenants.length > 0}
                    onChange={selectAllTenants}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <label htmlFor="select-all" style={{ fontWeight: 500, cursor: "pointer" }}>
                    Select All ({selectedTenants.length} / {tenants.length})
                  </label>
                </div>
                
                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="tenant-item">
                      <input
                        type="checkbox"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={() => toggleTenant(tenant.id)}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{tenant.name}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{tenant.email}</div>
                        <div style={{ fontSize: "13px", color: "var(--neon-blue)" }}>
                          {tenant.property.title} • {tenant.property.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... (e.g. Rent due tomorrow, maintenance scheduled...)"
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "16px",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: "14px"
                  }}
                  rows={4}
                />
                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <button
                    onClick={sendMessage}
                    disabled={loading || !message.trim() || selectedTenants.length === 0}
                    style={{
                      padding: "12px 32px",
                      background: "linear-gradient(135deg, var(--neon-blue), var(--neon-purple))",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading || !message.trim() || selectedTenants.length === 0 ? 0.6 : 1
                    }}
                  >
                    {loading ? "Sending..." : `Send to ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

