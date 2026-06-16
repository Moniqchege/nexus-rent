"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/lib/api";
import { ArrowLeft, Copy, Trash2, CheckCircle } from "lucide-react";

interface NotificationDetails {
  id: number;
  title: string;
  message: string;
  sentAt: string;
  recipientIds: string[];
  recipientCount: number;
  deliveryRate: number;
  readReceipts: number;
  isRead?: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email?: string;
  unit?: string;
  building?: string;
  hasRead: boolean;
}

export default function MessageDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [notification, setNotification] = useState<NotificationDetails | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([
      api.get(`/api/notifications/${id}`),
      api.get(`/api/notifications/${id}/recipients`)
    ])
      .then(([notifRes, recipientsRes]) => {
        setNotification(notifRes.data);
        setRecipients(recipientsRes.data.recipients || []);
      })
      .catch((err) => {
        console.error("Failed to load notification details:", err);
        setError("Failed to load notification details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDuplicate = async () => {
    try {
      await api.post(`/api/notifications/${id}/duplicate`);
      router.push("/messages/new");
    } catch (err) {
      setError("Failed to duplicate notification");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this notification record?")) return;
    
    try {
      await api.delete(`/api/notifications/${id}`);
      router.push("/messages");
    } catch (err) {
      setError("Failed to delete notification");
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#7b7487" }}>
        Loading notification details…
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "#ba1a1a", fontSize: "14px", marginBottom: "16px" }}>
          {error || "Notification not found"}
        </p>
        <button
          onClick={() => router.back()}
          style={{
            color: "#4800a0",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            background: "none",
            border: "none",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#191c20", paddingBottom: "32px" }}>
      {/* Breadcrumbs / Back Action */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--neon-blue)",
            border: "1px solid var(--neon-blue)",
            padding: "8px 16px",
            marginTop: "14px",
            borderRadius: "8px",
            textDecoration: "hover",
            fontWeight: 600,
            fontSize: "14px",
            background: "none",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ArrowLeft size={18} />
          Back to Notifications
        </button>
      </div>

      {/* Header Section */}
     <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "15px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
    }}
  >
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            background: "#d3e3ff",
            color: "#0b1c30",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Sent
        </span>
        <span style={{ color: "#4a4455", fontSize: "12px" }}>
          • Notification ID: #{notification.id}
        </span>
      </div>

      <h1
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#191c20",
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        {notification.title}
      </h1>

      <p
        style={{
          display: "flex",
          fontSize: "12px",
          alignItems: "center",
          gap: "8px",
          color: "#4a4455",
          margin: 0,
        }}
      >
        📅 Sent on {formatDate(notification.sentAt)}
      </p>
    </div>

    {/* Action Buttons */}
    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
      <button
        onClick={handleDelete}
        style={{
          background: "#ffffff",
          border: "1px solid #ccc3d8",
          color: "#ba1a1a",
          padding: "8px 16px",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "background 0.15s",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#ffdad6")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
      >
        <Trash2 size={18} />
        Delete Record
      </button>
    </div>
  </div>
</div>

      {/* Content Grid */}
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
    alignItems: "start",
    marginBottom: "24px",
  }}
>
  {/* ===================== PRIMARY MESSAGE CARD ===================== */}
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #ccc3d8",
      borderRadius: "12px",
      padding: "18px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      minWidth: 0,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #ccc3d8",
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#191c20",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: 0,
        }}
      >
        💬 Message Content
      </h2>

      <span style={{ fontSize: "10px", color: "#4a4455", fontWeight: 500 }}>
        FORMAT: PLAIN TEXT
      </span>
    </div>

    <div
      style={{
        color: "#191c20",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "24px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {notification.message}
    </div>

    <div
      style={{
        padding: "16px",
        background: "#f2f3f9",
        borderRadius: "8px",
        border: "1px solid #ccc3d8",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0 }}>ℹ️</span>
      <p
        style={{
          fontSize: "14px",
          color: "#4a4455",
          fontStyle: "italic",
          margin: 0,
        }}
      >
        This message was broadcasted to {notification.recipientCount}{" "}
        {notification.recipientCount === 1 ? "tenant" : "tenants"} via Email
        and App notifications page.
      </p>
    </div>
  </div>

  {/* ===================== DELIVERY SUMMARY CARD ===================== */}
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #ccc3d8",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    }}
  >
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: "#191c20",
        margin: "0 0 16px",
      }}
    >
      Delivery Summary
    </h3>

    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
          background: "#f2f3f9",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#4a4455", fontSize: "14px" }}>
          Total Recipients
        </span>
        <span
          style={{
            fontWeight: 700,
            color: "#4800a0",
            fontSize: "16px",
          }}
        >
          {notification.recipientCount}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
          background: "#f2f3f9",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#4a4455", fontSize: "14px" }}>
          Delivery Rate
        </span>
        <span
          style={{
            fontWeight: 700,
            color: "#191c20",
            fontSize: "16px",
          }}
        >
          {notification.deliveryRate}%
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px",
          background: "#f2f3f9",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#4a4455", fontSize: "14px" }}>
          Read Receipts
        </span>
        <span
          style={{
            fontWeight: 700,
            color: "#191c20",
            fontSize: "16px",
          }}
        >
          {notification.readReceipts}
        </span>
      </div>
    </div>
  </div>
</div>

{/* ===================== RECIPIENTS CARD ===================== */}
<div
  style={{
    background: "#ffffff",
    border: "1px solid #ccc3d8",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  }}
>
  <h3
    style={{
      fontSize: "14px",
      fontWeight: 700,
      color: "#191c20",
      margin: "0 0 16px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}
  >
    Recipients
  </h3>

  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {recipients.map((recipient) => (
      <div
        key={recipient.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          border: "1px solid #ccc3d8",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#d3e3ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          👤
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#191c20",
              margin: "0 0 2px",
            }}
          >
            {recipient.name}
          </p>

          {recipient.unit && (
            <p
              style={{
                fontSize: "12px",
                color: "#4a4455",
                margin: 0,
              }}
            >
              {recipient.unit}
              {recipient.building && ` - ${recipient.building}`}
            </p>
          )}
        </div>

        {recipient.hasRead && (
          <CheckCircle
            size={20}
            color="var(--neon-blue)"
            style={{ flexShrink: 0 }}
          />
        )}
      </div>
    ))}
  </div>
</div>
    </div>
  );
}