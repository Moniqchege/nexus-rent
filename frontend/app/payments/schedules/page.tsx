"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fmt } from "../_lib/data";
import {
  GlassPanel,
  SectionTag,
  NeonButton,
  StatusBadge,
  Checkbox,
} from "../_lib/components";
import { theme, pageStyle, LightAlert, SkeletonRow } from "../_lib/theme";
import { getRentSchedules, resendReceipt, verifyPayment } from "../../lib/payments";
import { getPaymentState, type Payment, type RentSchedule } from "../../../types/payment";
import type { SchedStatus } from "../_lib/types";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";
import { PaginationCustomDropdown } from "@/app/components/ui/PaginationCustomDropdown";

type RowAction = "idle" | "loading" | "done" | "error";

function useRowAction() {
  const [state, setState] = useState<Record<number, RowAction>>({});
  const set = (id: number, s: RowAction) =>
    setState((prev) => ({ ...prev, [id]: s }));
  return { state, set };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SchedStatus | "all">("all");
  const [sortBy, setSortBy] = useState<
    "tenantName" | "amount" | "daysOverdue" | "propertyTitle"
  >("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkDone, setBulkDone] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const receipt = useRowAction();
  const verify = useRowAction();

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

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "paid", payment: { ...s, status: "paid" } }
            : s
        )
      );
    } catch {
      verify.set(id, "error");
      setTimeout(() => verify.set(id, "idle"), 3000);
    }
  };

  const properties = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: number; title: string; location: string }[] = [];
    schedules.forEach((s) => {
      if (s.property && !seen.has(s.property.title)) {
        seen.add(s.property.title);
        list.push({
          id: s.propertyId,
          title: s.property.title,
          location: s.property.location ?? "",
        });
      }
    });
    return list;
  }, [schedules]);

  const tenantName = (s: RentSchedule) => s.tenant?.name ?? `Tenant ${s.tenantId}`;
  const propTitle = (s: RentSchedule) =>
    s.property?.title ?? `Property ${s.propertyId}`;
  const daysOverdue = (s: RentSchedule): number => {
    if (s.status !== "overdue") return 0;
    return Math.floor(
      (Date.now() - new Date(s.dueDate).getTime()) / 86_400_000
    );
  };
  const getDisplayStatus = (
    s: RentSchedule,
    payments: Payment[]
  ): "scheduled" | "partial" | "paid" | "overdue" => {
    const paymentState = getPaymentState(s, payments);
    if (s.status === "overdue" && paymentState !== "paid") return "overdue";
    return paymentState;
  };

  const counts = useMemo(
    () => ({
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
    }),
    [schedules, payments]
  );

  const totals = useMemo(() => {
    let overdue = 0;
    let partial = 0;
    let scheduled = 0;
    let paid = 0;
    for (const s of schedules) {
      const totalPaid = payments
        .filter((p) => p.status === "paid" && p.scheduleId === s.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const isFullyPaid = totalPaid >= s.amount;
      const isPartial = totalPaid > 0 && totalPaid < s.amount;
      if (s.status === "overdue" && !isFullyPaid) {
        overdue += s.amount + (s.lateFeeAmount || 0);
      } else if (isPartial) {
        partial += s.amount - totalPaid;
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
    if (statusFilter !== "all")
      r = r.filter((s) => s.status === statusFilter);
    if (propertyFilter !== "all")
      r = r.filter((s) => String(s.propertyId) === propertyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (s) =>
          tenantName(s).toLowerCase().includes(q) ||
          propTitle(s).toLowerCase().includes(q) ||
          (s.tenant?.phone ?? "").includes(q)
      );
    }
    r.sort((a, b) => {
      if (sortBy === "tenantName") {
        const va = tenantName(a);
        const vb = tenantName(b);
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortBy === "propertyTitle") {
        const va = propTitle(a);
        const vb = propTitle(b);
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortBy === "daysOverdue") {
        return sortDir === "asc"
          ? daysOverdue(a) - daysOverdue(b)
          : daysOverdue(b) - daysOverdue(a);
      }
      return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });
    return r;
  }, [schedules, statusFilter, propertyFilter, search, sortBy, sortDir]);

const [pageSize, setPageSize] = useState(5);
const totalSchedules = filtered.length;
const totalPages = Math.max(1, Math.ceil(totalSchedules / pageSize));
const pageStart =
  totalSchedules === 0 ? 0 : (page - 1) * pageSize + 1;
const pageEnd = Math.min(page * pageSize, totalSchedules);
const pageData = filtered.slice(
  (page - 1) * pageSize,
  (page - 1) * pageSize + pageSize
);
const pageSizeOptions = [5, 10, 20, 50, 100];

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
    setTimeout(() => {
      setBulkDone(false);
      setSelected(new Set());
      setBulkAction("");
    }, 2500);
  };

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span
      style={{
        fontSize: 9,
        color: sortBy === col ? theme.accentText : theme.textSubtle,
        marginLeft: 3,
      }}
    >
      {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  const statusCards = [
    {
      status: "overdue" as SchedStatus,
      label: "Overdue",
      icon: "🔴",
      color: "#b91c1c",
      count: counts.overdue,
      total: totals.overdue,
    },
    {
      status: "partial" as SchedStatus,
      label: "Partial",
      icon: "🟡",
      color: "#b45309",
      count: counts.partial,
      total: totals.partial,
    },
    {
      status: "scheduled" as SchedStatus,
      label: "Scheduled",
      icon: "🔵",
      color: theme.accentText,
      count: counts.scheduled,
      total: totals.scheduled,
    },
    {
      status: "paid" as SchedStatus,
      label: "Paid",
      icon: "🟢",
      color: "#059669",
      count: counts.paid,
      total: totals.paid,
    },
  ];

  const propertyOptions = useMemo(
    () => [
      { label: "All Properties", value: "all" },
      ...properties.map((p) => ({ label: p.title, value: String(p.id) })),
    ],
    [properties]
  );

  const bulkOptions = [
    { label: `Bulk Action (${selected.size})`, value: "" },
    { label: "Send Reminders", value: "remind" },
    { label: "Waive Late Fees", value: "waivefee" },
    { label: "Export Selected", value: "export" },
  ];

  if (error) {
    return (
      <div style={pageStyle}>
        <GlassPanel style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div
            style={{ color: "#b91c1c", fontWeight: 600, marginBottom: 4 }}
          >
            Failed to load schedules
          </div>
          <div style={{ color: theme.textMuted, fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
          <NeonButton variant="primary" onClick={() => fetchSchedules()}>
            Retry
          </NeonButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>

      <div
        style={{
          ...pageStyle,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* ── Status summary cards ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px" }}>
          {statusCards.map((c) => {
            const isActive = statusFilter === c.status;
            return (
              <div
                key={c.status}
                onClick={() => {
                  setStatusFilter((s) => (s === c.status ? "all" : c.status));
                  setPage(1);
                }}
                style={{
                  position: "relative",
                  flex: 1,
                  minWidth: 140,
                  background: isActive ? `${c.color}12` : theme.cardBg,
                  border: `1px solid ${isActive ? c.color : theme.border}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                  paddingLeft: 16,
                  cursor: "pointer",
                  transition: "all .2s",
                  boxShadow: isActive ? `0 4px 14px ${c.color}25` : theme.shadowSm,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    background: c.color,
                  }}
                 />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: theme.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      {c.icon} {c.label}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: c.color,
                      }}
                    >
                      {loading ? (
                        <span style={{ fontSize: 16, opacity: 0.4 }}>—</span>
                      ) : (
                        c.count
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: theme.textMuted,
                        marginTop: 4,
                      }}
                    >
                      {loading
                        ? "Loading…"
                        : `ksh ${Math.round(c.total / 1000)}K outstanding`}
                    </div>
                  </div>
                  {isActive ? (
                    <div
                      style={{
                        fontSize: 7,
                        fontWeight: 600,
                        color: c.color,
                        border: `1px solid ${c.color}50`,
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      Active 
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Controls ── */}
        <GlassPanel style={{ padding: "10px 18px" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
  <span
    className="material-symbols-outlined"
    style={{
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 16,
      color: "#94a3b8",
      pointerEvents: "none",
    }}
  >
    search
  </span>

  <input
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setPage(1);
    }}
    placeholder="Search tenant, unit or phone…"
    style={{
      width: "100%",
      background: "#ffffff",
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: "13px 14px 10px 34px", 
      color: theme.text,
      fontSize: 13,
      outline: "none",
    }}
  />
</div>
            <CustomDropdown
              options={propertyOptions}
              value={propertyFilter}
              onChange={(val) => setPropertyFilter(val)}
              labelKey="label"
              valueKey="value"
              minWidth="200px"
            />
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 8,
              }}
            >
              {selected.size > 0 ? (
                <>
                  <CustomDropdown
                    options={bulkOptions}
                    value={bulkAction}
                    onChange={(val) => setBulkAction(val)}
                    labelKey="label"
                    valueKey="value"
                    minWidth="200px"
                  />
                  <NeonButton
                    variant="primary"
                    onClick={handleBulk}
                    disabled={!bulkAction}
                  >
                    Apply
                  </NeonButton>
                </>
              ) : null}
            </div>
          </div>
          {bulkDone ? (
            <div style={{ marginTop: 10 }}>
              <LightAlert kind="success">
                ✓ Bulk action "{bulkAction}" applied to {selected.size} tenants.
              </LightAlert>
            </div>
          ) : null}
        </GlassPanel>

        {/* ── Table ── */}
        <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th
                    style={{
                      padding: "10px 12px 10px 16px",
                      textAlign: "left",
                    }}
                  >
                    <Checkbox
                      checked={
                        selected.size === pageData.length && pageData.length > 0
                      }
                      onChange={toggleAll}
                    />
                  </th>
                  {[
                    { label: "Tenant", col: "tenantName" as const },
                    { label: "Apartment", col: "propertyTitle" as const },
                    { label: "Amount", col: "amount" as const },
                    { label: "Late Fee", col: null },
                    { label: "Days Overdue", col: "daysOverdue" as const },
                    { label: "Status", col: null },
                  ].map((h) => (
                    <th
                      key={h.label}
                      onClick={
                        h.col ? () => handleSort(h.col!) : undefined
                      }
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 9,
                        fontWeight: 700,
                        color: theme.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        whiteSpace: "nowrap",
                        cursor: h.col ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {h.label}
                      {h.col ? <SortIcon col={h.col} /> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} cols={9} />
                  ))
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>🔍</div>
                      <div style={{ color: theme.textMuted, fontSize: 14 }}>
                        No schedules match your filters
                      </div>
                      <div style={{ color: theme.textSubtle, fontSize: 12, marginTop: 4 }}>
                        Try adjusting the search or status filter
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageData.map((s) => {
                    const isSelected = selected.has(s.id);
                    const allocated = s.allocatedAmount ?? 0;
                    const pct =
                      s.amount > 0
                        ? Math.round((allocated / s.amount) * 100)
                        : 0;
                    const barColor =
                      pct === 100
                        ? "#059669"
                        : pct > 0
                        ? "#1d4ed8"
                        : theme.border;
                    const overdueDays = daysOverdue(s);
                    const rState = receipt.state[s.id] ?? "idle";
                    const vState = verify.state[s.id] ?? "idle";

                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: `1px solid ${theme.borderSoft}`,
                          background: isSelected
                            ? "rgba(99,102,241,0.06)"
                            : "transparent",
                          transition: "background .1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = theme.rowHoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "11px 12px 11px 16px" }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelect(s.id)}
                          />
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
                            {tenantName(s)}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, color: theme.textMuted }}>
                            {propTitle(s)}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            color: theme.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmt(s.amount)}
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontSize: 12,
                            color: s.lateFeeAmount ? "#b91c1c" : theme.textSubtle,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.lateFeeAmount ? fmt(s.lateFeeAmount) : "—"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {overdueDays > 0 ? (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  overdueDays > 30
                                    ? "#b91c1c"
                                    : overdueDays > 14
                                    ? "#b45309"
                                    : "#1d4ed8",
                              }}
                            >
                              {overdueDays}d
                            </span>
                          ) : (
                            <span style={{ color: theme.textSubtle, fontSize: 12 }}>
                              —
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <StatusBadge status={s.status as any} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalSchedules > 0 && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "12px 16px",
      borderTop: `1px solid ${theme.borderSoft}`,
      background: theme.cardBg,
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    {/* LEFT */}
    <div style={{ flex: 1, minWidth: 120 }}>
      <span
        style={{
          color: theme.textMuted,
          fontSize: 12,
        }}
      >
        Showing{" "}
        <span
          style={{
            color: theme.accentText,
            fontWeight: 600,
          }}
        >
          {pageStart}
        </span>
        –
        <span
          style={{
            color: theme.accentText,
            fontWeight: 600,
          }}
        >
          {pageEnd}
        </span>{" "}
        of{" "}
        <span
          style={{
            color: theme.accentText,
            fontWeight: 600,
          }}
        >
          {totalSchedules}
        </span>
      </span>
    </div>

    {/* MIDDLE */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          color: theme.textMuted,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        Items Per Page:
      </span>

      <PaginationCustomDropdown
        options={pageSizeOptions.map((size) => ({
          label: String(size),
          value: size,
        }))}
        value={pageSize}
        onChange={(value) => {
          setPageSize(Number(value));
          setPage(1);
        }}
        labelKey="label"
        valueKey="value"
        minWidth="90px"
      />
    </div>

    {/* RIGHT */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          background: theme.cardBg,
          color: theme.accentText,
          cursor: page === 1 ? "not-allowed" : "pointer",
          opacity: page === 1 ? 0.4 : 1,
          fontWeight: 600,
        }}
      >
        ‹
      </button>

      <div
        style={{
          padding: "2px 5px",
          borderRadius: 8,
          border: `1px solid ${theme.accentText}`,
          background: "rgba(99,102,241,0.08)",
          color: theme.accentText,
          fontWeight: 600,
          minWidth: 32,
          textAlign: "center",
        }}
      >
        {page}
      </div>

      <button
        onClick={() =>
          setPage((p) => Math.min(totalPages, p + 1))
        }
        disabled={page >= totalPages}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          background: theme.cardBg,
          color: theme.accentText,
          cursor:
            page >= totalPages ? "not-allowed" : "pointer",
          opacity: page >= totalPages ? 0.4 : 1,
          fontWeight: 600,
        }}
      >
        ›
      </button>
    </div>
  </div>
)}
        </GlassPanel>
      </div>
    </>
  );
}
