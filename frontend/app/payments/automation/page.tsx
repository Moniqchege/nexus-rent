"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassPanel, SectionTag, NeonButton } from "../_lib/components";
import api from "@/app/lib/api";

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Lease {
  id: number;
  propertyId: number;
  rentAmount: number;
  billingCycle: string;
  status: string;
  lateFeePercent: number;
  graceDays: number;
  creditBalance: number;
  property: { id: number; title: string; location: string };
  tenant: Tenant;
}

interface RentSchedule {
  id: number;
  dueDate: string;
  amount: number;
  lateFeeAmount?: number;
  status: "scheduled" | "overdue" | "partial" | "paid";
  period: string;
  tenant: { id: number; name: string; email: string; phone: string };
  property: { id: number; title: string; location: string };
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  referenceId: string;
  paidAt?: string;
  createdAt: string;
}

interface LedgerEntry {
  type: "charge" | "payment";
  date: string;
  amount: number;
}

interface CommsStats {
  emailReminders: number;
  overdueNotices: number;
  receipts: number;
  smsAuto: number;
  failedSends: number;
}

interface CronLog {
  id: number;
  type: string;
  status: "success" | "failed";
  affected?: number;
  error?: string;
  duration?: number;
  createdAt: string;
}

const CRON_DEFS = [
  {
    key: "lateFees",
    name: "Apply Late Fees",
    fn: "applyLateFees()",
    schedule: "Daily 09:00",
    endpoint: "/api/cron/late-fees",
  },
  {
    key: "schedules",
    name: "Generate Schedules",
    fn: "generateMonthlySchedules()",
    schedule: "1st of month",
    endpoint: "/api/payments/schedules",
  },
  {
    key: "reminders",
    name: "Due Reminders",
    fn: "sendDueReminders()",
    schedule: "3-day advance",
    endpoint: "/api/cron/reminders",
  },
] as const;

function deriveCommsStats(
  schedules: RentSchedule[],
  payments: Payment[],
): CommsStats {
  const paid = payments.filter((p) => p.status === "paid");
  const overdue = schedules.filter((s) => s.status === "overdue");
  const mpesa = paid.filter((p) => p.method === "mpesa");

  return {
    emailReminders: schedules.filter((s) => s.status === "scheduled").length,
    overdueNotices: overdue.length,
    receipts: paid.length,
    smsAuto: mpesa.length,
    failedSends: 0,
  };
}


