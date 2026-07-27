"use client";

import api from "@/app/lib/api";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Hash,
  FileText,
  MapPin,
  UserRound,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Pencil,
  Tag,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type PaymentStatus = "pending" | "paid" | "overdue";

type Expense = {
  id: number;
  amount: number;
  category: string;
  description?: string | null;
  date?: string;
  createdAt?: string;
  unit?: string | null;
  invoiceNumber?: string | null;
  vendorName?: string | null;
  vendorEmail?: string | null;
  vendorDescription?: string | null;
  mpesaPaidTo?: string | null;
  receiptUrl?: string | null;
  paymentStatus: PaymentStatus;
  property?: { id: number; title: string };
};

const statusConfig: Record<PaymentStatus, { bg: string; color: string; label: string; icon: typeof CheckCircle2 }> = {
  paid: { bg: "#ecfdf5", color: "#059669", label: "Paid", icon: CheckCircle2 },
  pending: { bg: "#fef3c7", color: "#d97706", label: "Pending", icon: Clock },
  overdue: { bg: "#fee2e2", color: "#dc2626", label: "Overdue", icon: AlertTriangle },
};

export default function ExpenseDetails() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params?.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

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

  const handleMarkPaid = async () => {
    if (!expense || markingPaid) return;
    setMarkingPaid(true);
    try {
      const res = await api.patch(`/api/expenses/${expense.id}/status`, { status: "paid" });
      setExpense((prev) =>
        prev ? { ...prev, paymentStatus: res.data?.expense?.paymentStatus ?? "paid" } : prev
      );
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to update expense status");
    } finally {
      setMarkingPaid(false);
    }
  };

  const s = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Inter', sans-serif",
      color: "#0f172a",
      padding: "14px 18px 60px",
    },
    container: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "none",
      padding: 0,
      color: "#4f46e5",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    },
    heroRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
    },
    heroTitleRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap" as const,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
      letterSpacing: "-0.01em",
    },
    heroSubtitle: {
      fontSize: 11,
      color: "#64748b",
      margin: "6px 0 0",
    },
    statusBadge: (status: PaymentStatus) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: statusConfig[status].bg,
      color: statusConfig[status].color,
    }),
    amountLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: 700,
      color: "#4f46e5",
      margin: 0,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: 20,
      alignItems: "start",
    },
    mainCol: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
    },
    sideCol: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
    },
    card: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: "18px 20px",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderBottom: "1px solid #f1f5f9",
      paddingBottom: 12,
      marginBottom: 18,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      margin: 0,
    },
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "18px 24px",
    },
    detailItem: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 4,
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    descriptionBox: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid #f1f5f9",
    },
    vendorHeader: {
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
    },
    vendorIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: "#eef2ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    vendorName: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    vendorSub: {
      fontSize: 11,
      color: "#64748b",
      margin: "2px 0 2px",
    },
    vendorContactRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: "#4f46e5",
      marginTop: 4,
    },
    receiptWrap: {
      borderRadius: 12,
      overflow: "hidden",
      background: "#f8fafc",
    },
    receiptImage: {
      width: "100%",
      height: "auto",
      display: "block",
      maxHeight: 384,
      objectFit: "cover" as const,
    },
    actionBtn: {
      width: "100%",
      padding: "11px 0",
      borderRadius: 10,
      border: "none",
      background: "#4f46e5",
      color: "#fff",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    actionBtnDisabled: {
      opacity: 0.6,
      cursor: "not-allowed" as const,
    },
    paidBanner: {
      width: "100%",
      padding: "11px 0",
      borderRadius: 10,
      background: "#ecfdf5",
      color: "#059669",
      fontSize: 14,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    secondaryBtn: {
      width: "100%",
      padding: "11px 0",
      borderRadius: 10,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#94a3b8",
      fontSize: 14,
      fontWeight: 600,
      cursor: "not-allowed" as const,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
    },
    timelineWrap: {
      position: "relative" as const,
      paddingLeft: 4,
    },
    timelineLine: {
      position: "absolute" as const,
      left: 11,
      top: 8,
      bottom: 8,
      width: 2,
      background: "#e2e8f0",
    },
    timelineSteps: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 24,
    },
    timelineItem: {
      position: "relative" as const,
      paddingLeft: 36,
    },
    timelineDot: (bg: string) => ({
      position: "absolute" as const,
      left: 0,
      top: 2,
      width: 24,
      height: 24,
      borderRadius: "50%",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    }),
    timelineTitle: (color: string) => ({
      fontSize: 14,
      fontWeight: 700,
      color,
      margin: 0,
    }),
    timelineSub: {
      fontSize: 12,
      color: "#94a3b8",
      marginTop: 2,
    },
    timelineTimestamp: {
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#94a3b8",
      whiteSpace: "nowrap" as const,
    },
    loadingContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
    },
    spinner: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      border: "4px solid #e2e8f0",
      borderTop: "4px solid #4f46e5",
      animation: "spin 1s linear infinite",
      margin: "0 auto 16px",
    },
    errorContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "#f8fafc",
    },
    errorCard: {
      background: "#fee2e2",
      border: "1px solid #fecaca",
      borderRadius: 12,
      padding: 24,
      maxWidth: 448,
      textAlign: "center" as const,
    },
  };

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <div style={{ textAlign: "center" }}>
          <div style={s.spinner}></div>
          <p style={{ color: "#475569", fontWeight: 500 }}>Loading expense...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div style={s.errorContainer}>
        <div style={s.errorCard}>
          <AlertTriangle size={28} color="#dc2626" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>Error</h2>
          <p style={{ color: "#b91c1c", fontSize: 14 }}>{error || "Expense not found"}</p>
          <button
            style={{
              marginTop: 16, padding: "6px 18px", background: "#dc2626", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[expense.paymentStatus];
  const StatusIcon = status.icon;
  const formattedAmount = expense.amount?.toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
  });

  const recordedAt = expense.createdAt ? new Date(expense.createdAt) : null;
  const recordedLabel = recordedAt
    ? recordedAt.toLocaleString("en-KE", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

  const expenseDateLabel = expense.date
    ? new Date(expense.date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "2-digit" })
    : "—";

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.backButton} onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Back to Expenses
        </button>

        {/* Hero */}
        <div style={s.heroRow}>
          <div>
            <div style={s.heroTitleRow}>
              <h1 style={s.heroTitle}>{expense.description || expense.category}</h1>
              <span style={s.statusBadge(expense.paymentStatus)}>
                <StatusIcon size={13} />
                {status.label}
              </span>
            </div>
            <p style={s.heroSubtitle}>
              {expense.property?.title || "—"}
              {expense.unit ? ` • ${expense.unit}` : ""} • {expense.category}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={s.amountLabel}>Total Amount</p>
            <h3 style={s.amountValue}>{formattedAmount}</h3>
          </div>
        </div>

        {/* Two column grid */}
        <div style={s.grid}>
          {/* Main column */}
          <div style={s.mainCol}>
            {/* Transaction Overview */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <Tag size={16} color="#4f46e5" />
                <h4 style={s.cardTitle}>Transaction Overview</h4>
              </div>
              <div style={s.detailsGrid}>
                <div style={s.detailItem}>
                  <span style={s.detailLabel}>Category</span>
                  <span style={s.detailValue}>
                    <Tag size={14} color="#64748b" />
                    {expense.category}
                  </span>
                </div>
                <div style={s.detailItem}>
                  <span style={s.detailLabel}>Date</span>
                  <span style={s.detailValue}>
                    <Calendar size={14} color="#64748b" />
                    {expenseDateLabel}
                  </span>
                </div>
                <div style={s.detailItem}>
                  <span style={s.detailLabel}>Property</span>
                  <span style={s.detailValue}>
                    <Building2 size={14} color="#64748b" />
                    {expense.property?.title || "—"}
                  </span>
                </div>
                {expense.unit && (
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Unit</span>
                    <span style={s.detailValue}>
                      <MapPin size={14} color="#64748b" />
                      {expense.unit}
                    </span>
                  </div>
                )}
                {expense.invoiceNumber && (
                  <div style={s.detailItem}>
                    <span style={s.detailLabel}>Invoice Number</span>
                    <span style={s.detailValue}>
                      <FileText size={14} color="#64748b" />
                      {expense.invoiceNumber}
                    </span>
                  </div>
                )}
                <div style={s.detailItem}>
                  <span style={s.detailLabel}>Reference ID</span>
                  <span style={s.detailValue}>
                    <Hash size={14} color="#64748b" />
                    EXP-{expense.id}
                  </span>
                </div>
              </div>

              {expense.description && (
                <div style={s.descriptionBox}>
                  <span style={s.detailLabel}>Description</span>
                  <p style={{ fontSize: 14, color: "#334155", marginTop: 6, lineHeight: 1.6 }}>
                    {expense.description}
                  </p>
                </div>
              )}
            </div>

            {/* Vendor Information */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <UserRound size={16} color="#4f46e5" />
                <h4 style={s.cardTitle}>Vendor Information</h4>
              </div>
              <div style={s.vendorHeader}>
                <div style={s.vendorIcon}>
                  <UserRound size={26} color="#4f46e5" />
                </div>
                <div>
                  <h5 style={s.vendorName}>{expense.vendorName || "Unnamed Vendor"}</h5>
                  <p style={s.vendorSub}>
                    {expense.vendorDescription || "No additional vendor details provided."}
                  </p>
                  {expense.mpesaPaidTo && (
                    <div style={s.vendorContactRow}>
                      <Phone size={13} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{expense.mpesaPaidTo}</span>
                    </div>
                  )}
                  {expense.vendorEmail && (
                    <div style={s.vendorContactRow}>
                      <Mail size={13} />
                      <span>{expense.vendorEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Receipt */}
            {expense.receiptUrl && (
              <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Receipt size={16} color="#4f46e5" />
                    <h4 style={s.cardTitle}>Payment Proof</h4>
                  </div>
                  {expense.paymentStatus === "paid" && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#047857", background: "#dcfce7", padding: "4px 12px", borderRadius: 999 }}>
                      VERIFIED
                    </span>
                  )}
                </div>
                <div style={s.receiptWrap}>
                  <img src={expense.receiptUrl} alt="Receipt" style={s.receiptImage} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar column */}
          <div style={s.sideCol}>
            {/* Actions */}
            <div style={s.card}>
              <h4 style={{ ...s.cardTitle, marginBottom: 16, borderBottom: "none", paddingBottom: 0 }}>
                Actions
              </h4>

              {expense.paymentStatus === "paid" ? (
                <div style={s.paidBanner}>
                  <CheckCircle2 size={16} />
                  Paid
                </div>
              ) : (
                <button
                  style={{ ...s.actionBtn, ...(markingPaid ? s.actionBtnDisabled : {}) }}
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                >
                  <CheckCircle2 size={16} />
                  {markingPaid ? "Marking…" : "Mark as Paid"}
                </button>
              )}

              <button style={s.secondaryBtn} disabled title="Editing isn't available yet">
                <Pencil size={14} />
                Edit Details
              </button>
            </div>

            {/* Activity Timeline — built from real expense data */}
            <div style={s.card}>
              <h4 style={{ ...s.cardTitle, marginBottom: 20, borderBottom: "none", paddingBottom: 0 }}>
                Activity Timeline
              </h4>
              <div style={s.timelineWrap}>
                <div style={s.timelineLine}></div>
                <div style={s.timelineSteps}>
                  {/* Step 1: always completed */}
                  <div style={s.timelineItem}>
                    <div style={s.timelineDot("#4f46e5")}>
                      <FileText size={12} color="#fff" />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <p style={s.timelineTitle("#0f172a")}>Expense Recorded</p>
                        <p style={s.timelineSub}>Logged in the system</p>
                      </div>
                      <span style={s.timelineTimestamp}>{recordedLabel}</span>
                    </div>
                  </div>

                  {/* Step 2: current live status */}
                  {expense.paymentStatus === "paid" && (
                    <div style={s.timelineItem}>
                      <div style={s.timelineDot("#10b981")}>
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <p style={s.timelineTitle("#059669")}>Paid</p>
                          <p style={s.timelineSub}>Payment confirmed</p>
                        </div>
                        <span style={{ ...s.timelineTimestamp, color: "#059669" }}>Completed</span>
                      </div>
                    </div>
                  )}

                  {expense.paymentStatus === "overdue" && (
                    <div style={s.timelineItem}>
                      <div style={s.timelineDot("#dc2626")}>
                        <AlertTriangle size={12} color="#fff" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <p style={s.timelineTitle("#dc2626")}>Overdue</p>
                          <p style={s.timelineSub}>Unpaid for more than 7 days</p>
                        </div>
                        <span style={{ ...s.timelineTimestamp, color: "#dc2626" }}>Current</span>
                      </div>
                    </div>
                  )}

                  {expense.paymentStatus === "pending" && (
                    <div style={s.timelineItem}>
                      <div style={{ ...s.timelineDot("#fff"), border: "2px solid #4f46e5" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5" }}></div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <p style={s.timelineTitle("#4f46e5")}>Pending Payment</p>
                          <p style={s.timelineSub}>Awaiting confirmation</p>
                        </div>
                        <span style={{ ...s.timelineTimestamp, color: "#4f46e5" }}>Current</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}