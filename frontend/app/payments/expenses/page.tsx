"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import { GlassPanel, MetricCard, NeonButton, SectionTag } from "../_lib/components";
import { fmt } from "../_lib/data";
import type { Expense } from "../_lib/types";

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

const CATEGORY_BREAKDOWN = [
  { label: "Maintenance", pct: 39, color: "#f59e0b" },
  { label: "Utilities", pct: 42, color: "#60a5fa" },
  { label: "Insurance", pct: 40, color: "#a78bfa" },
  { label: "Tax", pct: 32, color: "#f87171" },
  { label: "Legal", pct: 13, color: "#6366f1" },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedProperty, setSelectedProperty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [statusTab, setStatusTab] = useState<StatusTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const [formProperty, setFormProperty] = useState("all");
  const [formCategory, setFormCategory] = useState("Maintenance");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formMpesaPaidTo, setFormMpesaPaidTo] = useState<string>("");

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

  const CATEGORIES = useMemo(
    () => [
      { label: "All Categories", value: "all", color: "#6366f1" },
      { label: "Maintenance", value: "Maintenance", color: "#f59e0b" },
      { label: "Utilities", value: "Utilities", color: "#60a5fa" },
      { label: "Insurance", value: "Insurance", color: "#a78bfa" },
      { label: "Tax", value: "Tax", color: "#f87171" },
      { label: "Admin", value: "Admin", color: "#34d399" },
    ],
    []
  );

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

  const resetForm = () => {
    setFormProperty("all");
    setFormCategory("Maintenance");
    setFormAmount(0);
    setFormDescription("");
    setFormMpesaPaidTo("");
  };

  const handleCreateExpense = async () => {
    if (formProperty === "all" || !formAmount || formAmount <= 0 || !formMpesaPaidTo.trim()) return;
    setCreating(true);
    try {
      const payload = {
        propertyId: Number(formProperty),
        amount: formAmount,
        category: formCategory,
        description: formDescription || null,
        mpesaPaidTo: formMpesaPaidTo.trim(),
        date: new Date().toISOString(),
      };
      const res = await api.post("/api/expenses", payload);
      setExpenses((prev) => [res.data?.expense, ...prev]);
      setShowAddModal(false);
      resetForm();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to create expense");
    } finally {
      setCreating(false);
    }
  };

  const handlePayExpense = async (exp: Expense) => {
    const chosen = exp.mpesaPaidTo || exp.vendorAccount?.identifier || "";
    if (!chosen) { alert("No Mpesa account linked to this expense."); return; }
    setPayingId(exp.id);
    try {
      await api.post(`/api/expenses/${exp.id}/pay`, { mpesaPaidTo: chosen });
      setRefreshTick((t) => t + 1);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to pay expense");
    } finally {
      setPayingId(null);
    }
  };

  // ─── styles ────────────────────────────────────────────────────────────────
  const s = {
    page: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 0,
      background: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    topBar: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 24px",
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
    },
    searchWrap: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#f1f5f9",
      borderRadius: 10,
      padding: "9px 14px",
      border: "1px solid #e2e8f0",
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: 14,
      color: "#334155",
      width: "100%",
    },
    bellBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      border: "1px solid #e2e8f0",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 16,
    },
    addBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#4f46e5",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "9px 18px",
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
      padding: "24px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
      minWidth: 0,
    },
    sidebar: {
      width: 280,
      flexShrink: 0,
      padding: "24px 20px",
      borderLeft: "1px solid #e2e8f0",
      background: "#fff",
      display: "flex",
      flexDirection: "column" as const,
      gap: 24,
    },
    heading: {
      fontSize: 26,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    subheading: {
      fontSize: 13,
      color: "#94a3b8",
      margin: "4px 0 0",
    },
    metricsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16,
    },
    metricCard: (accent: string) => ({
      background: "#fff",
      borderRadius: 14,
      padding: "18px 20px",
      border: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    }),
    metricIcon: (bg: string) => ({
      width: 36,
      height: 36,
      borderRadius: 10,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 17,
    }),
    metricLabel: {
      fontSize: 12,
      color: "#94a3b8",
      fontWeight: 500,
    },
    metricValue: {
      fontSize: 22,
      fontWeight: 700,
      color: "#0f172a",
      margin: "2px 0 0",
    },
    metricBadge: (positive: boolean | null) => ({
      fontSize: 11,
      fontWeight: 600,
      color: positive === null ? "#64748b" : positive ? "#10b981" : "#ef4444",
      background: positive === null ? "#f1f5f9" : positive ? "#ecfdf5" : "#fff1f2",
      borderRadius: 6,
      padding: "2px 6px",
      display: "inline-block",
    }),
    filterRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap" as const,
    },
    propDropWrap: { minWidth: 180 },
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
      padding: "7px 14px",
      fontSize: 13,
      fontWeight: 500,
      color: "#334155",
      cursor: "pointer",
      marginLeft: "auto",
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
      padding: "12px 20px",
      borderBottom: "1px solid #e2e8f0",
      fontSize: 11,
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      gap: 12,
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "100px 2fr 1.2fr 1fr 1fr 120px",
      padding: "14px 20px",
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
      const s = map[status] ?? { bg: "#f1f5f9", color: "#64748b" };
      return {
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
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
    sideSection: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
    },
    sideTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    barRow: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 4,
    },
    barLabel: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#334155",
      fontWeight: 500,
    },
    barTrack: {
      height: 5,
      borderRadius: 4,
      background: "#f1f5f9",
      overflow: "hidden" as const,
    },
    quickActions: {
      background: "linear-gradient(135deg, #312e81, #4f46e5)",
      borderRadius: 14,
      padding: 16,
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    },
    qaTitle: { fontSize: 14, fontWeight: 700, color: "#fff" },
    qaSubtitle: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
    qaBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#fff",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      width: "100%",
      textAlign: "left" as const,
    },
    propCard: {
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "14px 16px",
    },
    propCardTop: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    propCardIcon: {
      width: 36,
      height: 36,
      background: "#eff6ff",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
    },
    propCardName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
    propCardSub: { fontSize: 11, color: "#94a3b8" },
    propCardRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#64748b",
      marginBottom: 8,
    },
    propFinBtn: {
      width: "100%",
      padding: "8px",
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      fontSize: 12,
      fontWeight: 500,
      color: "#334155",
      cursor: "pointer",
      marginTop: 4,
    },
  };

  const metrics = [
    { label: "Total Expenses", value: fmt(summary.total), icon: "📉", iconBg: "#fff1f2", badge: "+4.2%", positive: true },
    { label: "Maintenance", value: fmt(summary.maintenance), icon: "🏗️", iconBg: "#fffbeb", badge: "-12%", positive: false },
    { label: "Utilities", value: fmt(summary.utilities), icon: "📡", iconBg: "#eff6ff", badge: "+2.1%", positive: true },
    { label: "Insurance", value: fmt(summary.insurance), icon: "🛡️", iconBg: "#f5f3ff", badge: "Stable", positive: null },
  ];

  return (
    <div style={s.page}>
      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={s.searchWrap}>
          <span style={{ color: "#94a3b8", fontSize: 15 }}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search by description or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button style={s.bellBtn}>🔔</button>
        <button style={s.addBtn} onClick={() => setShowAddModal(true)}>
          <span>+</span> Add Expense
        </button>
      </div>

      <div style={s.body}>
        {/* MAIN */}
        <div style={s.main}>
          {/* HEADING */}
          <div>
            <h1 style={s.heading}>Payment Hub</h1>
            <p style={s.subheading}>Manage transactions, transfers and payment history.</p>
          </div>

          {/* METRIC CARDS */}
          <div style={s.metricsRow}>
            {metrics.map((m) => (
              <div key={m.label} style={s.metricCard(m.iconBg)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={s.metricIcon(m.iconBg)}>{m.icon}</div>
                  <span style={s.metricBadge(m.positive)}>{m.badge}</span>
                </div>
                <div>
                  <div style={s.metricLabel}>{m.label}</div>
                  <div style={s.metricValue}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER ROW */}
          <div style={s.filterRow}>
            <div style={s.propDropWrap}>
              <CustomDropdown
                options={propertyOptions}
                value={selectedProperty}
                onChange={setSelectedProperty}
                labelKey="label"
                valueKey="value"
              />
            </div>

            <div style={s.tabsWrap}>
              {STATUS_TABS.map((tab) => (
                <button key={tab} style={s.tab(statusTab === tab)} onClick={() => setStatusTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            <button style={s.exportBtn}>
              📄 Export CSV
            </button>
          </div>

          {/* TABLE */}
          <div style={s.tableWrap}>
            {/* HEAD */}
            <div style={s.tableHead}>
              <div>Date</div>
              <div>Description &amp; Property</div>
              <div>Category</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* EMPTY */}
            {filteredExpenses.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  No expenses match your filters
                </div>
                <button style={{ ...s.actionBtn(true), padding: "8px 18px" }} onClick={() => setShowAddModal(true)}>
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
                    {/* DATE */}
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {new Date(exp.date).toLocaleDateString("en-KE", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </div>

                    {/* DESCRIPTION + PROPERTY */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.description || exp.category}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {exp.property?.title ?? "—"}
                      </div>
                    </div>

                    {/* CATEGORY */}
                    <div>
                      <span style={s.catBadge(exp.category)}>
                        {exp.category}
                      </span>
                    </div>

                    {/* AMOUNT */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                      {fmt(exp.amount)}
                    </div>

                    {/* STATUS */}
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

                    {/* ACTIONS */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={s.actionBtn(false)} onClick={() => console.log("view", exp.id)}>
                        ☰
                      </button>
                      <button style={s.actionBtn(false)} onClick={() => console.log("edit", exp.id)}>
                        ✏️
                      </button>
                      {exp.paymentStatus !== "paid" && (
                        <button
                          style={{ ...s.actionBtn(true), opacity: payingId === exp.id ? 0.7 : 1 }}
                          disabled={payingId === exp.id}
                          onClick={() => handlePayExpense(exp)}
                        >
                          {payingId === exp.id ? "…" : "Pay"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* FOOTER */}
                <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Total Selected</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{fmt(summary.total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, width: "90%", maxWidth: 680,
              boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>New Expense</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Property */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Property</label>
                  <CustomDropdown options={propertyOptions} value={formProperty} onChange={setFormProperty} labelKey="label" valueKey="value" />
                </div>
                {/* Category */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
                  <CustomDropdown options={CATEGORIES} value={formCategory} onChange={setFormCategory} labelKey="label" valueKey="value" />
                </div>
                {/* Amount */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Amount (KES)</label>
                  <input
                    type="number"
                    value={Number.isFinite(formAmount) ? formAmount : 0}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    placeholder="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {/* Description */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Plumbing repair"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              {/* Mpesa */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>M-Pesa Account / Phone (paid to)</label>
                <input
                  type="text"
                  value={formMpesaPaidTo}
                  onChange={(e) => setFormMpesaPaidTo(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  style={{ padding: "9px 22px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#334155" }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: "9px 22px", border: "none", borderRadius: 10,
                    background: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    opacity: (creating || formProperty === "all" || formAmount <= 0 || !formMpesaPaidTo.trim()) ? 0.6 : 1,
                  }}
                  disabled={creating || formProperty === "all" || formAmount <= 0 || !formMpesaPaidTo.trim()}
                  onClick={handleCreateExpense}
                >
                  {creating ? "Adding…" : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}