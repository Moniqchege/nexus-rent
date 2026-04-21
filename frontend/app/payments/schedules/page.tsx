"use client";

import { useState, useMemo } from "react";
import { MOCK_SCHEDULES, PROPERTIES, fmt } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton, StatusBadge, Checkbox } from "../_lib/components";
import type { SchedStatus } from "../_lib/types";

const PAGE_SIZE = 20;

export default function SchedulesPage() {
  const schedules = MOCK_SCHEDULES;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SchedStatus | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "amount" | "daysOverdue" | "property">("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkDone, setBulkDone] = useState(false);

  const counts = {
    all:       schedules.length,
    paid:      schedules.filter((s) => s.status === "paid").length,
    overdue:   schedules.filter((s) => s.status === "overdue").length,
    partial:   schedules.filter((s) => s.status === "partial").length,
    scheduled: schedules.filter((s) => s.status === "scheduled").length,
  };
  const totals = {
    overdue:   schedules.filter((s) => s.status === "overdue").reduce((a, s) => a + s.amount + (s.lateFeeAmount || 0), 0),
    partial:   schedules.filter((s) => s.status === "partial").reduce((a, s) => a + s.amount - s.allocatedAmount, 0),
    scheduled: schedules.filter((s) => s.status === "scheduled").reduce((a, s) => a + s.amount, 0),
    paid:      schedules.filter((s) => s.status === "paid").reduce((a, s) => a + s.amount, 0),
  };

  const filtered = useMemo(() => {
    let r = [...schedules];
    if (statusFilter !== "all") r = r.filter((s) => s.status === statusFilter);
    if (propertyFilter !== "all") r = r.filter((s) => s.property === propertyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) => s.tenantName.toLowerCase().includes(q) || s.unit.toLowerCase().includes(q) || s.phone.includes(q));
    }
    r.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortBy === "name")        { va = a.tenantName; vb = b.tenantName; }
      else if (sortBy === "amount") { va = a.amount;     vb = b.amount; }
      else if (sortBy === "daysOverdue") { va = a.daysOverdue || 0; vb = b.daysOverdue || 0; }
      else if (sortBy === "property") { va = a.property; vb = b.property; }
      if (typeof va === "string" && typeof vb === "string") {
  return sortDir === "asc"
    ? va.localeCompare(vb)
    : vb.localeCompare(va);
}

if (typeof va === "number" && typeof vb === "number") {
  return sortDir === "asc"
    ? va - vb
    : vb - va;
}

return 0;
    });
    return r;
  }, [schedules, statusFilter, propertyFilter, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map((s) => s.id)));
  };

  const handleBulk = () => {
    if (!bulkAction || selected.size === 0) return;
    setBulkDone(true);
    setTimeout(() => { setBulkDone(false); setSelected(new Set()); setBulkAction(""); }, 2500);
  };

  const handleSort = (col: "name" | "amount" | "daysOverdue" | "property") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ fontSize: 9, color: sortBy === col ? "#a78bfa" : "rgba(255,255,255,0.2)", marginLeft: 3 }}>
      {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  const statusCards = [
    { status: "overdue"   as SchedStatus, label: "Overdue",   icon: "🔴", color: "#ef4444", count: counts.overdue,   total: totals.overdue },
    { status: "partial"   as SchedStatus, label: "Partial",   icon: "🟡", color: "#fbbf24", count: counts.partial,   total: totals.partial },
    { status: "scheduled" as SchedStatus, label: "Scheduled", icon: "🔵", color: "#a78bfa", count: counts.scheduled, total: totals.scheduled },
    { status: "paid"      as SchedStatus, label: "Paid",      icon: "🟢", color: "#00ff87", count: counts.paid,      total: totals.paid },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Status summary cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {statusCards.map((c) => (
          <div key={c.status} onClick={() => { setStatusFilter((s) => (s === c.status ? "all" : c.status)); setPage(1); }}
            style={{ flex: 1, minWidth: 140, background: statusFilter === c.status ? `${c.color}1a` : "rgba(255,255,255,0.03)", border: `1px solid ${statusFilter === c.status ? c.color + "40" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "14px 18px", cursor: "pointer", transition: "all .2s", boxShadow: statusFilter === c.status ? `0 0 20px ${c.color}20` : "" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{c.icon} {c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color, textShadow: `0 0 20px ${c.color}40` }}>{c.count}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>KES {Math.round(c.total / 1000)}K outstanding</div>
              </div>
              {statusFilter === c.status && <div style={{ fontSize: 10, color: c.color, border: `1px solid ${c.color}40`, borderRadius: 4, padding: "2px 6px" }}>Active ✓</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <GlassPanel style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍  Search tenant, unit or phone…"
            style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as SchedStatus | "all"); setPage(1); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            <option value="all"       style={{ background: "#1a1a2e" }}>All Statuses ({counts.all})</option>
            <option value="overdue"   style={{ background: "#1a1a2e" }}>Overdue ({counts.overdue})</option>
            <option value="partial"   style={{ background: "#1a1a2e" }}>Partial ({counts.partial})</option>
            <option value="scheduled" style={{ background: "#1a1a2e" }}>Scheduled ({counts.scheduled})</option>
            <option value="paid"      style={{ background: "#1a1a2e" }}>Paid ({counts.paid})</option>
          </select>
          <select value={propertyFilter} onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            <option value="all" style={{ background: "#1a1a2e" }}>All Properties</option>
            {PROPERTIES.map((p) => <option key={p} value={p} style={{ background: "#1a1a2e" }}>{p}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {selected.size > 0 && (
              <>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "7px 10px", color: "#a78bfa", fontSize: 12 }}>
                  <option value=""          style={{ background: "#1a1a2e" }}>Bulk Action ({selected.size})</option>
                  <option value="remind"    style={{ background: "#1a1a2e" }}>Send Reminders</option>
                  <option value="waivefee"  style={{ background: "#1a1a2e" }}>Waive Late Fees</option>
                  <option value="export"    style={{ background: "#1a1a2e" }}>Export Selected</option>
                </select>
                <NeonButton variant="primary" onClick={handleBulk} disabled={!bulkAction}>Apply →</NeonButton>
              </>
            )}
            <NeonButton variant="ghost">Generate May ↗</NeonButton>
          </div>
        </div>
        {bulkDone && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87", fontSize: 12 }}>
            ✓ Bulk action "{bulkAction}" applied to {selected.size} tenants.
          </div>
        )}
      </GlassPanel>

      {/* Table */}
      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>📅 Rent Schedules — April 2026</SectionTag>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "10px 12px 10px 16px", textAlign: "left" }}>
                  <Checkbox checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleAll} />
                </th>
                {[
                  { label: "Tenant",       col: "name" },
                  { label: "Property / Unit", col: "property" },
                  { label: "Amount",       col: "amount" },
                  { label: "Late Fee",     col: null },
                  { label: "Days Overdue", col: "daysOverdue" },
                  { label: "Progress",     col: null },
                  { label: "Status",       col: null },
                  { label: "Action",       col: null },
                ].map((h) => (
                  <th key={h.label} onClick={h.col ? () => handleSort(h.col as "name" | "amount" | "daysOverdue" | "property") : undefined}
                    style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", cursor: h.col ? "pointer" : "default", userSelect: "none" }}>
                    {h.label}{h.col && <SortIcon col={h.col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((s) => {
                const isSelected = selected.has(s.id);
                const pct = s.amount > 0 ? Math.round((s.allocatedAmount / s.amount) * 100) : 0;
                const barColor = pct === 100 ? "#00ff87" : pct > 0 ? "#60a5fa" : "rgba(255,255,255,0.1)";
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSelected ? "rgba(99,102,241,0.07)" : "transparent", transition: "background .1s" }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "11px 12px 11px 16px" }}>
                      <Checkbox checked={isSelected} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.tenantName}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{s.phone}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{s.property}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.unit}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{fmt(s.amount)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: s.lateFeeAmount ? "#ef4444" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                      {s.lateFeeAmount ? fmt(s.lateFeeAmount) : "—"}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {s.daysOverdue
                        ? <span style={{ fontSize: 12, fontWeight: 700, color: s.daysOverdue > 30 ? "#ef4444" : s.daysOverdue > 14 ? "#f97316" : "#fbbf24" }}>{s.daysOverdue}d</span>
                        : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, boxShadow: pct > 0 ? `0 0 4px ${barColor}80` : undefined, transition: "width .3s" }} />
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 24 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      {s.status === "overdue"   && <NeonButton variant="danger"  style={{ fontSize: 10, padding: "5px 10px" }}>Remind</NeonButton>}
                      {s.status === "scheduled" && <NeonButton variant="ghost"   style={{ fontSize: 10, padding: "5px 10px" }}>Verify</NeonButton>}
                      {s.status === "paid"      && <NeonButton variant="success" style={{ fontSize: 10, padding: "5px 10px" }}>Receipt</NeonButton>}
                      {s.status === "partial"   && <NeonButton variant="warning" style={{ fontSize: 10, padding: "5px 10px" }}>Details</NeonButton>}
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No schedules match your filters</div>
                    <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, marginTop: 4 }}>Try adjusting the search or status filter</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{filtered.length} tenants · Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <NeonButton variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ fontSize: 11, padding: "5px 10px" }}>← Prev</NeonButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .map((p, i, arr) => (
                  <>
                    {i > 0 && arr[i - 1] < p - 1 && <span key={`e${p}`} style={{ color: "rgba(255,255,255,0.2)", padding: "5px 4px", fontSize: 12 }}>…</span>}
                    <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: p === page ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.05)", color: p === page ? "#a78bfa" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{p}</button>
                  </>
                ))}
              <NeonButton variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ fontSize: 11, padding: "5px 10px" }}>Next →</NeonButton>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}