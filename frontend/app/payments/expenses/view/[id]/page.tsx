"use client";

import api from "@/app/lib/api";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Expense = {
  id: string;
  title?: string;
  description?: string;
  paymentStatus: "paid" | "pending" | "failed";
  amount: number;
  currency?: string;
  category?: string;
  propertyName?: string;
  property?: { id: number; title: string };
  vendorName?: string;
  vendorAccount?: { id: number; name: string; identifier: string };
  referenceId?: string;
  mpesaPaidTo?: string;
  createdAt?: string;
  approvedBy?: string;
  paidAt?: string;
  receiptUrl?: string;
  date?: string;
};

const statusConfig = {
  paid: { bg: "#ecfdf5", color: "#059669", label: "Paid", icon: "check_circle" },
  pending: { bg: "#fef3c7", color: "#d97706", label: "Pending", icon: "schedule" },
  failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed", icon: "error" },
};

export default function ExpenseDetails() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params?.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExpense() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/expenses/${expenseId}`);
        setExpense(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load expense");
      } finally {
        setLoading(false);
      }
    }

    if (expenseId && expenseId !== "undefined") {
      fetchExpense();
    }
  }, [expenseId]);

  const styles = {
    // Layout
    page: {
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
      fontFamily: "'Inter', sans-serif",
      color: "#0f172a",
    },
    headerContainer: {
      maxWidth: "80rem",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      border: "1px solid var(--neon-blue)",
    },
    backButton: {
      padding: "1",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      borderRadius: "0.5rem",
      transition: "background 0.2s",
    },
    headerTitle: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    // Main Content
    main: {
      maxWidth: "80rem",
      margin: "0 auto",
      padding: "10px 10px",
    },
    // Hero Section
    heroSection: {
      marginBottom: "2rem",
    },
    heroContent: {
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "space-between",
      gap: "1.5rem",
    },
    heroText: {
      maxWidth: "100%",
    },
    breadcrumb: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: "0.5rem",
    },
    breadcrumbHighlight: {
      color: "#4f46e5",
    },
    heroTitle: {
      fontSize: "1.20rem",
      fontWeight: 700,
      color: "#0f172a",
      margin: "0",
      lineHeight: 1.2,
    },
    heroDescription: {
      color: "#475569",
      fontSize: "1rem",
      margin: "0.75rem 0 0",
      maxWidth: "42rem",
    },
    statusBadge: {
      padding: "0.5rem 1rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      border: "none",
      cursor: "default",
    },
    headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 8px",
  },

    left: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    minWidth: 0,
  },

  category: {
    fontWeight: 600,
    color: "#000000",
    whiteSpace: "nowrap",
  },

  description: {
    color: "#000000",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "400px",
  },
    // Grid Layout
    contentGrid: {
      display: "grid",
      // gridTemplateColumns: "1fr 1fr 1fr",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    mainColumn: {
      gridColumn: "span 2",
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    sidebarColumn: {
      gridColumn: "span 1",
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    // Cards
    card: {
      background: "#fff",
      borderRadius: "1rem",
      border: "1px solid #e2e8f0",
      padding: "1rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    cardTitle: {
      fontSize: "0.65rem",
      fontWeight: 700,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      marginBottom: "1rem",
    },
    // Transaction Details
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
    },
    detailColumn: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    detailItem: {
      display: "flex",
      flexDirection: "column" as const,
    },
    detailLabel: {
      fontSize: "0.55rem",
      fontWeight: 600,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: "0.25rem",
    },
    detailValue: {
      fontSize: "0.8rem",
      fontWeight: 600,
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    detailValueIcon: {
      color: "#4800a0",
      fontSize: "1rem",
    },
    amountValue: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#4800a0",
    },
    referenceCode: {
      padding: "0.5rem 0.75rem",
      background: "#f1f5f9",
      borderRadius: "0.5rem",
      fontFamily: "monospace",
      fontSize: "0.875rem",
      fontWeight: 700,
      color: "#4f46e5",
    },
    // Receipt Image
    receiptContainer: {
      borderRadius: "0.75rem",
      overflow: "hidden",
      background: "#f8fafc",
    },
    receiptImage: {
      width: "100%",
      height: "auto",
      display: "block",
      maxHeight: "24rem",
      objectFit: "cover" as const,
    },
    // Timeline
    timeline: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    timelineItem: {
      display: "flex",
      gap: "1rem",
    },
    timelineItemColumn: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
    },
    timelineCircle: {
      width: "2rem",
      height: "2rem",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: "0.875rem",
      flexShrink: 0,
    },
    timelineCircleActive: {
      background: "#4f46e5",
    },
    timelineCircleInactive: {
      background: "#cbd5e1",
      color: "#64748b",
    },
    timelineLinea: {
      width: "2px",
      height: "3rem",
      background: "#e2e8f0",
      margin: "0.5rem 0",
    },
    timelineContent: {
      paddingBottom: "1.5rem",
    },
    timelineLabel: {
      fontSize: "0.75rem",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: "0.25rem",
    },
    timelineLabelActive: {
      color: "#4f46e5",
    },
    timelineLabelInactive: {
      color: "#94a3b8",
    },
    timelineTitle: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#0f172a",
      margin: "0.25rem 0",
    },
    timelineSubtitle: {
      fontSize: "0.875rem",
      color: "#64748b",
      marginTop: "0.25rem",
    },
    // M-Pesa Card
    mpesaCard: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    mpesaIcon: {
      width: "2.5rem",
      height: "2.5rem",
      background: "#dcfce7",
      borderRadius: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#16a34a",
      flexShrink: 0,
    },
    mpesaInfo: {
      display: "flex",
      flexDirection: "column" as const,
    },
    mpesaLabel: {
      fontSize: "0.75rem",
      color: "#64748b",
      marginBottom: "0.25rem",
    },
    mpesaValue: {
      fontSize: "1.125rem",
      fontWeight: 700,
      color: "#16a34a",
    },
    // Audit Card
    auditCard: {
      background: "linear-gradient(to bottom right, #4f46e5, #7c3aed)",
      color: "#fff",
      display: "flex",
      flexDirection: "column" as const,
      gap: "1rem",
    },
    auditContent: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
    },
    auditIcon: {
      fontSize: "2rem",
      opacity: 0.6,
      flexShrink: 0,
    },
    auditText: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    auditButton: {
      width: "100%",
      padding: "0.5rem",
      background: "rgba(255, 255, 255, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "0.5rem",
      color: "#fff",
      fontSize: "0.875rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background 0.2s",
    },
    auditButtonHover: {
      background: "rgba(255, 255, 255, 0.3)",
    },
    // Loading State
    loadingContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
    },
    loadingContent: {
      textAlign: "center" as const,
    },
    spinner: {
      width: "3rem",
      height: "3rem",
      borderRadius: "50%",
      border: "4px solid #e2e8f0",
      borderTop: "4px solid #4f46e5",
      animation: "spin 1s linear infinite",
      margin: "0 auto 1rem",
    },
    loadingText: {
      color: "#475569",
      fontWeight: 500,
    },
    // Error State
    errorContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      background: "#f8fafc",
    },
    errorCard: {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      maxWidth: "28rem",
      textAlign: "center" as const,
    },
    errorIcon: {
      fontSize: "1.25rem",
      color: "#dc2626",
      marginBottom: "1rem",
      display: "block",
    },
    errorTitle: {
      fontSize: "1.125rem",
      fontWeight: 600,
      color: "#991b1b",
      marginBottom: "0.5rem",
    },
    errorMessage: {
      color: "#b91c1c",
      fontSize: "0.875rem",
    },
    errorButton: {
      marginTop: "1rem",
      padding: "0.3rem 1rem",
      background: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
      transition: "background 0.2s",
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading expense...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <span style={styles.errorIcon} className="material-symbols-outlined">
            error
          </span>
          <h2 style={styles.errorTitle}>Error</h2>
          <p style={styles.errorMessage}>{error || "Expense not found"}</p>
          <button
            style={styles.errorButton}
            onClick={() => router.back()}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[expense.paymentStatus];
  const formattedAmount = expense.amount?.toLocaleString("en-KE", {
    style: "currency",
    currency: expense.currency || "KES",
  });

  return (
    <div style={styles.page}>
      {/* Header */}
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
            marginBottom: "14px",
            borderRadius: "8px",
            textDecoration: "hover",
            fontWeight: 600,
            fontSize: "14px",
            background: "none",
            cursor: "pointer",
            marginLeft: "12px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <ArrowLeft size={18} />
          Back to Expenses
        </button>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.headerRow}>
          <div style={styles.left}>
          <span style={styles.category}>
            {expense.category || "Category"}:
          </span>

          <span style={styles.description}>
            {expense.description || "No description"}
          </span>
        </div>

        <div style={{ ...styles.statusBadge, background: status.bg, color: status.color }}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem", marginRight: 4 }}>
            {status.icon}
          </span>
            {status.label}
        </div>
      </section>

        {/* Content Grid */}
        <div style={styles.contentGrid}>
          {/* Main Column */}
          <div style={styles.mainColumn}>
            {/* Transaction Details */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Transaction Details</h2>
              <div style={styles.detailsGrid}>
                <div style={styles.detailColumn}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Property</span>
                    <div style={styles.detailValue}>
                      <span className="material-symbols-outlined" style={styles.detailValueIcon}>
                        domain
                      </span>
                      {expense.property?.title || expense.propertyName || "N/A"}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Category</span>
                    <div style={styles.detailValue}>
                      <span className="material-symbols-outlined" style={styles.detailValueIcon}>
                        category
                      </span>
                      {expense.category || "—"}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Vendor / Recipient</span>
                    <div style={styles.detailValue}>
                      <span className="material-symbols-outlined" style={styles.detailValueIcon}>
                        person_pin
                      </span>
                      {expense.vendorAccount?.name || expense.vendorName || expense.mpesaPaidTo || "—"}
                    </div>
                  </div>
                </div>
                <div style={styles.detailColumn}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Date Created</span>
                    <div style={styles.detailValue}>
                      <span className="material-symbols-outlined" style={styles.detailValueIcon}>
                        event
                      </span>
                      {expense.date
                        ? new Date(expense.date).toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : expense.createdAt
                        ? new Date(expense.createdAt).toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Amount</span>
                    <div style={styles.amountValue}>{formattedAmount}</div>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Reference ID</span>
                    <code style={styles.referenceCode}>{expense.referenceId || expense.id}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt */}
            {expense.receiptUrl && (
              <div style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={styles.cardTitle}>Payment Proof</h2>
                  {expense.paymentStatus === "paid" && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#047857",
                        background: "#dcfce7",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>
                <div style={styles.receiptContainer}>
                  <img src={expense.receiptUrl} alt="Receipt" style={styles.receiptImage} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}