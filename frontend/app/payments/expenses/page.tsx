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
    Maintenance: "#f97316",
    Utilities: "#60a5fa",
    Insurance: "#ef4444",
    Admin: "#fbbf24",
    Other: "#a78bfa",
  };
  return colors[category] || "#6366f1";
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [selectedProperty, setSelectedProperty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const [formProperty, setFormProperty] = useState("all");
  const [formCategory, setFormCategory] = useState("Maintenance");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formMpesaPaidTo, setFormMpesaPaidTo] = useState<string>("");

  const summary = expenses.reduce((acc: ExpenseSummary, exp) => {
    if (selectedProperty !== "all" && exp.propertyId !== Number(selectedProperty)) return acc;
    if (filterCategory !== "all" && exp.category !== filterCategory) return acc;

    acc.total += exp.amount;
    acc.count += 1;
    if (exp.category === "Maintenance") acc.maintenance += exp.amount;
    else if (exp.category === "Utilities") acc.utilities += exp.amount;
    else if (exp.category === "Insurance") acc.insurance += exp.amount;
    return acc;
  }, { total: 0, maintenance: 0, utilities: 0, insurance: 0, count: 0 });

  const filteredExpenses = expenses.filter(
    (exp) =>
      (selectedProperty === "all" || exp.propertyId === Number(selectedProperty)) &&
      (filterCategory === "all" || exp.category === filterCategory)
  );

  const CATEGORIES = useMemo(
    () => [
      { label: "All Categories", value: "all", color: "#6366f1" },
      { label: "Maintenance", value: "Maintenance", color: "#f97316" },
      { label: "Utilities", value: "Utilities", color: "#60a5fa" },
      { label: "Insurance", value: "Insurance", color: "#ef4444" },
      { label: "Admin", value: "Admin", color: "#fbbf24" },
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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (loadingProperties) return;
    fetchExpenses();
  }, [loadingProperties, fetchExpenses]);

  const resetForm = () => {
    setFormProperty("all");
    setFormCategory("Maintenance");
    setFormAmount(0);
    setFormDescription("");
    setFormMpesaPaidTo("");
  };

  const handleCreateExpense = async () => {
    if (formProperty === "all") return;
    if (!formAmount || formAmount <= 0) return;
    if (!formMpesaPaidTo.trim()) return;

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
      console.error("Failed to create expense", e);
      alert(e?.response?.data?.error ?? "Failed to create expense");
    } finally {
      setCreating(false);
    }
  };

