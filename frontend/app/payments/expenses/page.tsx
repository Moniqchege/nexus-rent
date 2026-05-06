"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassPanel, SectionTag, NeonButton, MetricCard } from "../_lib/components";
import { MOCK_EXPENSES, fmt } from "../_lib/data";
import type { Expense } from "../_lib/types";
import api from "@/app/lib/api";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";

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
    "Maintenance": "#f97316",
    "Utilities": "#60a5fa", 
    "Insurance": "#ef4444",
    "Admin": "#fbbf24",
    "Other": "#a78bfa",
  };
  return colors[category] || "#6366f1";
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formProperty, setFormProperty] = useState("all");
  const [formCategory, setFormCategory] = useState("Maintenance");

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

  const filteredExpenses = expenses.filter(exp =>
  (selectedProperty === "all" || exp.propertyId === Number(selectedProperty)) &&
  (filterCategory === "all" || exp.category === filterCategory)
);

  const categories = ["all", ...Array.from(new Set(expenses.map(e => e.category))).sort()];

const handleAddExpense = async (formData: Partial<Expense>) => {
  setLoading(true);

  await new Promise(resolve => setTimeout(resolve, 1000));

  const selected = properties.find(p => p.id === Number(formProperty));

  const newExpense: Expense = {
    id: expenses.length + 1,
    propertyId: selected?.id || 0,
    property: selected ? { title: selected.title } : undefined,
    amount: formData.amount || 0,
    category: formData.category || "Maintenance",
    description: formData.description || "",
    date: new Date().toISOString().slice(0, 10),
  };

  setExpenses([newExpense, ...expenses]);
  setShowAddModal(false);
  setLoading(false);
};

  const CATEGORIES: {label: string, value: string, color: string}[] = [
    {label: "All Categories", value: "all", color: "#6366f1"},
    {label: "Maintenance", value: "Maintenance", color: "#f97316"},
    {label: "Utilities", value: "Utilities", color: "#60a5fa"},
    {label: "Insurance", value: "Insurance", color: "#ef4444"},
    {label: "Admin", value: "Admin", color: "#fbbf24"},
  ];

  useEffect(() => {
  setLoadingProperties(true);
  api
    .get("/api/properties")
    .then((res) => setProperties(res.data ?? []))
    .catch((err) => console.error("Failed to load properties", err))
    .finally(() => setLoadingProperties(false));
}, []);

const propertyOptions = useMemo(() => [
  { label: "All Properties", value: "all" },
  ...properties.map((p) => ({
    label: p.title,
    value: String(p.id),
  })),
], [properties]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ width: 300 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Property</div>
          <CustomDropdown
            options={propertyOptions}
            value={selectedProperty}
            onChange={setSelectedProperty}
            labelKey="label"
            valueKey="value"
          />
        </div>
        <div style={{ width: 300 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase" }}>Category</div>
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
            width: "140px",
            fontSize: 13,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ➕ Add Expense
        </NeonButton>
        <NeonButton 
          variant="ghost" 
          onClick={() => window.location.reload()}
          style={{padding: "13px 16px", width: "140px"}}
        >
          ↻ Refresh
        </NeonButton>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard 
          label="Total Expenses" 
          value={`KES ${(summary.total/1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #ef4444, #f97316)"
        />
        <MetricCard 
          label="Maintenance" 
          value={`KES ${(summary.maintenance/1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #f97316, #fb923c)"
        />
        <MetricCard 
          label="Utilities" 
          value={`KES ${(summary.utilities/1000).toFixed(0)}K`}
          accent="linear-gradient(90deg, #60a5fa, #3b82f6)"
        />
        <MetricCard 
          label="Count" 
          value={summary.count.toLocaleString()}
          accent="linear-gradient(90deg, #a78bfa, #8b5cf6)"
        />
      </div>

      {/* Expenses List */}
      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTag>💸 Expenses ({filteredExpenses.length})</SectionTag>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Total: {fmt(summary.total)}
          </div>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No expenses match your filters</div>
            <NeonButton variant="ghost" onClick={() => setShowAddModal(true)}>
              Add your first expense
            </NeonButton>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div key={exp.id} style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              background: "rgba(255,255,255,0.02)",
              transition: "all 0.2s"
            }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} 
               onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
              
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{
                    padding: "4px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: `${categoryColor(exp.category)}20`,
                    color: categoryColor(exp.category),
                    border: `1px solid ${categoryColor(exp.category)}40`
                  }}>
                    {exp.category}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{exp.property?.title ?? "—"}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                  {exp.description} • {new Date(exp.date).toLocaleDateString("en-KE")}
                </div>
              </div>
              
              <div style={{ textAlign: "right", minWidth: 120 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{fmt(exp.amount)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {new Date(exp.date).toLocaleDateString("short")}
                </div>
              </div>
            </div>
          ))
        )}

        {filteredExpenses.length > 0 && (
          <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Total Selected</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{fmt(summary.total)}</div>
            </div>
          </div>
        )}
      </GlassPanel>
      {showAddModal && (
        <div style={{
          position: "fixed", 
          inset: 0, 
          background: "rgba(0,0,0,0.7)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(8px)"
        }} 
        onClick={() => setShowAddModal(false)}>
          <GlassPanel 
          style={{ 
            width: "90%", 
            maxWidth: "700px",
            padding: "10px",
            position: "relative"
          }} 
          onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <SectionTag>➕ New Expense</SectionTag>
            </div>
            <div style={{ padding: 24 }}>
              {/* Form fields */}
              <div style={{  display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end"  }}>
                <div style={{ width: 300 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Property</div>
                  <CustomDropdown
                    options={propertyOptions}
                    value={formProperty}
                    onChange={setFormProperty}
                    labelKey="label"
                    valueKey="value"
                  />
                </div>
                <div style={{ width: 300 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Category</label>
                  <CustomDropdown
                    options={CATEGORIES}
                    value={formCategory}
                    onChange={setFormCategory}
                    labelKey="label"
                    valueKey="value"
                  />
                </div>
                <div style={{ width: 300 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Amount</label>
                  <input type="number" placeholder="KES 0" style={{
                    width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff",
                    fontSize: 14
                  }} />
                </div>
                <div style={{ width: 300 }}>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Description</label>
                  <input type="text" placeholder="Plumbing repair, roof leak, etc." style={{
                    width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff",
                    fontSize: 14
                  }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <NeonButton variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </NeonButton>
                <NeonButton variant="primary" onClick={() => handleAddExpense({})} disabled={loading}>
                  {loading ? "Adding..." : "Add Expense"}
                </NeonButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

