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
  const [formVendor, setFormVendor] = useState("");
  const [formReceipt, setFormReceipt] = useState<File | null>(null);

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
    setFormVendor("");
    setFormReceipt(null);
  };

const handleCreateExpense = async () => {
  if (
    formProperty === "all" ||
    !formAmount ||
    formAmount <= 0 ||
    !formMpesaPaidTo.trim()
  ) {
    return;
  }

  setCreating(true);

  try {
    const formData = new FormData();

    formData.append("propertyId", formProperty);
    formData.append("amount", String(formAmount));
    formData.append("category", formCategory);
    formData.append("description", formDescription || "");
    formData.append("mpesaPaidTo", formMpesaPaidTo.trim());
    formData.append("vendor", formVendor);
    formData.append("date", new Date().toISOString());

    if (formReceipt) {
      formData.append("receipt", formReceipt);
    }

    const res = await api.post(
      "/api/expenses",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

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
      fontSize: 18,
      fontWeight: 700,
      color: "#0f172a",
      margin: 0,
    },
    subheading: {
      fontSize: 11,
      color: "#94a3b8",
      margin: "4px 0 0",
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
  {
    label: "Total Expenses",
    value: fmt(summary.total),
    accent: "#ef4444",
  },
  {
    label: "Maintenance",
    value: fmt(summary.maintenance),
    accent: "#f59e0b",
  },
  {
    label: "Utilities",
    value: fmt(summary.utilities),
    accent: "#3b82f6",
  },
  {
    label: "Insurance",
    value: fmt(summary.insurance),
    accent: "#8b5cf6",
  },
];

const getExpenseActions = (exp: Expense) => {
  const status = (exp.paymentStatus ?? "pending").toLowerCase();

  const openDetails = () => {
      router.push(`/payments/expenses/view/${exp.id}`);
    };

  const payNow = () => handlePayExpense(exp);

  if (status === "paid") {
    return (
      <button style={s.actionBtn(false)} onClick={openDetails}>
        Details
      </button>
    );
  }

  return (
    <>
      <button style={s.actionBtn(false)} onClick={openDetails}>
        👁
      </button>

      <button
        style={{ ...s.actionBtn(true), opacity: payingId === exp.id ? 0.7 : 1 }}
        disabled={payingId === exp.id}
        onClick={payNow}
      >
        {payingId === exp.id ? "…" : "Pay Now"}
      </button>
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
      <button style={s.exportBtn}>
        📄 Export CSV
      </button>

      <button
        style={s.addBtn}
        onClick={() => setShowAddModal(true)}
      >
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
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {new Date(exp.date).toLocaleDateString("en-KE", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </div>

                    {/* DESCRIPTION + PROPERTY */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
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
  {getExpenseActions(exp)}
</div>
                  </div>
                ))}
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Amount (ksh)</label>
                  <input
                    type="number"
                    value={Number.isFinite(formAmount) ? formAmount : 0}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    placeholder="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", boxSizing: "border-box" }}
                  />
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
              {/* Vendor */}
              <div>
               <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
               >
                Vendor
              </label>
              <input
                type="text"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="e.g. ABC Plumbing Services"
                style={{
                 width: "100%",
                 padding: "10px 14px",
                 border: "1px solid #e2e8f0",
                 borderRadius: 10,
                 fontSize: 14,
                 color: "#0f172a",
                 outline: "none",
                 boxSizing: "border-box",
               }}
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
               {/* Receipt / Invoice */}
              <div>
              <label
                style={{
                 fontSize: 12,
                 fontWeight: 600,
                 color: "#374151",
                 display: "block",
                 marginBottom: 8,
                }}
              >
                Receipt / Invoice
              </label>
              <label
                htmlFor="receipt-upload"
                style={{
                 border: "2px dashed #cbd5e1",
                 borderRadius: 12,
                 padding: "24px",
                 display: "flex",
                 flexDirection: "column",
                 alignItems: "center",
                 justifyContent: "center",
                 background: "#ffffff",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
                 textAlign: "center",
               }}
               onMouseEnter={(e) => {
               e.currentTarget.style.background = "#f8fafc";
               e.currentTarget.style.borderColor = "#4f46e5";
              }}
              onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
              }}
               >
   {formReceipt ? (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: 36,
      color: "#10b981",
      marginBottom: 8,
    }}
  >
    task_alt
  </span>
) : (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: 36,
      color: "#4f46e5",
      marginBottom: 8,
    }}
  >
    cloud_upload
  </span>
)}

    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
      }}
    >
      Upload Invoice or Receipt
    </div>

    <div
      style={{
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
      }}
    >
      PDF, PNG, or JPG (Max 5MB)
    </div>

    {formReceipt && (
      <div
        style={{
          marginTop: 12,
          padding: "6px 12px",
          background: "#eef2ff",
          color: "#4f46e5",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        ✓ {formReceipt.name}
      </div>
    )}
  </label>

  <input
    id="receipt-upload"
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    hidden
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;

      if (file && file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setFormReceipt(file);
    }}
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