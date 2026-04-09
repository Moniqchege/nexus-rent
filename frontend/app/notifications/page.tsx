"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { useRouter } from "next/navigation";

interface SentNotification {
  id: number;
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
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const router = useRouter();

  const { user } = useAuthStore();

  const fetchSentNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get(`/notifications/sent?page=${pageNum}&limit=${limit}`);
      const data = res.data as SentResponse;
      
      setSentNotifications(data.notifications);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sent notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentNotifications(page);
  }, [page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReadStats = (notification: SentNotification) => {
    const recipients = notification.recipientIds;
    const readCount = recipients.filter((id: string) => notification.isRead).length;
    return `${readCount}/${recipients.length} read`;
  };

  return (
    <div className="dashboard-content">
      <div className="page-tag">📋 SENT MESSAGES</div>
         <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          // marginBottom: "24px",
        }}
      >
        <div className="section-label">NOTIFICATIONS</div>

        <button
          onClick={() => router.push("/notifications/send")}
          style={{
            background: "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          + New Message
        </button>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-blue)" }}>
          Messages
        </h2>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px" }}>
          Loading sent messages...
        </div>
      ) : sentNotifications.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4px 32px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "48px", marginBottom: "4px" }}>📤</div>
           <div style={{ fontSize: "14px" }}>No sent messages yet.</div>
          <div style={{ marginTop: "6px", marginBottom: "8px" }}>
            <a href="/notifications/send" style={{ 
              color: "var(--neon-blue)", 
              textDecoration: "none", 
              fontWeight: 500 
            }}>
              Send your first message →
            </a>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead className="table-head">
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border-glow)" }}>
                <th>#</th>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Message Preview</th>
                <th style={{ padding: "12px" }}>Recipients</th>
                <th style={{ padding: "12px" }}>Read Status</th>
              </tr>
            </thead>
            <tbody>
              {sentNotifications.map((notification, index) => (
                <tr key={notification.id} style={{ borderBottom: "1px solid var(--border-glow)", backgroundColor: "rgba(17,24,39,0.4)" }}>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                {index + 1}
              </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {formatDate(notification.sentAt)}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                   {notification.message.substring(0, 100)}{notification.message.length > 100 ? '...' : ''}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {notification.recipientCount ?? notification.recipientIds.length}
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: "var(--neon-secondary)" }}>
                    {getReadStats(notification)}
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