export default function AutomationPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(true);
  const [cronStates, setCronStates] = useState<Record<string, boolean>>({
    lateFees: true,
    schedules: true,
    reminders: true,
  });
  const [runLog, setRunLog] = useState<Record<string, string>>({});
  const [runLoading, setRunLoading] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);

  useEffect(() => {
    setLoadingLeases(true);
    api
      .get("/api/leases")
      .then((res) => {
        const raw = Array.isArray(res.data?.leases) ? res.data.leases : [];
        const list: Lease[] = raw;
         setLeases(list);
        setLeases(list);
        // if (list.length > 0) setSelectedLease(list[0]);
      })
      .catch(() => setError("Failed to load leases"))
      .finally(() => setLoadingLeases(false));
  }, []);

  useEffect(() => {
  const es = new EventSource("/api/cron/sse");

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setCronLogs(data);
  };

  return () => es.close();
}, []);

  const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [schedulesRes, paymentsRes] = await Promise.all([
      api.get(`/api/payments/schedules`),
      api.get(`/api/payments`)
    ]);

    setSchedules(schedulesRes.data.schedules ?? []);
    setPayments(paymentsRes.data.payments ?? []);
  } catch (e: any) {
    setError(e?.message ?? "Failed to load automation data");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

const handleSendReminders = async () => {
  try {
    const res = await api.post("/api/cron/reminders/manual");
    const { affected } = res.data;
    setRunLog((l) => ({
      ...l,
      reminders: affected > 0
        ? `${affected} reminder${affected !== 1 ? "s" : ""} sent (email + WhatsApp) at ${new Date().toLocaleTimeString()}`
        : `No new reminders to send`,
    }));
  } catch (e: any) {
    setRunLog((l) => ({
      ...l,
      reminders: `Failed: ${e?.message ?? "error"}`,
    }));
  }
};

  const triggerRun = async (key: string, endpoint: string) => {
    setRunLoading((l) => ({ ...l, [key]: true }));
    try {
      await api.post(endpoint);
      setRunLog((l) => ({ ...l, [key]: `Manual run at ${new Date().toLocaleTimeString()}` }));
      await fetchData();
    } catch (e: any) {
      setRunLog((l) => ({ ...l, [key]: `Failed: ${e?.message ?? "error"}` }));
    } finally {
      setRunLoading((l) => ({ ...l, [key]: false }));
    }
  };

  const flow = [
    { step: "Step 1: Received", detail: "M-Pesa / Stripe / manual Entry" },
    { step: "Step 2: Check", detail: "Idempotency & Processing Guard" },
    { step: "Step 3: FIFO", detail: "Allocate to Oldest Invoices First" },
    { step: "Step 4: Remainder", detail: "Allocate Overpayment to Credit" },
    { step: "Step 5: Receipt", detail: "Email Receipt to Tenant via SMTP" },
  ];

  const comms = deriveCommsStats(schedules, payments);
  const lastPaidAt = payments
  .filter(p => p.status === "paid")
  .sort((a,b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime())[0]
  ?.paidAt;
 const cronStats = useMemo(() => {
  const map: any = {};

  cronLogs.forEach((log) => {
    if (!map[log.type]) {
      map[log.type] = {
        lastRun: log.createdAt,
        success: 0,
        failed: 0,
      };
    }

    if (log.status === "success") map[log.type].success++;
    if (log.status === "failed") map[log.type].failed++;
  });

  return map;
}, [cronLogs]);

return (
  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18, background: "#f8f9ff" }}>

    {/* Loading / error */}
    {(loadingLeases || loading) && (
      <div style={{ textAlign: "center", fontSize: 13, color: "#7b7487" }}>
        Loading automation system...
      </div>
    )}

    {error && (
      <div style={{ color: "#ba1a1a", fontSize: 13 }}>
        ⚠ {error}
      </div>
    )}

    {/* ───────── TOP GRID ───────── */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 16,
        alignItems: "stretch",
      }}
    >

      {/* ───────── SCHEDULED AUTOMATION (STITCH STYLE LIST) ───────── */}
<div
  style={{
    borderRadius: 16,
    padding: 16,
    background: "rgba(255,255,255,0.85)",
    border: "1px solid #e2e8f0",
    backdropFilter: "blur(12px)",
  }}
