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
    { step: "Payment received", detail: "M-Pesa callback / Stripe webhook / manual verify" },
    { step: "Idempotency check", detail: "ensureNotProcessed(referenceId)" },
    { step: "FIFO allocation", detail: "allocatePayment() — oldest schedule first" },
    { step: "Partial / Overpayment", detail: "Remainder → tenant.creditBalance" },
    { step: "Receipt emailed", detail: "sendReceipt(paymentId) via SMTP" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Loading / error states ── */}
      {(loadingLeases || loading) && (
        <div style={{ width: "100%", color: "rgba(255,255,255,0.4)", padding: "24px 0", textAlign: "center", fontSize: 13 }}>
          Loading automation data…
        </div>
      )}
      {error && !loading && (
        <div style={{ width: "100%", color: "#ef4444", padding: "12px 0", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          ⚠️ {error}
          <NeonButton variant="ghost" onClick={fetchData} style={{ fontSize: 11, padding: "3px 8px" }}>
            Retry
          </NeonButton>
        </div>
      )}

      {/* ── Left column ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          {/* Cron Jobs — Stripe webhook excluded; it runs in the background automatically */}
        <GlassPanel>
          <SectionTag>⚙️ Cron Jobs</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {CRON_DEFS.map((c) => {
              const meta = cronStats[c.key] || {
                lastRun: "—",
                success: 0,
                failed: 0,
              };
              return (
                <div
                  key={c.key}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.35)",
                          fontFamily: "monospace",
                          marginTop: 2,
                        }}
                      >
                        {c.fn}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                        {c.schedule} · Last: {meta.lastRun}
                      </div>
                    </div>
                    {/* Toggle — only disables manual triggers, server-side cron is unaffected */}
                    <div
                      onClick={() =>
                        setCronStates((s) => ({ ...s, [c.key]: !s[c.key] }))
                      }
                      style={{
                        width: 36,
                        height: 20,
                        borderRadius: 10,
                        background: cronStates[c.key]
                          ? "rgba(0,255,135,0.3)"
                          : "rgba(255,255,255,0.1)",
                        border: `1px solid ${
                          cronStates[c.key]
                            ? "rgba(0,255,135,0.5)"
                            : "rgba(255,255,255,0.2)"
                        }`,
                        cursor: "pointer",
                        position: "relative",
                        transition: "all .2s",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: cronStates[c.key]
                            ? "#00ff87"
                            : "rgba(255,255,255,0.4)",
                          top: 2,
                          left: cronStates[c.key] ? 18 : 2,
                          transition: "left .2s",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <NeonButton
                      variant="ghost"
                      onClick={() => triggerRun(c.key, c.endpoint)}
                      disabled={runLoading[c.key]}
                      style={{ fontSize: 10, padding: "4px 8px" }}
                    >
                      {runLoading[c.key] ? "⏳ Running…" : "▶ Run Now"}
                    </NeonButton>
                    {runLog[c.key] && (
                      <span
                        style={{
                          fontSize: 10,
                          color: runLog[c.key].startsWith("Failed") ? "#ef4444" : "#00ff87",
                        }}
                      >
                        {runLog[c.key].startsWith("Failed") ? "✗" : "✓"} {runLog[c.key]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtle note explaining Stripe webhook is always-on */}
          <div
            style={{
              marginTop: 12,
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00ff87",
                boxShadow: "0 0 6px #00ff87",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            Stripe webhook (payment_intent.succeeded) is always-on and managed by the server.
          </div>
        </GlassPanel>
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          {/* Comms — derived from live API data */}
        <GlassPanel>
          <SectionTag>📬 Comms (Live)</SectionTag>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {(
              [
                ["Email reminders", `${comms.emailReminders} queued`, "#a78bfa"],
                ["Overdue notices", `${comms.overdueNotices} sent`, "#ef4444"],
                ["Receipts issued", `${comms.receipts} sent`, "#00ff87"],
                ["SMS (M-Pesa)", `${comms.smsAuto} auto`, "#60a5fa"],
                ["Failed sends", `${comms.failedSends}`, "rgba(255,255,255,0.3)"],
              ] as [string, string, string][]
            ).map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span style={{ fontWeight: 600, color }}>{val}</span>
              </div>
            ))}
          </div>
          <NeonButton
            variant="ghost"
            style={{ marginTop: 12, fontSize: 12 }}
            onClick={handleSendReminders}
          >
            Send Reminders Now →
          </NeonButton>
          {runLog.reminders && (
            <div style={{ marginTop: 6, fontSize: 10, color: "#00ff87" }}>
              ✓ {runLog.reminders}
            </div>
          )}
        </GlassPanel>
        </div>
      </div>

      {/* ── Right column ── */}
      <div style={{ width: "100%" }}>
        {/* Reconciliation Flow */}
        <GlassPanel>
          <SectionTag>🔄 Reconciliation Flow</SectionTag>
          <div style={{ position: "relative", marginTop: 12 }}>
            <div
              style={{
                position: "absolute",
                left: 7,
                top: 14,
                bottom: 14,
                width: 1,
                background: "rgba(99,102,241,0.3)",
              }}
            />
            {flow.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0" }}>
                <div
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: "50%",
                    background: i === flow.length - 1 ? "#00ff87" : "#6366f1",
                    boxShadow: `0 0 8px ${i === flow.length - 1 ? "#00ff87" : "#6366f1"}80`,
                    flexShrink: 0,
                    marginTop: 2,
                    zIndex: 1,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{f.step}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "monospace",
                      marginTop: 2,
                    }}
                  >
                    {f.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}