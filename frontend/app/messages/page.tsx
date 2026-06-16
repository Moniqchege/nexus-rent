"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { Plus, Pencil, BarChart2, Users, Calendar, ChevronLeft, ChevronRight, History, ArrowRight } from "lucide-react";
import { PaginationCustomDropdown } from "../components/ui/PaginationCustomDropdown";

interface Notification {
  id: number;
  title: string;
  message: string;
  sentAt: string;
  recipientCount: number;
  isUrgent?: boolean;
}
type Pagination = {
  enabled: boolean;
  pageSizeOptions: number[];
  defaultPageSize: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

type FilterTab = "all" | "drafts" | "scheduled";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const [pageSize, setPageSize] = useState(5);
  const totalNotifications = notifications.length;
  const totalPages = Math.max(1, Math.ceil(totalNotifications / pageSize));
  const safePageIndex = currentPage - 1;
  const pageStart = totalNotifications === 0 ? 0 : safePageIndex * perPage + 1;
  const pageEnd = Math.min((safePageIndex + 1) * perPage, totalNotifications);
  
  const setPageSizeSafe = (size: number) => {
    setPageSize(size);
  };
  
  const setPageIndexSafe = (index: number) => {
    setCurrentPage(index + 1);
  };

  const paginatedNotifications = notifications.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize
  );
  const pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  useEffect(() => {
    api
      .get("/api/notifications/sent")
      .then((r) => setNotifications(r.data.notifications ?? r.data))
      .catch(() => setError("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " • " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // Navigation handler for viewing notification details/report
  const handleViewReport = useCallback((notificationId: number) => {
    router.push(`/messages/view/${notificationId}`);
  }, [router]);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="dashboard-content">
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#191c20" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", color: "var(--neon-blue)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: "40px", margin: 0 }}>
              Notifications
            </h2>
            <p style={{ fontSize: "12px", color: "#4a4455" }}>
              View and manage all sent notifications.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/messages/new")}
           style={{
            background:
              "linear-gradient(to right, var(--neon-blue), var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          + New Notification
        </button>
      </div>

      {/* Error Banner */}
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

      {/* Notifications List Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ccc3d8",
          borderRadius: "12px",
          overflow: "visible",
        }}
      >
        {/* List Body */}
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7b7487", fontSize: "14px" }}>
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#e7e8ee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#4a4455",
              }}
            >
              <History size={28} />
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>No notifications sent yet</h4>
            <p style={{ fontSize: "14px", color: "#4a4455", maxWidth: 280, margin: "0 auto 24px" }}>
              Start communicating with your tenants by sending your first global or targeted notification.
            </p>
            <button
              onClick={() => router.push("/notifications/new")}
              style={{
                background: "none",
                border: "none",
                color: "#4800a0",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Send one now <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            {paginatedNotifications.map((n, i) => (
              <NotificationRow
                key={n.id}
                notification={n}
                isLast={i === paginatedNotifications.length - 1}
                onEdit={() => router.push(`/notifications/edit/${n.id}`)}
                onViewReport={() => handleViewReport(n.id)}
                formatDate={formatDate}
             />
            ))}
          </div>
        )}

        {/* Pagination */}
      {totalNotifications > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "12px 16px",
      borderTop: "1px solid #ccc3d8",
      background: "#f2f3f9",
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    {/* LEFT: showing range */}
    <div style={{ flex: 1, minWidth: 120 }}>
      <span style={{ color: "#4a4455", fontSize: 12 }}>
        Showing{" "}
        <span style={{ color: "#630ed4", fontWeight: 600 }}>
          {pageStart}
        </span>
        –
        <span style={{ color: "#630ed4", fontWeight: 600 }}>
          {pageEnd}
        </span>{" "}
        of{" "}
        <span style={{ color: "#630ed4", fontWeight: 600 }}>
          {totalNotifications}
        </span>
      </span>
    </div>

    {/* MIDDLE: page size dropdown */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "#4a4455",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        Items Per Page:
      </span>

      <PaginationCustomDropdown
        options={pageSizeOptions.map((size: number) => ({
          label: String(size),
          value: size,
        }))}
        value={pageSize}
        onChange={(value) => {
          setPageSizeSafe(Number(value));
          setPageIndexSafe(0); 
        }}
        labelKey="label"
        valueKey="value"
        minWidth="90px"
      />
    </div>

    {/* RIGHT: navigation */}
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #ccc3d8",
          backgroundColor: "#ffffff",
          color: "#0F52BA",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          opacity: currentPage === 1 ? 0.4 : 1,
          fontWeight: 600,
        }}
      >
        ‹
      </button>

      <div
        style={{
          padding: "5px 12px",
          borderRadius: 8,
          border: "1px solid #0F52BA",
          background: "rgba(99, 14, 212, 0.08)",
          color: "#0F52BA",
          fontWeight: 600,
          minWidth: 32,
          textAlign: "center",
        }}
      >
        {currentPage}
      </div>

      <button
        onClick={() =>
          setCurrentPage((p) => Math.min(totalPages, p + 1))
        }
        disabled={currentPage >= totalPages}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #ccc3d8",
          backgroundColor: "#ffffff",
          color: "#0F52BA",
          cursor:
            currentPage >= totalPages ? "not-allowed" : "pointer",
          opacity: currentPage >= totalPages ? 0.4 : 1,
          fontWeight: 600,
        }}
      >
        ›
      </button>
    </div>
  </div>
)}
      </div>
    </div>
    </div>
  );
}

// ── Row Sub-component ─────────────────────────────────────────────────────────

function NotificationRow({
  notification: n,
  isLast,
  onEdit,
  onViewReport,
  formatDate,
}: {
  notification: Notification;
  isLast: boolean;
  onEdit: () => void;
  onViewReport: () => void;
  formatDate: (d: string) => string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "20px 24px",
        borderBottom: isLast ? "none" : "1px solid #ccc3d8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        background: hovered ? "rgba(242,243,249,0.3)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#191c20",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {n.title}
          </h3>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
              background: n.isUrgent ? "#ffdad6" : "#eaddff",
              color: n.isUrgent ? "#93000a" : "#25005a",
            }}
          >
            Sent
          </span>
        </div>
        <p
          style={{
            fontSize: "14px",
            color: "#4a4455",
            margin: "0 0 8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {n.message}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 8px",
              background: "#e7e8ee",
              borderRadius: "4px",
              color: "#4a4455",
            }}
          >
            <Users size={14} />
            <span style={{ fontSize: "12px", fontWeight: 500 }}>
              {n.recipientCount} recipient{n.recipientCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4a4455" }}>
            <Calendar size={14} />
            <span style={{ fontSize: "12px" }}>{formatDate(n.sentAt)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      >
        <button
          title="View Report"
          onClick={onViewReport}
          style={{
            padding: "8px",
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            color: "#4a4455",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#e7e8ee")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <BarChart2 size={20} />
        </button>
      </div>
    </div>
  );
}