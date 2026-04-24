"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fmt } from "../_lib/data";
import { GlassPanel, SectionTag, NeonButton, StatusBadge, Checkbox } from "../_lib/components";
import { getRentSchedules, resendReceipt, verifyPayment } from "../../lib/payments";
import { getPaymentState, Payment, type RentSchedule } from "../../../types/payment";
import type { SchedStatus } from "../_lib/types";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";

const PAGE_SIZE = 20;

// ── Per-row action state ───────────────────────────────────────────────────────
type RowAction = "idle" | "loading" | "done" | "error";

function useRowAction() {
  const [state, setState] = useState<Record<number, RowAction>>({});
  const set = (id: number, s: RowAction) => setState((prev) => ({ ...prev, [id]: s }));
  return { state, set };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} style={{ padding: "14px" }}>
          <div style={{ height: 12, borderRadius: 4, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: i === 1 ? "80%" : i === 7 ? "50%" : "60%" }} />
        </td>
      ))}
    </tr>
  );
}

export default function SchedulesPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [schedules, setSchedules]   = useState<RentSchedule[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  // ── Filter / sort / page state ──────────────────────────────────────────────
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<SchedStatus | "all">("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [sortBy, setSortBy]                 = useState<"tenantName" | "amount" | "daysOverdue" | "propertyTitle">("amount");
  const [sortDir, setSortDir]               = useState<"asc" | "desc">("desc");
  const [page, setPage]                     = useState(1);
  const [selected, setSelected]             = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction]         = useState("");
  const [bulkDone, setBulkDone]             = useState(false);

  // ── Per-row action state ────────────────────────────────────────────────────
  const receipt = useRowAction();
  const verify  = useRowAction();

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRentSchedules(status === "all" ? undefined : status);
      setSchedules(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Row actions ─────────────────────────────────────────────────────────────
  const handleReceipt = async (id: number) => {
    receipt.set(id, "loading");
    try {
      await resendReceipt(id);
      receipt.set(id, "done");
      setTimeout(() => receipt.set(id, "idle"), 2500);
    } catch {
      receipt.set(id, "error");
      setTimeout(() => receipt.set(id, "idle"), 3000);
    }
  };

  const handleVerify = async (id: number) => {
    verify.set(id, "loading");
    try {
      await verifyPayment(id);
      verify.set(id, "done");
      // Refresh the row in local state so status updates instantly
      setSchedules((prev) =>
  prev.map((s) =>
    s.id === id
      ? {
          ...s,
          status: "paid",
          payment: { ...s, status: "paid" }, 
        }
      : s
  )
);
    } catch {
      verify.set(id, "error");
      setTimeout(() => verify.set(id, "idle"), 3000);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const properties = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: number; title: string }[] = [];
    schedules.forEach((s) => {
      if (s.property && !seen.has(s.property.title)) {
        seen.add(s.property.title);
        list.push({ id: s.propertyId, title: s.property.title });
      }
    });
    return list;
  }, [schedules]);

  const tenantName  = (s: RentSchedule) => s.tenant?.name  ?? `Tenant ${s.tenantId}`;
  const propTitle   = (s: RentSchedule) => s.property?.title ?? `Property ${s.propertyId}`;
  const daysOverdue = (s: RentSchedule): number => {
    if (s.status !== "overdue") return 0;
    return Math.floor((Date.now() - new Date(s.dueDate).getTime()) / 86_400_000);
  };
  const getDisplayStatus = (
  s: RentSchedule,
  payments: Payment[]
): "scheduled" | "partial" | "paid" | "overdue" => {
  const paymentState = getPaymentState(s, payments);

  if (s.status === "overdue" && paymentState !== "paid") {
    return "overdue";
  }

  return paymentState;
};

const counts = useMemo(() => ({
  all: schedules.length,

  paid: schedules.filter(
    (s) => getDisplayStatus(s, payments) === "paid"
  ).length,

  overdue: schedules.filter(
    (s) => getDisplayStatus(s, payments) === "overdue"
  ).length,

  partial: schedules.filter(
    (s) => getDisplayStatus(s, payments) === "partial"
  ).length,

  scheduled: schedules.filter(
    (s) => getDisplayStatus(s, payments) === "scheduled"
  ).length,

}), [schedules, payments]);

 const totals = useMemo(() => {
  let overdue = 0;
  let partial = 0;
  let scheduled = 0;
  let paid = 0;

  for (const s of schedules) {
    const totalPaid = payments
      .filter(p => p.status === "paid" && p.scheduleId === s.id)
      .reduce((sum, p) => sum + p.amount, 0);

    const isFullyPaid = totalPaid >= s.amount;
    const isPartial = totalPaid > 0 && totalPaid < s.amount;

    if (s.status === "overdue" && !isFullyPaid) {
      overdue += s.amount + (s.lateFeeAmount || 0);
    } else if (isPartial) {
      partial += (s.amount - totalPaid);
    } else if (s.status === "scheduled") {
      scheduled += s.amount;
    } else if (isFullyPaid) {
      paid += s.amount;
    }
  }

  return { overdue, partial, scheduled, paid };
}, [schedules, payments]);

  const filtered = useMemo(() => {
    let r = [...schedules];
    if (statusFilter !== "all") r = r.filter((s) => s.status === statusFilter);
    if (propertyFilter !== "all") r = r.filter((s) => String(s.propertyId) === propertyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) =>
        tenantName(s).toLowerCase().includes(q) ||
        propTitle(s).toLowerCase().includes(q) ||
        (s.tenant?.phone ?? "").includes(q)
      );
    }
    r.sort((a, b) => {
      if (sortBy === "tenantName") {
        const va = tenantName(a), vb = tenantName(b);
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortBy === "propertyTitle") {
        const va = propTitle(a), vb = propTitle(b);
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortBy === "daysOverdue") {
        return sortDir === "asc" ? daysOverdue(a) - daysOverdue(b) : daysOverdue(b) - daysOverdue(a);
      }
      // amount
      return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });
    return r;
  }, [schedules, statusFilter, propertyFilter, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const handleSort = (col: typeof sortBy) => {
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

  const propertyOptions = [
  { label: "All Properties", value: "all" },
  ...properties.map((p) => ({
    label: p.title,
    value: String(p.id),
  })),
];

const bulkOptions = [
  { label: `Bulk Action (${selected.size})`, value: "" },
  { label: "Send Reminders", value: "remind" },
  { label: "Waive Late Fees", value: "waivefee" },
  { label: "Export Selected", value: "export" },
];

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <GlassPanel style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Failed to load schedules</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>{error}</div>
        <NeonButton variant="primary" onClick={() => fetchSchedules()}>Retry</NeonButton>
      </GlassPanel>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Status summary cards ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {statusCards.map((c) => (
            <div key={c.status}
              onClick={() => { setStatusFilter((s) => s === c.status ? "all" : c.status); setPage(1); }}
              style={{ flex: 1, minWidth: 140, background: statusFilter === c.status ? `${c.color}1a` : "rgba(255,255,255,0.03)", border: `1px solid ${statusFilter === c.status ? c.color + "40" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "14px 18px", cursor: "pointer", transition: "all .2s", boxShadow: statusFilter === c.status ? `0 0 20px ${c.color}20` : "" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{c.icon} {c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.color, textShadow: `0 0 20px ${c.color}40` }}>
                    {loading ? <span style={{ fontSize: 16, opacity: 0.4 }}>—</span> : c.count}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                    {loading ? "Loading…" : `KES ${Math.round(c.total / 1000)}K outstanding`}
                  </div>
                </div>
                {statusFilter === c.status && (
                  <div style={{ fontSize: 10, color: c.color, border: `1px solid ${c.color}40`, borderRadius: 4, padding: "2px 6px" }}>Active ✓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <GlassPanel style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="🔍  Search tenant, unit or phone…"
              style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }} />

           <CustomDropdown
             options={propertyOptions}
             value={propertyFilter}
             onChange={(val) => {
             setPropertyFilter(val);
             setPage(1);
             }}
             labelKey="label"
             valueKey="value"
             minWidth="200px"
           />

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {selected.size > 0 && (
                <>
              <CustomDropdown
                options={bulkOptions}
                value={bulkAction}
                onChange={(val) => setBulkAction(val)}
                labelKey="label"
                valueKey="value"
                minWidth="200px"
              />
                  <NeonButton variant="primary" onClick={handleBulk} disabled={!bulkAction}>Apply →</NeonButton>
                </>
              )}
              <NeonButton variant="ghost" style={{ minWidth: 165, color: 'var(--neon-blue)', border: "0.2px solid var(--neon-blue)" }}>Generate May ↗</NeonButton>
            </div>
          </div>
          {bulkDone && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.2)", color: "#00ff87", fontSize: 12 }}>
              ✓ Bulk action "{bulkAction}" applied to {selected.size} tenants.
            </div>
          )}
        </GlassPanel>

        {/* ── Table ── */}
        <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTag>📅 Rent Schedules</SectionTag>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {loading ? "Loading…" : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ padding: "10px 12px 10px 16px", textAlign: "left" }}>
                    <Checkbox checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleAll} />
                  </th>
                  {[
                    { label: "Tenant",          col: "tenantName"    as const },
                    { label: "Property / Unit", col: "propertyTitle" as const },
                    { label: "Amount",          col: "amount"        as const },
                    { label: "Late Fee",        col: null },
                    { label: "Days Overdue",    col: "daysOverdue"   as const },
                    { label: "Progress",        col: null },
                    { label: "Status",          col: null },
                    { label: "Action",          col: null },
                  ].map((h) => (
                    <th key={h.label}
                      onClick={h.col ? () => handleSort(h.col!) : undefined}
                      style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", cursor: h.col ? "pointer" : "default", userSelect: "none" }}>
                      {h.label}{h.col && <SortIcon col={h.col} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No schedules match your filters</div>
                      <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, marginTop: 4 }}>Try adjusting the search or status filter</div>
                    </td>
                  </tr>
                ) : (
                  pageData.map((s) => {
                    const isSelected = selected.has(s.id);
                    const allocated  = s.allocatedAmount ?? 0;
                    const pct        = s.amount > 0 ? Math.round((allocated / s.amount) * 100) : 0;
                    const barColor   = pct === 100 ? "#00ff87" : pct > 0 ? "#60a5fa" : "rgba(255,255,255,0.1)";
                    const overdueDays = daysOverdue(s);
                    const rState     = receipt.state[s.id] ?? "idle";
                    const vState     = verify.state[s.id]  ?? "idle";

                    return (
                      <tr key={s.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSelected ? "rgba(99,102,241,0.07)" : "transparent", transition: "background .1s" }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>

                        <td style={{ padding: "11px 12px 11px 16px" }}>
                          <Checkbox checked={isSelected} onChange={() => toggleSelect(s.id)} />
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{tenantName(s)}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{s.tenant?.phone ?? "—"}</div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{propTitle(s)}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.unit ?? "—"}</div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                          {fmt(s.amount)}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: s.lateFeeAmount ? "#ef4444" : "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                          {s.lateFeeAmount ? fmt(s.lateFeeAmount) : "—"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {overdueDays > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: overdueDays > 30 ? "#ef4444" : overdueDays > 14 ? "#f97316" : "#fbbf24" }}>{overdueDays}d</span>
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
                        <td style={{ padding: "11px 14px" }}>
                          <StatusBadge status={s.status as any} />
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          {s.status === "overdue" && (
                            <NeonButton variant="danger" style={{ fontSize: 10, padding: "5px 10px" }}>Remind</NeonButton>
                          )}
                          {s.status === "scheduled" && (
                            <NeonButton
                              variant="ghost"
                              style={{ fontSize: 10, padding: "5px 10px", opacity: vState === "loading" ? 0.6 : 1 }}
                              disabled={vState === "loading" || vState === "done"}
                              onClick={() => handleVerify(s.id)}
                            >
                              {vState === "loading" ? "…" : vState === "done" ? "✓ Verified" : vState === "error" ? "✗ Failed" : "Verify"}
                            </NeonButton>
                          )}
                          {s.status === "paid" && (
                            <NeonButton
                              variant="success"
                              style={{ fontSize: 10, padding: "5px 10px", opacity: rState === "loading" ? 0.6 : 1 }}
                              disabled={rState === "loading"}
                              onClick={() => handleReceipt(s.id)}
                            >
                              {rState === "loading" ? "…" : rState === "done" ? "✓ Sent" : rState === "error" ? "✗ Failed" : "Receipt"}
                            </NeonButton>
                          )}
                          {getPaymentState(s, payments) === "partial" && (
                            <NeonButton variant="warning" style={{ fontSize: 10, padding: "5px 10px" }}>Details</NeonButton>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{filtered.length} schedules · Page {page} of {totalPages}</span>
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
    </>
  );
}