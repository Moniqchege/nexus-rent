"use client";

import { useState, useEffect } from "react";
import api from "../lib/api";
import { useRouter } from "next/navigation";
import { Plus, Mail } from "lucide-react";

interface SentNotification {
  id: number;
  title: string;
  message: string;
  recipientIds: string[];
  recipientCount?: number;
  isRead: boolean;
  sentAt: string;
}

interface SentResponse {
  notifications: SentNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function NotificationsPage() {
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const router = useRouter();

  const fetchSentNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/notifications/sent?page=${pageNum}&limit=${limit}`);
      const data = res.data as SentResponse;
      setSentNotifications(data.notifications);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch sent notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentNotifications(page);
  }, [page]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const truncate = (str: string, max = 64) =>
    str.length > max ? str.slice(0, max).trim() + "…" : str;

  return (
    <>
      {/* Card header — matches the reference's p-8 border-b header pattern */}
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
              sensors
            </span>
          </div>
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#0b1c30",
                margin: 0,
              }}
            >
              Sent Messages
            </h3>
            <p style={{ fontSize: "13px", color: "#4a4455", marginTop: "2px" }}>
              All outbound notifications sent to residents.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/notifications/send")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "#630ed4",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 4px 14px rgba(99,14,212,0.25)",
          }}
        >
          <Plus size={16} />
          New Message
        </button>
      </div>

      {/* Card body */}
      {loading ? (
        <div
          style={{
            padding: "80px",
            textAlign: "center",
            color: "#7b7487",
            fontSize: "14px",
          }}
        >
          Loading sent messages…
        </div>
      ) : sentNotifications.length === 0 ? (
        <div
          style={{
            padding: "80px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "14px",
              background: "#eff4ff",
              color: "#630ed4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Mail size={24} />
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#0b1c30",
              marginBottom: "8px",
            }}
          >
            No sent messages yet
          </div>
          <div style={{ fontSize: "14px", color: "#4a4455", marginBottom: "24px" }}>
            Start communicating with residents by sending your first notification.
          </div>
          <button
            onClick={() => router.push("/notifications/send")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#630ed4",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Plus size={15} />
            Send your first message
          </button>
        </div>
      ) : (
        <>
          {/* Table head */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "48px 160px 1fr 130px 100px",
              padding: "10px 32px",
              borderBottom: "1px solid #e5eeff",
              background: "#f8f9ff",
            }}
          >
            {["#", "Date", "Message", "Recipients", "Status"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#7b7487",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {sentNotifications.map((n, i) => (
            <div
              key={n.id}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 160px 1fr 130px 100px",
                padding: "14px 32px",
                borderBottom:
                  i < sentNotifications.length - 1
                    ? "1px solid #e5eeff"
                    : "none",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8f9ff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span style={{ fontSize: "13px", color: "#7b7487", fontWeight: 500 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: "13px", color: "#4a4455" }}>
                {formatDate(n.sentAt)}
              </span>
              <span
                style={{ fontSize: "14px", color: "#0b1c30", fontWeight: 500 }}
              >
                {truncate(n.title)}
              </span>
              <span style={{ fontSize: "13px", color: "#4a4455" }}>
                {n.recipientCount ?? n.recipientIds.length} recipient
                {(n.recipientCount ?? n.recipientIds.length) !== 1 ? "s" : ""}
              </span>
              <span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: n.isRead ? "#e5eeff" : "#fce7f3",
                    color: n.isRead ? "#630ed4" : "#9d174d",
                  }}
                >
                  {n.isRead ? "Read" : "Unread"}
                </span>
              </span>
            </div>
          ))}

          {/* Pagination footer */}
          {pages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 32px",
                borderTop: "1px solid #e5eeff",
                background: "#f8f9ff",
              }}
            >
              <span style={{ fontSize: "13px", color: "#7b7487" }}>
                Page {page} of {pages} — {total} total
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { label: "Previous", disabled: page === 1, action: () => setPage((p) => p - 1) },
                  { label: "Next", disabled: page === pages, action: () => setPage((p) => p + 1) },
                ].map(({ label, disabled, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    disabled={disabled}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid #ccc3d8",
                      background: disabled ? "#f8f9ff" : "#ffffff",
                      color: disabled ? "#7b7487" : "#0b1c30",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}