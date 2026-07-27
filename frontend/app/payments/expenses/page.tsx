"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import { GlassPanel, MetricCard, NeonButton, SectionTag } from "../_lib/components";
import { fmt } from "../_lib/data";
import type { Expense } from "../_lib/types";
import { useRouter } from "next/navigation";

interface ExpenseSummary {
  total: number;
  maintenance: number;
  utilities: number;
  insurance: number;
  count: number;
}

interface Property {
  id: number;
  title: string;
}

function categoryColor(category: string) {
  const colors: Record<string, string> = {
    Maintenance: "#f59e0b",
    Utilities: "#60a5fa",
    Insurance: "#a78bfa",
    Tax: "#f87171",
    Admin: "#34d399",
    Other: "#6366f1",
  };
  return colors[category] || "#6366f1";
}

function categoryBg(category: string) {
  const colors: Record<string, string> = {
    Maintenance: "#fef3c7",
    Utilities: "#eff6ff",
    Insurance: "#f5f3ff",
    Tax: "#fff1f2",
    Admin: "#ecfdf5",
    Other: "#eef2ff",
  };
  return colors[category] || "#eef2ff";
}

const STATUS_TABS = ["All", "Paid", "Pending", "Overdue"] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedProperty, setSelectedProperty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [statusTab, setStatusTab] = useState<StatusTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);

  const router = useRouter();

  const summary = expenses.reduce(
    (acc: ExpenseSummary, exp) => {
      if (selectedProperty !== "all" && exp.propertyId !== Number(selectedProperty)) return acc;
      if (filterCategory !== "all" && exp.category !== filterCategory) return acc;
      acc.total += exp.amount;
      acc.count += 1;
      if (exp.category === "Maintenance") acc.maintenance += exp.amount;
      else if (exp.category === "Utilities") acc.utilities += exp.amount;
      else if (exp.category === "Insurance") acc.insurance += exp.amount;
      return acc;
    },
    { total: 0, maintenance: 0, utilities: 0, insurance: 0, count: 0 }
  );

  const filteredExpenses = expenses.filter((exp) => {
    if (selectedProperty !== "all" && exp.propertyId !== Number(selectedProperty)) return false;
    if (filterCategory !== "all" && exp.category !== filterCategory) return false;
    if (statusTab !== "All" && (exp.paymentStatus ?? "pending").toLowerCase() !== statusTab.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = (exp.description ?? "").toLowerCase();
      const vendor = (exp.vendorAccount?.name ?? exp.mpesaPaidTo ?? "").toLowerCase();
      const prop = (exp.property?.title ?? "").toLowerCase();
      if (!desc.includes(q) && !vendor.includes(q) && !prop.includes(q)) return false;
    }
    return true;
  });

  const propertyOptions = useMemo(
    () => [
      { label: "All Properties", value: "all" },
      ...properties.map((p) => ({ label: p.title, value: String(p.id) })),
    ],
    [properties]
  );

  const fetchProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const res = await api.get("/api/properties");
      setProperties(res.data ?? []);
    } catch (e) {
      console.error("Failed to load properties", e);
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params: Record<string, string> = {};
      if (selectedProperty !== "all") params.propertyId = selectedProperty;
      const res = await api.get("/api/expenses", { params });
      setExpenses(res.data?.expenses ?? []);
    } catch (e) {
      console.error("Failed to load expenses", e);
    } finally {
      setLoadingExpenses(false);
    }
  }, [selectedProperty, refreshTick]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { if (!loadingProperties) fetchExpenses(); }, [loadingProperties, fetchExpenses]);

  useEffect(() => {
    setAnomalyLoading(true);
    api.get('/api/ai/expenses/anomalies')
      .then((res) => {
        const sorted = [...(res.data ?? [])].sort((a: any, b: any) =>
          a.severity === 'CRITICAL' ? -1 : b.severity === 'CRITICAL' ? 1 : 0
        );
        setAnomalies(sorted.slice(0, 50));
      })
      .catch(() => setAnomalyError('Failed to load AI anomaly alerts.'))
      .finally(() => setAnomalyLoading(false));
  }, []);

  const s = {
    page: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 0,
      background: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    addBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#4f46e5",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "10px 18px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    body: {
      display: "flex",
      flex: 1,
      gap: 0,
    },
    main: {
      flex: 1,
      padding: "14px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
      minWidth: 0,
    },
    metricsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
    },
    metricCard: (accent: string) => ({
      position: "relative" as const,
      background: "#fff",
      borderRadius: 14,
      padding: "12px 20px 12px 24px",
      border: "1px solid #e2e8f0",
      overflow: "hidden" as const,
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    }),
    metricLabel: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: 500,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a",
      margin: "2px 0 0",
    },
    filtersSection: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
    },
    topControls: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
    },
    propDropWrap: { width: 420 },
    tabsWrap: {
      display: "flex",
      gap: 2,
      background: "#f1f5f9",
      borderRadius: 10,
      padding: 3,
    },
    tab: (active: boolean) => ({
      padding: "6px 16px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      border: "none",
      background: active ? "#fff" : "transparent",
      color: active ? "#4f46e5" : "#64748b",
      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      transition: "all 0.15s",
    }),
    exportBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: "1px solid #e2e8f0",
      background: "#fff",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 13,
      fontWeight: 500,
      color: "#334155",
      cursor: "pointer",
    },
    tableWrap: {
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #e2e8f0",
      overflow: "hidden",
    },
    tableHead: {
      display: "grid",
      gridTemplateColumns: "100px 2fr 1.2fr 1fr 1fr 120px",
      padding: "10px 20px",
      borderBottom: "1px solid #e2e8f0",
      fontSize: 10,
      fontWeight: 600,
      color: "#4b515a",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      gap: 12,
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "100px 2fr 1.2fr 1fr 1fr 120px",
      padding: "12px 20px",
      borderBottom: "1px solid #f1f5f9",
      alignItems: "center",
      gap: 12,
      cursor: "pointer",
      transition: "background 0.12s",
    },
    statusBadge: (status: string) => {
      const map: Record<string, { bg: string; color: string }> = {
        paid: { bg: "#ecfdf5", color: "#10b981" },
        pending: { bg: "#fffbeb", color: "#f59e0b" },
        overdue: { bg: "#fff1f2", color: "#ef4444" },
      };
      const st = map[status] ?? { bg: "#f1f5f9", color: "#64748b" };
      return {
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        background: st.bg,
        color: st.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      };
    },
    catBadge: (cat: string) => ({
      fontSize: 11,
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: 20,
      background: categoryBg(cat),
      color: categoryColor(cat),
      display: "inline-block",
    }),
    actionsGroup: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    actionBtn: (primary: boolean) => ({
      padding: "5px 12px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 500,
      border: primary ? "none" : "1px solid #e2e8f0",
      background: primary ? "#4f46e5" : "#fff",
      color: primary ? "#fff" : "#334155",
      cursor: "pointer",
    }),
    markPaidBtn: (loading: boolean) => ({
      padding: "5px 12px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      border: "1px solid #a7f3d0",
      background: "#ecfdf5",
      color: "#10b981",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.6 : 1,
    }),
  };

  const metrics = [
    { label: "Total Expenses", value: fmt(summary.total), accent: "#ef4444" },
    { label: "Maintenance", value: fmt(summary.maintenance), accent: "#f59e0b" },
    { label: "Utilities", value: fmt(summary.utilities), accent: "#3b82f6" },
    { label: "Insurance", value: fmt(summary.insurance), accent: "#8b5cf6" },
  ];

  const goToNewExpense = () => {
    router.push("/payments/expenses/new");
  };

  const handleMarkPaid = async (id: number) => {
    if (markingPaidId) return;
    setMarkingPaidId(id);
    try {
      const res = await api.patch(`/api/expenses/${id}/status`, { status: "paid" });
      const updatedStatus = res.data?.expense?.paymentStatus ?? "paid";
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, paymentStatus: updatedStatus } : e))
      );
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to update expense status");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const getExpenseActions = (exp: Expense) => {
    const openDetails = () => {
      router.push(`/payments/expenses/view/${exp.id}`);
    };

    const isPaid = (exp.paymentStatus ?? "pending") === "paid";
    const isMarking = markingPaidId === exp.id;

    return (
      <>
        <button style={s.actionBtn(false)} onClick={openDetails}>
          Details
        </button>
        {!isPaid && (
          <button
            style={s.markPaidBtn(isMarking)}
            onClick={() => handleMarkPaid(exp.id)}
            disabled={isMarking}
          >
            {isMarking ? "Marking…" : "Mark Paid"}
          </button>
        )}
      </>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.body}>
        <div style={s.main}>
          {/* METRIC CARDS */}
          <div style={s.metricsRow}>
            {metrics.map((m) => (
              <div key={m.label} style={s.metricCard(m.accent)}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    background: m.accent,
                  }}
                />
                <div>
                  <div style={s.metricLabel}>{m.label}</div>
                  <div style={s.metricValue}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER ROW */}
          <div style={s.filtersSection}>
            <div style={s.topControls}>
              <div style={s.propDropWrap}>
                <CustomDropdown
                  options={propertyOptions}
                  value={selectedProperty}
                  onChange={setSelectedProperty}
                  labelKey="label"
                  valueKey="value"
                />
              </div>

              <div style={s.actionsGroup}>
                <button style={s.exportBtn}>📄 Export CSV</button>

                <button style={s.addBtn} onClick={goToNewExpense}>
                  <span>+</span> Add Expense
                </button>
              </div>
            </div>

            <div style={s.tabsWrap}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  style={s.tab(statusTab === tab)}
                  onClick={() => setStatusTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div style={s.tableWrap}>
            <div style={s.tableHead}>
              <div>Date</div>
              <div>Vendor &amp; Property</div>
              <div>Category</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  No expenses match your filters
                </div>
                <button style={{ ...s.actionBtn(true), padding: "8px 18px" }} onClick={goToNewExpense}>
                  Add your first expense
                </button>
              </div>
            ) : (
              <>
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={s.tableRow}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {new Date(exp.date).toLocaleDateString("en-KE", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.vendorName || exp.category}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {exp.property?.title ?? "—"}
                      </div>
                    </div>

                    <div>
                      <span style={s.catBadge(exp.category)}>{exp.category}</span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                      {fmt(exp.amount)}
                    </div>

                    <div>
                      <span style={s.statusBadge(exp.paymentStatus ?? "pending")}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: (exp.paymentStatus ?? "pending") === "paid" ? "#10b981"
                            : (exp.paymentStatus ?? "pending") === "overdue" ? "#ef4444" : "#f59e0b",
                          display: "inline-block",
                        }} />
                        {exp.paymentStatus ?? "pending"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      {getExpenseActions(exp)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* AI FINANCIAL AUDIT ALERTS */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Financial Audit Alerts</h3>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>Powered by Nexus AI</span>
            </div>

            {anomalyLoading ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}>⏳ Scanning for financial anomalies...</div>
              </div>
            ) : anomalyError ? (
              <div style={{ padding: "20px", color: "#ef4444", fontSize: 13 }}>
                ⚠ {anomalyError}
              </div>
            ) : anomalies.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>No anomalies detected</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>All financial activity looks normal.</div>
              </div>
            ) : (
              <div>
                {anomalies.map((alert: any) => (
                  <div key={alert.id} style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                      background: alert.severity === 'CRITICAL' ? "#fff1f2" : "#fffbeb",
                      color: alert.severity === 'CRITICAL' ? "#ef4444" : "#f59e0b",
                      border: `1px solid ${alert.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                    }}>
                      {alert.severity}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>{alert.message}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        {alert.propertyTitle} &nbsp;·&nbsp; Confidence: {alert.confidenceScore?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}