>
  {/* HEADER */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* ICON (cron/automation) */}
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: "#4800a0" }}
      >
        schedule
      </span>

      <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1a24" }}>
        Scheduled Automation (Crons)
      </div>
    </div>

    {/* REFRESH BUTTON */}
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#4800a0",
        padding: "6px 10px",
        border: "1px solid #4800a0",
        borderRadius: 8,
        background: "transparent",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 16 }}
      >
        refresh
      </span>
      Refresh Status
    </button>
  </div>

  {/* LIST (STACKED ROWS) */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      borderTop: "1px solid #e8dfee",
    }}
  >
    {CRON_DEFS.map((c, idx) => {
      const meta = cronStats[c.key] || {};

      return (
        <div
          key={c.key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 4px",
            borderBottom:
              idx === CRON_DEFS.length - 1
                ? "none"
                : "1px solid #e8dfee",
            gap: 12,
          }}
        >
          {/* LEFT: NAME + DETAILS */}
          <div style={{ flex: 2 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1d1a24",
              }}
            >
              {c.name}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#7b7487",
                fontFamily: "monospace",
                marginTop: 2,
              }}
            >
              {c.fn} • {c.schedule}
            </div>
          </div>

          {/* LAST RUN */}
          <div
            style={{
              flex: 1,
              fontSize: 11,
              color: "#4a4455",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {meta.lastRun
              ? `Last: ${new Date(meta.lastRun).toLocaleTimeString()}`
              : "Never run"}
          </div>

          {/* TOGGLE */}
          <div
            onClick={() =>
              setCronStates((s) => ({
                ...s,
                [c.key]: !s[c.key],
              }))
            }
            style={{
              width: 42,
              height: 22,
              borderRadius: 999,
              background: cronStates[c.key]
                ? "#8e49e3"
                : "#e8dfee",
              position: "relative",
              cursor: "pointer",
              border: "1px solid #ccc3d8",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: cronStates[c.key] ? 22 : 2,
                width: 18,
                height: 18,
                borderRadius: 999,
                background: cronStates[c.key]
                  ? "#ffffff"
                  : "#7b7487",
                transition: "left .2s",
              }}
            />
          </div>

          {/* RUN BUTTON */}
          <button
            onClick={() => triggerRun(c.key, c.endpoint)}
            style={{
              fontSize: 11,
              padding: "6px 10px",
              borderRadius: 9,
              background: "#4800a0",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Run Now
          </button>

          {/* STATUS */}
          {runLog[c.key] && (
            <div
              style={{
                fontSize: 10,
                color: "#4ae176",
                marginLeft: 8,
                maxWidth: 140,
              }}
            >
              {runLog[c.key]}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

      {/* ───────── RIGHT: LIVE COMMS ───────── */}
      <div
        style={{
          borderRadius: 16,
          padding: 16,
          background: "#ffffff",
          border: "1px solid #e8dfee",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  
  {/* LEFT: ICON + TITLE */}
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: 18,
        color: "#4800a0",
      }}
    >
      hub
    </span>

    <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1a24" }}>
      Live Comms
    </div>
  </div>

</div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["Email Reminders", comms.emailReminders],
            ["Overdue Notices", comms.overdueNotices],
            ["Receipts", comms.receipts],
            ["SMS / M-Pesa", comms.smsAuto],
            ["Failed", comms.failedSends],
          ].map(([label, val]) => (
            <div
              key={label as string}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                paddingBottom: 8,
                borderBottom: "1px solid #f3ebfa",
              }}
            >
              <span style={{ color: "#7b7487" }}>{label}</span>
              <span style={{ fontWeight: 700, color: "#1d1a24" }}>{val}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleSendReminders}
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#4800a0",
            color: "#ffffff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Send Reminders
        </button>
      </div>
    </div>

    {/* ───────── RECONCILIATION FLOW (STITCH-STYLE FIXED) ───────── */}
    <div
      style={{
        marginTop: 18,
        padding: 18,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e8dfee",
        boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1d1a24" }}>
          Automated Reconciliation Flow
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* connector */}
        {/* connectors */}
<div
  style={{
    position: "absolute",
    top: 22,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 0,
    display: "flex",
    justifyContent: "space-between",
    padding: "0 60px",
  }}
>
  {flow.slice(0, flow.length - 1).map((_, i) => (
    <div
      key={i}
      style={{
        flex: 1,
        margin: "0 8px", // gap so line doesn't touch circles
        height: 2,
        background: "#e8dfee",
      }}
    />
  ))}
</div>

        {flow.map((f, i) => {
          const isLast = i === flow.length - 1;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 140,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: isLast ? "#4ae176" : "#d2bbff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: "#1d1a24" }}
                >
                  {["payments", "fact_check", "account_tree", "account_balance_wallet", "mail"][i]}
                </span>
              </div>

              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: "#1d1a24" }}>
                {f.step}
              </div>

              <div style={{ fontSize: 10, color: "#7b7487", textAlign: "center", marginTop: 4 }}>
                {f.detail}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  color: "#7b7487",
                  background: "#f3ebfa",
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid #e8dfee",
                }}
              >
                {["webhook Listener", "ensureNotProcessed", "allocatePayment", "pushToCredit", "sendReceipt"][i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
}