const handlePayExpense = async (exp: Expense) => {
  const chosen =
    exp.mpesaPaidTo ||
    exp.vendorAccount?.identifier ||
    "";

  if (!chosen) {
    alert("No Mpesa account linked to this expense.");
    return;
  }

  setPayingId(exp.id);

  try {
    const payload = { mpesaPaidTo: chosen };

    await api.post(`/api/expenses/${exp.id}/pay`, payload);

    setRefreshTick((t) => t + 1);
  } catch (e: any) {
    console.error("Failed to pay expense", e);
    alert(e?.response?.data?.error ?? "Failed to pay expense");
  } finally {
    setPayingId(null);
  }
};

  const isPaid = (exp: Expense) => (exp.paymentStatus ?? "pending") === "paid";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ width: 280 }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            Property
          </div>
          <CustomDropdown
            options={propertyOptions}
            value={selectedProperty}
            onChange={setSelectedProperty}
            labelKey="label"
            valueKey="value"
          />
        </div>

        <div style={{ width: 280 }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            Category
          </div>
          <CustomDropdown
            options={CATEGORIES}
            value={filterCategory}
            onChange={setFilterCategory}
            labelKey="label"
            valueKey="value"
          />
        </div>

        <NeonButton
          variant="primary"
          onClick={() => setShowAddModal(true)}
          style={{
            background: "linear-gradient(to right,var(--neon-blue),var(--neon-purple))",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontWeight: 600,
            cursor: "pointer",
            width: "150px",
            fontSize: 13,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ➕ Add Expense
        </NeonButton>

        <NeonButton
          variant="ghost"
          onClick={() => setRefreshTick((t) => t + 1)}
          style={{ padding: "13px 16px", width: "140px" }}
        >
          {loadingExpenses ? "⟳ Loading…" : "↻ Refresh"}
        </NeonButton>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard
          label="Total Expenses"
          value={`KES ${(summary.total / 1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #ef4444, #f97316)"
        />
        <MetricCard
          label="Maintenance"
          value={`KES ${(summary.maintenance / 1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #f97316, #fb923c)"
        />
        <MetricCard
          label="Utilities"
          value={`KES ${(summary.utilities / 1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #60a5fa, #3b82f6)"
        />
        <MetricCard
          label="Count"
          value={summary.count.toLocaleString()}
          accent="linear-gradient(90deg, #a78bfa, #8b5cf6)"
        />
      </div>

     <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
  {/* HEADER */}
  <div
    style={{
      padding: "16px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <SectionTag>💸 Expenses ({filteredExpenses.length})</SectionTag>
  </div>

  {/* EMPTY STATE */}
  {filteredExpenses.length === 0 ? (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,0.3)",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
      <div style={{ fontSize: 16, marginBottom: 8 }}>
        No expenses match your filters
      </div>
      <NeonButton variant="ghost" onClick={() => setShowAddModal(true)}>
        Add your first expense
      </NeonButton>
    </div>
  ) : (
    <>
      {/* TABLE HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr 1fr auto",
          padding: "12px 20px",
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <div>Property</div>
        <div>Category</div>
        <div>Vendor</div>
        <div>Date</div>
        <div>Amount</div>
        <div>Status</div>
        <div style={{ textAlign: "right" }}>Action</div>
      </div>

      {/* ROWS */}
      {filteredExpenses.map((exp) => (
        <div
          key={exp.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr 1fr auto",
            alignItems: "center",
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            transition: "all 0.2s",
            gap: 12,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
          }
        >
          {/* PROPERTY + DESCRIPTION */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
              {exp.property?.title ?? "—"}
            </div>
          </div>

          {/* CATEGORY */}
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              width: "fit-content",
              background: `${categoryColor(exp.category)}20`,
              color: categoryColor(exp.category),
              border: `1px solid ${categoryColor(exp.category)}40`,
            }}
          >
            {exp.category}
          </div>

          {/* VENDOR */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {exp.vendorAccount?.name ?? exp.mpesaPaidTo ?? "—"}
          </div>

          {/* DATE */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {new Date(exp.date).toLocaleDateString("en-KE")}
          </div>

          {/* AMOUNT */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {fmt(exp.amount)}
          </div>

          {/* STATUS */}
<div>
  <div
    style={{
      fontSize: 11,
      padding: "4px 8px",
      borderRadius: 8,
      width: "fit-content",
      background:
        exp.paymentStatus === "paid"
          ? "rgba(0,255,135,0.1)"
          : exp.paymentStatus === "pending"
          ? "rgba(255,180,0,0.1)"
          : "rgba(255,255,255,0.08)",
      color:
        exp.paymentStatus === "paid"
          ? "#00ff87"
          : exp.paymentStatus === "pending"
          ? "#ffb400"
          : "#aaa",
    }}
  >
    {exp.paymentStatus ?? "UNKNOWN"}
  </div>
</div>

          {/* ACTION / STATUS */}
          <div style={{ textAlign: "right" }}>
           {exp.paymentStatus === "paid" ? null : (
  <NeonButton
    variant="primary"
    disabled={payingId === exp.id}
    onClick={() => handlePayExpense(exp)}
    style={{
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: 12,
    }}
  >
    {payingId === exp.id ? "Paying…" : "Pay"}
  </NeonButton>
)}
          </div>
        </div>
      ))}

      {/* FOOTER */}
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            Total Selected
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
            {fmt(summary.total)}
          </div>
        </div>
      </div>
    </>
  )}
</GlassPanel>

      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <GlassPanel
            style={{
              width: "90%",
              maxWidth: "760px",
              padding: "10px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <SectionTag>➕ New Expense</SectionTag>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ width: 280 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Property
                  </div>
                  <CustomDropdown
                    options={propertyOptions}
                    value={formProperty}
                    onChange={setFormProperty}
                    labelKey="label"
                    valueKey="value"
                  />
                </div>

                <div style={{ width: 280 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Category
                  </label>
                  <CustomDropdown
                    options={CATEGORIES}
                    value={formCategory}
                    onChange={setFormCategory}
                    labelKey="label"
                    valueKey="value"
                  />
                </div>

                <div style={{ width: 280 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    value={Number.isFinite(formAmount) ? formAmount : 0}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    placeholder="KES 0"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ width: 280 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Plumbing repair, roof leak, etc."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ width: 500 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Mpesa account no or phone number (paid to)
                  </label>
                  <input
                    type="text"
                    value={formMpesaPaidTo}
                    onChange={(e) => setFormMpesaPaidTo(e.target.value)}
                    placeholder="e.g. 0712 345 678 or 1234567890"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <NeonButton variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </NeonButton>
                <NeonButton
                  variant="primary"
                  onClick={handleCreateExpense}
                  disabled={creating || formProperty === "all" || formAmount <= 0 || !formMpesaPaidTo.trim()}
                >
                  {creating ? "Adding…" : "Add Expense"}
                </NeonButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

