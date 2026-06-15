"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
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

  const { user } = useAuthStore();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message: string, max = 60) => {
    if (!message) return "";
    return message.length > max
      ? message.slice(0, max).trim() + "…"
      : message;
  };

  const getStatus = (notification: SentNotification) => {
    return notification.isRead ? "Read" : "Unread";
  };

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <div>
          <div className="section-label">NOTIFICATIONS</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push("/notifications/send")}
          style={{ padding: "10px 18px" }}
        >
          <Plus size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          New Message
        </button>
      </div>

      <h2 className="page-title">Sent Messages</h2>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "48px" }}>
          <span style={{ color: "var(--text-secondary)" }}>Loading sent messages...</span>
        </div>
      ) : sentNotifications.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(37, 99, 235, 0.08)",
              color: "var(--neon-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Mail size={28} />
          </div>
          <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 600 }}>
            No sent messages yet
          </div>
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <a
              href="/notifications/send"
              style={{
                color: "var(--neon-blue)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Send your first message →
            </a>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="table-head">
              <tr>
                <th style={{ padding: "12px", width: 50 }}>#</th>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Message</th>
                <th style={{ padding: "12px" }}>Recipients</th>
                <th style={{ padding: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sentNotifications.map((notification, index) => (
                <tr
                  key={notification.id}
                  style={{
                    borderBottom: "1px solid var(--border-glow)",
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {formatDate(notification.sentAt)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {truncateMessage(notification.title, 60)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {notification.recipientCount ?? notification.recipientIds.length}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button
                      className={`status-btn ${
                        notification.isRead ? "status-read" : "status-unread"
                      }`}
                    >
                      {getStatus(notification)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
