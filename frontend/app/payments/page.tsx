"use client";

import { useState, useMemo, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PayMethod = "mpesa" | "airtel" | "card" | "bank";
type PayStatus = "paid" | "pending" | "overdue" | "partial";
type SchedStatus = "scheduled" | "overdue" | "paid" | "partial";
type Tab = "overview" | "initiate" | "schedules" | "tenant" | "automation" | "reports";

interface Payment {
  id: number;
  tenantName: string;
  property: string;
  unit: string;
  amount: number;
  method: PayMethod;
  status: PayStatus;
  referenceId: string;
  paidAt?: string;
  createdAt: string;
}

interface RentSchedule {
  id: number;
  tenantName: string;
  property: string;
  unit: string;
  phone: string;
  dueDate: string;
  amount: number;
  lateFeeAmount?: number;
  allocatedAmount: number;
  status: SchedStatus;
  period: string;
  daysOverdue?: number;
  lastPaymentDate?: string;
  paymentMethod?: PayMethod;
}

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  property: string;
}

interface Tenant {
  id: number;
  name: string;
  unit: string;
  property: string;
  phone: string;
  email: string;
  since: string;
  rent: number;
  outstanding: number;
  creditBalance: number;
  nextDue: string;
  lateFees: number;
  avgDelayDays: number;
  preferredMethod: PayMethod;
  ytdPaid: number;
  paymentHistory: { date: string; desc: string; charge: number; payment: number; balance: number }[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const PROPERTIES = ["Maple Court", "Sunset Villas", "Central Heights", "Green Park"];

const generateSchedules = (): RentSchedule[] => {
  const names = [
    "James Mwangi","Aisha Ochieng","Peter Kamau","Grace Njeri","David Otieno","Mary Wanjiku",
    "Samuel Kipchoge","Fatuma Hassan","John Mutua","Esther Wambui","Brian Omondi","Linda Achieng",
    "Michael Njoroge","Joyce Wairimu","Kevin Gitau","Priscilla Muthoni","George Oduya","Agnes Wangari",
    "Francis Kimani","Beatrice Chebet","Charles Onyango","Diana Karimi","Emmanuel Njenga","Florence Ndungu",
    "Gilbert Ochieng","Hannah Mwangi","Isaac Kamau","Janet Wanjiku","Kennedy Otieno","Lydia Njeri",
    "Martin Waweru","Nancy Auma","Oscar Mutua","Pamela Wanjiru","Quinton Omondi","Rose Maina",
    "Stephen Kimura","Teresa Odhiambo","Victor Kibet","Winnie Atieno","Alex Mugo","Brenda Cherop",
    "Collins Owino","Doris Mwende","Eric Mwangi","Faith Anyango","Gabriel Kamau","Helen Wambua",
    "Ivan Obuya","Julia Kinyanjui","Kenneth Ongeri","Lilian Wachira","Moses Odhiambo","Nadia Koech",
    "Oliver Ndung'u","Pauline Akinyi","Raphael Ndirangu","Sarah Wanjala","Timothy Mwaniki","Ursula Maina",
    "Wallace Otieno","Xenia Mukami","Yusuf Omondi","Zipporah Kamau","Andrew Muchiri","Bethany Onyango",
    "Caleb Muriuki","Deborah Wangeci","Elijah Owuor","Felicity Njagi","Godfrey Wekesa","Harriet Achieng",
    "Ibrahim Mwangi","Jacinta Nduta","Kelvin Rono","Mercy Wamuyu","Nicholas Onyango","Olivia Njuguna",
    "Patrick Kimani","Queen Auma","Robert Wachira","Stella Mugo","Thomas Ochieng","Uwem Njoroge",
    "Veronica Kamau","William Otieno","Xavier Mwangi","Yvonne Ndung'u","Zachary Odhiambo","Amina Wanjiru",
    "Benjamin Mwenda","Catherine Akinyi","Daniel Mugo","Edith Wangari","Ferdinand Otieno","Gladys Mwangi",
    "Henry Kamau","Irene Achieng","Joseph Waweru","Kathleen Onyango"
  ];

  const statuses: SchedStatus[] = ["paid","paid","paid","paid","paid","partial","scheduled","scheduled","overdue","overdue"];
  const methods: PayMethod[] = ["mpesa","mpesa","mpesa","card","bank","airtel"];
  const units = ["A1","A2","A3","A4","B1","B2","B3","B4","C1","C2","C3","C4","D1","D2","D3","D4","E1","E2","E3","E4","F1","F2","F3","F4","G1","G2"];
  const phones = ["0712","0722","0733","0711","0721"];

  return names.map((name, i) => {
    const status = statuses[i % statuses.length];
    const amount = [15000, 18000, 22000, 28500, 32000, 45000, 55000][i % 7];
    const prop = PROPERTIES[i % PROPERTIES.length];
    const unit = units[i % units.length];
    const daysOverdue = status === "overdue" ? Math.floor(Math.random() * 45) + 8 : undefined;
    const allocated = status === "paid" ? amount : status === "partial" ? Math.floor(amount * 0.4 + Math.random() * amount * 0.4) : 0;
    return {
      id: i + 1,
      tenantName: name,
      property: prop,
      unit,
      phone: `${phones[i % phones.length]}${String(100000 + i * 7919).slice(0, 6)}`,
      dueDate: "2026-04-01",
      amount,
      lateFeeAmount: status === "overdue" && daysOverdue && daysOverdue > 7 ? Math.round(amount * 0.05) : undefined,
      allocatedAmount: allocated,
      status,
      period: "2026-04",
      daysOverdue,
      lastPaymentDate: status !== "scheduled" ? `2026-0${3 - (i % 2)}-0${(i % 28) + 1}`.replace(/-0(\d\d)/, "-$1") : undefined,
      paymentMethod: methods[i % methods.length],
    };
  });
};

const MOCK_SCHEDULES: RentSchedule[] = generateSchedules();

const MOCK_PAYMENTS: Payment[] = [
  { id: 1, tenantName: "James Mwangi", property: "Maple Court", unit: "A1", amount: 28500, method: "mpesa", status: "paid", referenceId: "QK3HT72FNZ", paidAt: new Date(Date.now() - 2 * 60000).toISOString(), createdAt: new Date().toISOString() },
  { id: 2, tenantName: "Aisha Ochieng", property: "Sunset Villas", unit: "B2", amount: 45000, method: "card", status: "paid", referenceId: "pi_3QK7aF2eZvK", paidAt: new Date(Date.now() - 47 * 60000).toISOString(), createdAt: new Date().toISOString() },
  { id: 3, tenantName: "Peter Kamau", property: "Central Heights", unit: "C3", amount: 32000, method: "bank", status: "pending", referenceId: "NEXUS-BANK-3-483920", createdAt: new Date().toISOString() },
  { id: 4, tenantName: "Grace Njeri", property: "Maple Court", unit: "A2", amount: 28500, method: "mpesa", status: "overdue", referenceId: "", createdAt: new Date().toISOString() },
  { id: 5, tenantName: "David Otieno", property: "Green Park", unit: "D1", amount: 18000, method: "mpesa", status: "paid", referenceId: "QK3HT72AAA", paidAt: new Date(Date.now() - 3 * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 6, tenantName: "Mary Wanjiku", property: "Sunset Villas", unit: "B3", amount: 15000, method: "card", status: "partial", referenceId: "pi_partial", createdAt: new Date().toISOString() },
  { id: 7, tenantName: "Samuel Kipchoge", property: "Central Heights", unit: "C1", amount: 22000, method: "mpesa", status: "paid", referenceId: "QK3HT72BBB", paidAt: new Date(Date.now() - 6 * 3600000).toISOString(), createdAt: new Date().toISOString() },
  { id: 8, tenantName: "Fatuma Hassan", property: "Green Park", unit: "D2", amount: 18000, method: "airtel", status: "paid", referenceId: "AIR-88821", paidAt: new Date(Date.now() - 8 * 3600000).toISOString(), createdAt: new Date().toISOString() },
];

const MOCK_EXPENSES: Expense[] = [
  { id: 1, category: "Maintenance", description: "Plumbing repair Apt A1", amount: 8500, date: "2026-04-05", property: "Maple Court" },
  { id: 2, category: "Maintenance", description: "Gate motor servicing", amount: 4200, date: "2026-04-12", property: "Central Heights" },
  { id: 3, category: "Insurance", description: "Property insurance premium", amount: 12000, date: "2026-04-01", property: "All Properties" },
  { id: 4, category: "Utilities", description: "Common area electricity", amount: 6800, date: "2026-04-15", property: "Sunset Villas" },
  { id: 5, category: "Admin", description: "Agent commission", amount: 11500, date: "2026-04-20", property: "Green Park" },
  { id: 6, category: "Maintenance", description: "Roof leak repair", amount: 22000, date: "2026-04-08", property: "Maple Court" },
  { id: 7, category: "Utilities", description: "Borehole pump servicing", amount: 9500, date: "2026-04-18", property: "Central Heights" },
  { id: 8, category: "Admin", description: "Legal fees — lease renewal", amount: 8000, date: "2026-04-22", property: "Sunset Villas" },
];

const MOCK_TENANTS: Tenant[] = [
  {
    id: 1, name: "James Mwangi", unit: "A1", property: "Maple Court",
    phone: "0712345678", email: "james.mwangi@email.com", since: "Jan 2024",
    rent: 28500, outstanding: 0, creditBalance: 1500, nextDue: "May 1 · KES 28,500",
    lateFees: 0, avgDelayDays: 1.2, preferredMethod: "mpesa", ytdPaid: 114000,
    paymentHistory: [
      { date: "Apr 3", desc: "M-Pesa payment", charge: 0, payment: 30000, balance: -1500 },
      { date: "Apr 1", desc: "Rent — Apr 2026", charge: 28500, payment: 0, balance: 28500 },
      { date: "Mar 2", desc: "M-Pesa payment", charge: 0, payment: 28500, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026", charge: 28500, payment: 0, balance: 28500 },
      { date: "Feb 2", desc: "Card payment", charge: 0, payment: 28500, balance: 0 },
      { date: "Feb 1", desc: "Rent — Feb 2026", charge: 28500, payment: 0, balance: 28500 },
    ],
  },
  {
    id: 2, name: "Aisha Ochieng", unit: "B2", property: "Sunset Villas",
    phone: "0722456789", email: "aisha.ochieng@email.com", since: "Mar 2023",
    rent: 45000, outstanding: 0, creditBalance: 0, nextDue: "May 1 · KES 45,000",
    lateFees: 0, avgDelayDays: 0.8, preferredMethod: "card", ytdPaid: 180000,
    paymentHistory: [
      { date: "Apr 2", desc: "Card payment", charge: 0, payment: 45000, balance: 0 },
      { date: "Apr 1", desc: "Rent — Apr 2026", charge: 45000, payment: 0, balance: 45000 },
      { date: "Mar 1", desc: "Card payment", charge: 0, payment: 45000, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026", charge: 45000, payment: 0, balance: 45000 },
    ],
  },
  {
    id: 3, name: "Grace Njeri", unit: "A2", property: "Maple Court",
    phone: "0733567890", email: "grace.njeri@email.com", since: "Jun 2022",
    rent: 28500, outstanding: 29925, creditBalance: 0, nextDue: "OVERDUE",
    lateFees: 1425, avgDelayDays: 12.4, preferredMethod: "mpesa", ytdPaid: 85500,
    paymentHistory: [
      { date: "Apr 1", desc: "Rent — Apr 2026", charge: 28500, payment: 0, balance: 28500 },
      { date: "Apr 8", desc: "Late fee applied (5%)", charge: 1425, payment: 0, balance: 29925 },
      { date: "Mar 14", desc: "M-Pesa payment", charge: 0, payment: 28500, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026", charge: 28500, payment: 0, balance: 28500 },
    ],
  },
];

const SPARKLINE_DATA = {
  collected: [201, 218, 195, 234, 241, 229, 258, 271, 248, 263, 284, 290],
  rate: [88, 91, 86, 93, 89, 94, 91, 96, 93, 95, 94, 96],
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `KES ${n.toLocaleString()}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const timeAgo = (s: string) => {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const METHOD_LABEL: Record<PayMethod, string> = { mpesa: "M-Pesa", airtel: "Airtel", card: "Card", bank: "Bank Transfer" };
const METHOD_COLOR: Record<PayMethod, string> = { mpesa: "#00ff87", airtel: "#fb923c", card: "#60a5fa", bank: "#c084fc" };
const METHOD_ICON: Record<PayMethod, string> = { mpesa: "📱", airtel: "📲", card: "💳", bank: "🏦" };

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  paid:      { bg: "rgba(0,255,135,0.1)",  color: "#00ff87", border: "rgba(0,255,135,0.3)" },
  pending:   { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  overdue:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", border: "rgba(239,68,68,0.3)" },
  partial:   { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
  scheduled: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  active:    { bg: "rgba(0,255,135,0.1)",  color: "#00ff87", border: "rgba(0,255,135,0.3)" },
  listening: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
};

// ─── Base Components ───────────────────────────────────────────────────────────

function LiveDot() {
  return <span style={{ display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#00ff87",marginRight:6,boxShadow:"0 0 6px #00ff87",animation:"pulse 1.5s infinite" }} />;
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,letterSpacing:".05em",background:s.bg,color:s.color,border:`1px solid ${s.border}` }}>
      {status.toUpperCase()}
    </span>
  );
}

function GlassPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:24,...style }}>
      {children}
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,letterSpacing:".12em",color:"#a78bfa",textTransform:"uppercase",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:6,padding:"4px 10px",marginBottom:10 }}>
      {children}
    </div>
  );
}

function NeonButton({ children, onClick, variant = "ghost", style, disabled }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary"|"ghost"|"danger"|"success"|"warning"; style?: React.CSSProperties; disabled?: boolean;
}) {
  const v = {
    primary: { background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none" },
    ghost:   { background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.1)" },
    danger:  { background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)" },
    success: { background:"rgba(0,255,135,0.1)",color:"#00ff87",border:"1px solid rgba(0,255,135,0.3)" },
    warning: { background:"rgba(251,191,36,0.1)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...v[variant],borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s",whiteSpace:"nowrap",opacity:disabled?0.5:1,...style }}>
      {children}
    </button>
  );
}

function Sparkline({ data, color, width=80, height=28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display:"block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(pts.split(" ").pop()!.split(",")[0])} cy={parseFloat(pts.split(" ").pop()!.split(",")[1])} r={2.5} fill={color} />
    </svg>
  );
}

function MetricCard({ label, value, sub, accent, sparkData, sparkColor }: {
  label: string; value: string; sub?: string; accent?: string; sparkData?: number[]; sparkColor?: string;
}) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px 20px",flex:1,minWidth:140,position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:accent||"linear-gradient(to right,#6366f1,#8b5cf6)" }} />
      <div style={{ fontSize:10,color:"rgba(255,255,255,0.45)",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em" }}>{label}</div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:17,fontWeight:700,color:"#fff" }}>{value}</div>
          {sub && <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4 }}>{sub}</div>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor||"#6366f1"} />}
      </div>
    </div>
  );
}

function CollectionGauge({ pct }: { pct: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct >= 90 ? "#00ff87" : pct >= 70 ? "#fbbf24" : "#ef4444";
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition:"stroke-dasharray .6s ease", filter:`drop-shadow(0 0 6px ${color})` }} />
        <text x={50} y={46} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700}>{pct}%</text>
        <text x={50} y={60} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>collected</text>
      </svg>
      <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:".06em",textTransform:"uppercase" }}>Apr Target: 95%</div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width:16,height:16,border:`1px solid ${checked?"#6366f1":"rgba(255,255,255,0.2)"}`,borderRadius:4,background:checked?"rgba(99,102,241,0.3)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s" }}>
      {checked && <span style={{ color:"#a78bfa",fontSize:10,fontWeight:700 }}>✓</span>}
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ payments }: { payments: Payment[] }) {
  const [activityFilter, setActivityFilter] = useState<"all"|PayStatus>("all");

  const collected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const arrears   = payments.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const pending   = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const rate = Math.round((collected / (collected + arrears + pending)) * 100);

  const methodTotals = payments.filter(p=>p.status==="paid").reduce((acc,p) => {
    acc[p.method] = (acc[p.method]||0) + p.amount; return acc;
  }, {} as Record<string,number>);

  const filteredActivity = payments.filter(p => activityFilter === "all" || p.status === activityFilter);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <div style={{ display:"flex",gap:12,flexWrap:"wrap",alignItems:"stretch" }}>
        <MetricCard label="Collected (Apr)" value={`KES ${(collected/1000).toFixed(0)}K`} sub="+12% vs Mar" accent="linear-gradient(90deg,#00ff87,#0ea5e9)" sparkData={SPARKLINE_DATA.collected} sparkColor="#00ff87" />
        <MetricCard label="Arrears" value={`KES ${(arrears/1000).toFixed(0)}K`} sub={`${payments.filter(p=>p.status==="overdue").length} tenants`} accent="linear-gradient(90deg,#ef4444,#f97316)" sparkData={[12,18,14,22,19,25,21,28,24,31,28,32]} sparkColor="#ef4444" />
        <MetricCard label="Pending" value={`KES ${(pending/1000).toFixed(0)}K`} sub={`${payments.filter(p=>p.status==="pending").length} unconfirmed`} accent="linear-gradient(90deg,#fbbf24,#f97316)" />
        <MetricCard label="Expenses (Apr)" value="KES 83K" sub="−22% vs Mar" accent="linear-gradient(90deg,#f97316,#ef4444)" sparkData={[62,74,88,71,95,82,91,78,86,93,88,83]} sparkColor="#f97316" />
        <MetricCard label="Net P&L" value="KES 201K" sub="After all expenses" accent="linear-gradient(90deg,#00ff87,#6366f1)" sparkData={[140,158,145,171,163,182,175,192,181,198,194,201]} sparkColor="#00ff87" />
      </div>

      <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
        {/* Gauge + Methods */}
        <GlassPanel style={{ flex:"0 0 220px",display:"flex",flexDirection:"column",gap:16 }}>
          <SectionTag>📊 Collection Rate</SectionTag>
          <div style={{ display:"flex",justifyContent:"center" }}>
            <CollectionGauge pct={rate} />
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14 }}>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10 }}>By Method</div>
            {(Object.entries(methodTotals) as [PayMethod,number][]).map(([method,amount]) => {
              const pct = Math.round((amount/collected)*100);
              return (
                <div key={method} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                    <span style={{ color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",gap:5 }}>
                      <span>{METHOD_ICON[method]}</span>{METHOD_LABEL[method]}
                    </span>
                    <span style={{ color:METHOD_COLOR[method],fontWeight:600 }}>{pct}%</span>
                  </div>
                  <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:2 }}>
                    <div style={{ height:"100%",width:`${pct}%`,background:METHOD_COLOR[method],borderRadius:2,boxShadow:`0 0 6px ${METHOD_COLOR[method]}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* Activity Feed */}
        <GlassPanel style={{ flex:1,minWidth:320,padding:0,overflow:"hidden" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <SectionTag>⚡ Recent Activity</SectionTag>
            <div style={{ display:"flex",gap:4 }}>
              {(["all","paid","pending","overdue","partial"] as const).map(f => (
                <button key={f} onClick={() => setActivityFilter(f)} style={{ background:activityFilter===f?"rgba(99,102,241,0.2)":"transparent",border:activityFilter===f?"1px solid rgba(99,102,241,0.5)":"1px solid transparent",color:activityFilter===f?"#a78bfa":"rgba(255,255,255,0.35)",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"capitalize" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight:320,overflowY:"auto" }}>
            {filteredActivity.map(p => (
              <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background .1s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:`${METHOD_COLOR[p.method]}15`,border:`1px solid ${METHOD_COLOR[p.method]}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>
                    {METHOD_ICON[p.method]}
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{p.tenantName}</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>{p.property} · {p.unit} · {METHOD_LABEL[p.method]}{p.paidAt ? ` · ${timeAgo(p.paidAt)}` : ""}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:p.status==="paid"?"#00ff87":p.status==="overdue"?"#ef4444":"#fbbf24" }}>
                    {p.status==="paid"?"+":""}{fmt(p.amount)}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {filteredActivity.length === 0 && (
              <div style={{ padding:"40px 20px",textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:13 }}>No activity matching this filter</div>
            )}
          </div>
        </GlassPanel>

        {/* Property Breakdown */}
        <GlassPanel style={{ flex:"0 0 200px",display:"flex",flexDirection:"column",gap:10 }}>
          <SectionTag>🏢 By Property</SectionTag>
          {PROPERTIES.map((prop, i) => {
            const propPayments = payments.filter(p => p.property === prop);
            const propCollected = propPayments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);
            const propTotal = propPayments.reduce((s,p)=>s+p.amount,0);
            const pct = propTotal > 0 ? Math.round((propCollected/propTotal)*100) : 0;
            const colors = ["#00ff87","#60a5fa","#a78bfa","#fb923c"];
            return (
              <div key={prop} style={{ padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:500 }}>{prop}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:colors[i] }}>{pct}%</span>
                </div>
                <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:2 }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:colors[i],borderRadius:2 }} />
                </div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4 }}>{propPayments.length} payments</div>
              </div>
            );
          })}
        </GlassPanel>
      </div>
    </div>
  );
}

// ─── Tab: Initiate Payment ──────────────────────────────────────────────────────

function InitiateTab() {
  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(MOCK_TENANTS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [amount, setAmount] = useState("28500");
  const [phone, setPhone] = useState("254712345678");
  const [ref, setRef] = useState("APT-A1-MAY26");
  const [stkSent, setStkSent] = useState(false);
  const [bankRef, setBankRef] = useState("");

  const tenantResults = MOCK_TENANTS.filter(t =>
    tenantSearch.length > 0 && (
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.unit.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.property.toLowerCase().includes(tenantSearch.toLowerCase())
    )
  );

  const selectTenant = (t: Tenant) => {
    setSelectedTenant(t);
    setTenantSearch(t.name);
    setShowDropdown(false);
    setAmount(String(t.rent));
    setPhone(`254${t.phone.slice(1)}`);
    setRef(`${t.unit.replace(/\s/g,"")}-MAY26`);
    setStkSent(false);
    setBankRef("");
  };

  const methods: {key:PayMethod;icon:string;name:string;sub:string}[] = [
    { key:"mpesa",  icon:"📱", name:"M-Pesa",       sub:"STK Push / Paybill" },
    { key:"airtel", icon:"📲", name:"Airtel Money",  sub:"STK Push" },
    { key:"card",   icon:"💳", name:"Card / Wallet", sub:"Visa · MC · Apple Pay" },
    { key:"bank",   icon:"🏦", name:"Bank Transfer", sub:"Equity · KCB · Co-op" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <div style={{ padding:"12px 16px",borderRadius:12,fontSize:13,background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",color:"#93c5fd" }}>
        ℹ️ Payments trigger auto-reconciliation. M-Pesa &amp; Card receipts are issued instantly. Bank transfers require manual verification.
      </div>

      <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
        {/* Tenant Selector */}
        <GlassPanel style={{ flex:"0 0 280px" }}>
          <SectionTag>👤 Select Tenant</SectionTag>
          <div style={{ position:"relative",marginTop:4 }}>
            <input
              value={tenantSearch}
              onChange={e=>{setTenantSearch(e.target.value);setShowDropdown(true);}}
              onFocus={()=>setShowDropdown(true)}
              placeholder="Search name, unit or property…"
              style={{ width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box" }}
            />
            {showDropdown && tenantResults.length > 0 && (
              <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,zIndex:50,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                {tenantResults.map(t => (
                  <div key={t.id} onClick={()=>selectTenant(t)} style={{ padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.06)",transition:"background .1s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(99,102,241,0.15)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{t.name}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{t.property} · {t.unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTenant && (
            <div style={{ marginTop:14,padding:"12px 14px",borderRadius:12,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0 }}>
                  {selectedTenant.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>{selectedTenant.name}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{selectedTenant.property} · {selectedTenant.unit}</div>
                </div>
              </div>
              {[
                ["Monthly Rent", fmt(selectedTenant.rent), "#fff"],
                ["Outstanding", fmt(selectedTenant.outstanding), selectedTenant.outstanding > 0 ? "#ef4444" : "#00ff87"],
                ["Credit Balance", fmt(selectedTenant.creditBalance), "#60a5fa"],
                ["Last Payment", selectedTenant.paymentHistory[0]?.date || "—", "rgba(255,255,255,0.5)"],
                ["Avg Delay", `${selectedTenant.avgDelayDays} days`, selectedTenant.avgDelayDays > 5 ? "#f97316" : "#00ff87"],
                ["Preferred", METHOD_LABEL[selectedTenant.preferredMethod], METHOD_COLOR[selectedTenant.preferredMethod]],
              ].map(([k,v,c]) => (
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)" }}>{k}</span>
                  <span style={{ fontWeight:600,color:c as string }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Payment Form */}
        <GlassPanel style={{ flex:1,minWidth:300 }}>
          <SectionTag>💳 Payment Method</SectionTag>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20 }}>
            {methods.map(m => (
              <div key={m.key} onClick={()=>{setMethod(m.key);setStkSent(false);setBankRef("");}} style={{ border:method===m.key?"1px solid #6366f1":"1px solid rgba(255,255,255,0.08)",background:method===m.key?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.02)",borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all .15s",boxShadow:method===m.key?"0 0 20px rgba(99,102,241,0.2)":"none" }}>
                <div style={{ fontSize:22 }}>{m.icon}</div>
                <div style={{ fontSize:12,fontWeight:600,color:method===m.key?"#a78bfa":"#fff",marginTop:5 }}>{m.name}</div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
            {[
              { label:"Amount (KES)", value:amount, onChange:(v:string)=>setAmount(v), type:"number" },
              { label:"Reference", value:ref, onChange:(v:string)=>setRef(v), type:"text" },
              { label:"Description", value:"May 2026 Rent", type:"text" },
              { label:"Period", value:"2026-05", type:"month" },
            ].map((f,i) => (
              <div key={i}>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em" }}>{f.label}</div>
                <input type={f.type} defaultValue={f.value} onChange={e=>f.onChange?.(e.target.value)} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box" }} />
              </div>
            ))}
          </div>

          {method === "mpesa" && (
            <div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em" }}>Phone (2547xxxxxxxx)</div>
                <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"9px 12px",color:"#fff",fontSize:13,outline:"none",width:220 }} />
              </div>
              <NeonButton variant="primary" onClick={()=>setStkSent(true)}>📱 Send STK Push →</NeonButton>
              {stkSent && (
                <div style={{ marginTop:14,padding:"14px 16px",borderRadius:12,background:"rgba(0,255,135,0.06)",border:"1px solid rgba(0,255,135,0.2)" }}>
                  <div style={{ fontWeight:700,color:"#00ff87",marginBottom:4 }}>✓ STK Push Sent</div>
                  <div style={{ fontSize:13,color:"rgba(255,255,255,0.6)" }}>Prompt sent to <strong style={{ color:"#fff" }}>{phone}</strong>. Will auto-reconcile on callback.</div>
                  <div style={{ marginTop:6,fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"monospace" }}>POST /api/payments/mpesa/callback</div>
                </div>
              )}
            </div>
          )}
          {method === "airtel" && (
            <div style={{ padding:"12px 16px",borderRadius:12,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",color:"#fbbf24",fontSize:13 }}>
              ⚠️ Airtel Money integration coming soon. Endpoint scaffolded at <code style={{ fontFamily:"monospace" }}>POST /api/payments/airtel</code>
            </div>
          )}
          {method === "card" && (
            <div>
              <div style={{ padding:"12px 16px",borderRadius:12,marginBottom:12,background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.2)",color:"#93c5fd",fontSize:13 }}>
                A Stripe PaymentIntent will be created with <code>automatic_payment_methods: enabled</code> — supports Visa, Mastercard, Apple Pay, Google Pay.
              </div>
              <NeonButton variant="primary">💳 Create Payment Intent →</NeonButton>
            </div>
          )}
          {method === "bank" && (
            <div>
              <NeonButton variant="primary" onClick={()=>setBankRef(`NEXUS-BANK-${Math.floor(Date.now()/1000).toString().slice(-6)}`)}>🏦 Generate Bank Reference →</NeonButton>
              {bankRef && (
                <div style={{ marginTop:14,padding:"14px 16px",borderRadius:12,background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.2)" }}>
                  <div style={{ fontWeight:700,color:"#60a5fa",marginBottom:10 }}>Bank Transfer Instructions</div>
                  {[["Bank","Equity Bank"],["Account","0123456789"],["Reference",bankRef],["Amount",fmt(parseInt(amount)||0)]].map(([k,v]) => (
                    <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:13 }}>
                      <span style={{ color:"rgba(255,255,255,0.45)" }}>{k}</span>
                      <span style={{ fontFamily:"monospace",color:"#fff" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:8,fontSize:11,color:"rgba(255,255,255,0.3)" }}>Verify via <code style={{ color:"#a78bfa" }}>PUT /api/payments/:id/verify</code></div>
                </div>
              )}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

// ─── Tab: Schedules ────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function SchedulesTab({ schedules }: { schedules: RentSchedule[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SchedStatus|"all">("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name"|"amount"|"daysOverdue"|"property">("amount");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkDone, setBulkDone] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<SchedStatus|null>(null);

  const counts = {
    all: schedules.length,
    paid: schedules.filter(s=>s.status==="paid").length,
    overdue: schedules.filter(s=>s.status==="overdue").length,
    partial: schedules.filter(s=>s.status==="partial").length,
    scheduled: schedules.filter(s=>s.status==="scheduled").length,
  };
  const totals = {
    overdue: schedules.filter(s=>s.status==="overdue").reduce((a,s)=>a+s.amount+(s.lateFeeAmount||0),0),
    partial: schedules.filter(s=>s.status==="partial").reduce((a,s)=>a+s.amount-s.allocatedAmount,0),
    scheduled: schedules.filter(s=>s.status==="scheduled").reduce((a,s)=>a+s.amount,0),
    paid: schedules.filter(s=>s.status==="paid").reduce((a,s)=>a+s.amount,0),
  };

  const filtered = useMemo(() => {
    let r = [...schedules];
    if (statusFilter !== "all") r = r.filter(s=>s.status===statusFilter);
    if (propertyFilter !== "all") r = r.filter(s=>s.property===propertyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s=>s.tenantName.toLowerCase().includes(q)||s.unit.toLowerCase().includes(q)||s.phone.includes(q));
    }
    r.sort((a,b) => {
      let va: number|string = 0, vb: number|string = 0;
      if (sortBy==="name") { va=a.tenantName; vb=b.tenantName; }
      else if (sortBy==="amount") { va=a.amount; vb=b.amount; }
      else if (sortBy==="daysOverdue") { va=a.daysOverdue||0; vb=b.daysOverdue||0; }
      else if (sortBy==="property") { va=a.property; vb=b.property; }
      if (typeof va==="string") return sortDir==="asc"?va.localeCompare(vb as string):(vb as string).localeCompare(va);
      return sortDir==="asc"?(va-vb):(vb-va);
    });
    return r;
  }, [schedules, statusFilter, propertyFilter, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const toggleSelect = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map(s=>s.id)));
  };

  const handleBulk = () => {
    if (!bulkAction || selected.size === 0) return;
    setBulkDone(true);
    setTimeout(()=>{ setBulkDone(false); setSelected(new Set()); setBulkAction(""); }, 2500);
  };

  const handleSort = (col: "name"|"amount"|"daysOverdue"|"property") => {
    if (sortBy === col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ fontSize:9,color:sortBy===col?"#a78bfa":"rgba(255,255,255,0.2)",marginLeft:3 }}>
      {sortBy===col?(sortDir==="asc"?"▲":"▼"):"⇅"}
    </span>
  );

  const statusCards = [
    { status:"overdue" as SchedStatus, label:"Overdue", icon:"🔴", color:"#ef4444", count:counts.overdue, total:totals.overdue },
    { status:"partial" as SchedStatus, label:"Partial", icon:"🟡", color:"#fbbf24", count:counts.partial, total:totals.partial },
    { status:"scheduled" as SchedStatus, label:"Scheduled", icon:"🔵", color:"#a78bfa", count:counts.scheduled, total:totals.scheduled },
    { status:"paid" as SchedStatus, label:"Paid", icon:"🟢", color:"#00ff87", count:counts.paid, total:totals.paid },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      {/* Aggregate Cards — click to drill down */}
      <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
        {statusCards.map(c => (
          <div key={c.status} onClick={()=>{ setStatusFilter(s=>s===c.status?"all":c.status); setPage(1); setExpandedStatus(e=>e===c.status?null:c.status); }} style={{ flex:1,minWidth:140,background:statusFilter===c.status?`rgba(${c.color==="#00ff87"?"0,255,135":c.color==="#ef4444"?"239,68,68":c.color==="#fbbf24"?"251,191,36":"167,139,250"},0.1)`:"rgba(255,255,255,0.03)",border:`1px solid ${statusFilter===c.status?c.color+"40":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:"14px 18px",cursor:"pointer",transition:"all .2s",boxShadow:statusFilter===c.status?`0 0 20px ${c.color}20`:""  }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6 }}>{c.icon} {c.label}</div>
                <div style={{ fontSize:26,fontWeight:700,color:c.color,textShadow:`0 0 20px ${c.color}40` }}>{c.count}</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4 }}>KES {Math.round(c.total/1000)}K outstanding</div>
              </div>
              {statusFilter===c.status && <div style={{ fontSize:10,color:c.color,border:`1px solid ${c.color}40`,borderRadius:4,padding:"2px 6px" }}>Active ✓</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <GlassPanel style={{ padding:"14px 18px" }}>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
          <input
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder="🔍  Search tenant, unit or phone…"
            style={{ flex:1,minWidth:200,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,outline:"none" }}
          />
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value as SchedStatus|"all");setPage(1);}} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"rgba(255,255,255,0.7)",fontSize:12 }}>
            <option value="all" style={{ background:"#1a1a2e" }}>All Statuses ({counts.all})</option>
            <option value="overdue" style={{ background:"#1a1a2e" }}>Overdue ({counts.overdue})</option>
            <option value="partial" style={{ background:"#1a1a2e" }}>Partial ({counts.partial})</option>
            <option value="scheduled" style={{ background:"#1a1a2e" }}>Scheduled ({counts.scheduled})</option>
            <option value="paid" style={{ background:"#1a1a2e" }}>Paid ({counts.paid})</option>
          </select>
          <select value={propertyFilter} onChange={e=>{setPropertyFilter(e.target.value);setPage(1);}} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 10px",color:"rgba(255,255,255,0.7)",fontSize:12 }}>
            <option value="all" style={{ background:"#1a1a2e" }}>All Properties</option>
            {PROPERTIES.map(p=><option key={p} value={p} style={{ background:"#1a1a2e" }}>{p}</option>)}
          </select>
          <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
            {selected.size > 0 && (
              <>
                <select value={bulkAction} onChange={e=>setBulkAction(e.target.value)} style={{ background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:8,padding:"7px 10px",color:"#a78bfa",fontSize:12 }}>
                  <option value="" style={{ background:"#1a1a2e" }}>Bulk Action ({selected.size})</option>
                  <option value="remind" style={{ background:"#1a1a2e" }}>Send Reminders</option>
                  <option value="waivefee" style={{ background:"#1a1a2e" }}>Waive Late Fees</option>
                  <option value="export" style={{ background:"#1a1a2e" }}>Export Selected</option>
                </select>
                <NeonButton variant="primary" onClick={handleBulk} disabled={!bulkAction}>Apply →</NeonButton>
              </>
            )}
            <NeonButton variant="ghost">Generate May ↗</NeonButton>
          </div>
        </div>
        {bulkDone && (
          <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"rgba(0,255,135,0.08)",border:"1px solid rgba(0,255,135,0.2)",color:"#00ff87",fontSize:12 }}>
            ✓ Bulk action "{bulkAction}" applied to {selected.size} tenants.
          </div>
        )}
      </GlassPanel>

      {/* Table */}
      <GlassPanel style={{ padding:0,overflow:"hidden" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>📅 Rent Schedules — April 2026</SectionTag>
          <span style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding:"10px 12px 10px 16px",textAlign:"left" }}>
                  <Checkbox checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleAll} />
                </th>
                {[
                  { label:"Tenant", col:"name" },
                  { label:"Property / Unit", col:"property" },
                  { label:"Amount", col:"amount" },
                  { label:"Late Fee", col:null },
                  { label:"Days Overdue", col:"daysOverdue" },
                  { label:"Progress", col:null },
                  { label:"Status", col:null },
                  { label:"Action", col:null },
                ].map(h => (
                  <th key={h.label} onClick={h.col?()=>handleSort(h.col as any):undefined} style={{ padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",cursor:h.col?"pointer":"default",userSelect:"none" }}>
                    {h.label}{h.col&&<SortIcon col={h.col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(s => {
                const isSelected = selected.has(s.id);
                const pct = s.amount > 0 ? Math.round((s.allocatedAmount/s.amount)*100) : 0;
                const barColor = pct===100?"#00ff87":pct>0?"#60a5fa":"rgba(255,255,255,0.1)";
                return (
                  <tr key={s.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)",background:isSelected?"rgba(99,102,241,0.07)":"transparent",transition:"background .1s" }}
                    onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
                    <td style={{ padding:"11px 12px 11px 16px" }}>
                      <Checkbox checked={isSelected} onChange={()=>toggleSelect(s.id)} />
                    </td>
                    <td style={{ padding:"11px 14px",whiteSpace:"nowrap" }}>
                      <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{s.tenantName}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2 }}>{s.phone}</div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontSize:12,color:"rgba(255,255,255,0.7)" }}>{s.property}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>{s.unit}</div>
                    </td>
                    <td style={{ padding:"11px 14px",fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap" }}>{fmt(s.amount)}</td>
                    <td style={{ padding:"11px 14px",fontSize:12,color:s.lateFeeAmount?"#ef4444":"rgba(255,255,255,0.25)",whiteSpace:"nowrap" }}>
                      {s.lateFeeAmount ? fmt(s.lateFeeAmount) : "—"}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      {s.daysOverdue ? (
                        <span style={{ fontSize:12,fontWeight:700,color:s.daysOverdue>30?"#ef4444":s.daysOverdue>14?"#f97316":"#fbbf24" }}>
                          {s.daysOverdue}d
                        </span>
                      ) : <span style={{ color:"rgba(255,255,255,0.2)",fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <div style={{ width:60,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2 }}>
                          <div style={{ height:"100%",width:`${pct}%`,background:barColor,borderRadius:2,boxShadow:pct>0?`0 0 4px ${barColor}80`:undefined,transition:"width .3s" }} />
                        </div>
                        <span style={{ fontSize:10,color:"rgba(255,255,255,0.35)",minWidth:24 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding:"11px 14px" }}>
                      {s.status==="overdue"   && <NeonButton variant="danger"  style={{ fontSize:10,padding:"5px 10px" }}>Remind</NeonButton>}
                      {s.status==="scheduled" && <NeonButton variant="ghost"   style={{ fontSize:10,padding:"5px 10px" }}>Verify</NeonButton>}
                      {s.status==="paid"      && <NeonButton variant="success" style={{ fontSize:10,padding:"5px 10px" }}>Receipt</NeonButton>}
                      {s.status==="partial"   && <NeonButton variant="warning" style={{ fontSize:10,padding:"5px 10px" }}>Details</NeonButton>}
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding:"48px 20px",textAlign:"center" }}>
                    <div style={{ fontSize:32,marginBottom:8 }}>🔍</div>
                    <div style={{ color:"rgba(255,255,255,0.3)",fontSize:14 }}>No schedules match your filters</div>
                    <div style={{ color:"rgba(255,255,255,0.15)",fontSize:12,marginTop:4 }}>Try adjusting the search or status filter</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>{filtered.length} tenants · Page {page} of {totalPages}</span>
            <div style={{ display:"flex",gap:6 }}>
              <NeonButton variant="ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ fontSize:11,padding:"5px 10px" }}>← Prev</NeonButton>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>Math.abs(p-page)<=2||p===1||p===totalPages).map((p,i,arr)=>(
                <>
                  {i>0&&arr[i-1]<p-1&&<span key={`e${p}`} style={{ color:"rgba(255,255,255,0.2)",padding:"5px 4px",fontSize:12 }}>…</span>}
                  <button key={p} onClick={()=>setPage(p)} style={{ width:30,height:30,borderRadius:8,border:"none",background:p===page?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.05)",color:p===page?"#a78bfa":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:600,cursor:"pointer" }}>{p}</button>
                </>
              ))}
              <NeonButton variant="ghost" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ fontSize:11,padding:"5px 10px" }}>Next →</NeonButton>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

// ─── Tab: Tenant Portal ─────────────────────────────────────────────────────────

function TenantTab() {
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [showSearch, setShowSearch] = useState(false);

  const results = MOCK_TENANTS.filter(t =>
    search.length > 0 && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const t = selectedTenant;

  return (
    <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
      {/* Sidebar */}
      <div style={{ flex:"0 0 280px",display:"flex",flexDirection:"column",gap:12 }}>
        {/* Tenant Search */}
        <GlassPanel style={{ padding:16 }}>
          <div style={{ position:"relative" }}>
            <input
              value={search} onChange={e=>{setSearch(e.target.value);setShowSearch(true);}}
              onFocus={()=>setShowSearch(true)}
              placeholder="🔍  Switch tenant…"
              style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box" }}
            />
            {showSearch && results.length > 0 && (
              <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,zIndex:50,boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
                {results.map(r=>(
                  <div key={r.id} onClick={()=>{setSelectedTenant(r);setSearch(r.name);setShowSearch(false);}} style={{ padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(99,102,241,0.15)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{r.name}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{r.property} · {r.unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Profile card */}
        <GlassPanel>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
            <div style={{ width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:"#fff",boxShadow:"0 0 20px rgba(99,102,241,0.4)",flexShrink:0 }}>
              {t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontWeight:700,fontSize:15,color:"#fff" }}>{t.name}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{t.property} · {t.unit}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>Since {t.since}</div>
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12 }}>
            {[
              ["Outstanding", fmt(t.outstanding), t.outstanding>0?"#ef4444":"#00ff87"],
              ["Credit Balance", fmt(t.creditBalance), "#60a5fa"],
              ["Next Due", t.nextDue, t.nextDue==="OVERDUE"?"#ef4444":"#fff"],
              ["Late Fees (YTD)", fmt(t.lateFees), t.lateFees>0?"#f97316":"rgba(255,255,255,0.4)"],
              ["YTD Paid", fmt(t.ytdPaid), "#00ff87"],
              ["Avg Payment Delay", `${t.avgDelayDays} days`, t.avgDelayDays>5?"#f97316":"#00ff87"],
              ["Preferred Method", METHOD_LABEL[t.preferredMethod], METHOD_COLOR[t.preferredMethod]],
            ].map(([k,v,c]) => (
              <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"rgba(255,255,255,0.4)" }}>{k}</span>
                <span style={{ fontWeight:600,color:c as string }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14,display:"flex",gap:8 }}>
            <NeonButton variant="primary" style={{ flex:1 }}>Pay Now →</NeonButton>
            <NeonButton variant="ghost" style={{ flex:1 }}>Statement →</NeonButton>
          </div>
        </GlassPanel>
      </div>

      {/* Statement Table */}
      <GlassPanel style={{ flex:1,minWidth:300,padding:0,overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <SectionTag>📄 Statement of Account</SectionTag>
          <NeonButton variant="ghost" style={{ fontSize:11,padding:"5px 10px" }}>📥 Download PDF</NeonButton>
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              {["Date","Description","Charge","Payment","Balance"].map(h => (
                <th key={h} style={{ padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.paymentHistory.map((r,i) => {
              const isPayment = r.payment > 0;
              return (
                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)",background:isPayment?"rgba(0,255,135,0.02)":"transparent" }}>
                  <td style={{ padding:"10px 16px",fontSize:12,color:"rgba(255,255,255,0.4)" }}>{r.date}</td>
                  <td style={{ padding:"10px 16px",fontSize:13,color:isPayment?"#00ff87":"#fff" }}>{r.desc}</td>
                  <td style={{ padding:"10px 16px",fontSize:13,color:r.charge?"#fff":"rgba(255,255,255,0.2)" }}>{r.charge?fmt(r.charge):"—"}</td>
                  <td style={{ padding:"10px 16px",fontSize:13,color:r.payment?"#00ff87":"rgba(255,255,255,0.2)" }}>{r.payment?fmt(r.payment):"—"}</td>
                  <td style={{ padding:"10px 16px",fontSize:13,fontWeight:600,color:r.balance<0?"#60a5fa":r.balance===0?"rgba(255,255,255,0.4)":"#ef4444" }}>
                    {r.balance<0?`CR ${fmt(-r.balance)}`:r.balance===0?"—":fmt(r.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

// ─── Tab: Automation ────────────────────────────────────────────────────────────

function AutomationTab() {
  const [cronStates, setCronStates] = useState<Record<string,boolean>>({ lateFees:true, schedules:true, reminders:true, webhook:true });
  const [runLog, setRunLog] = useState<Record<string,string>>({});

  const triggerRun = (key: string) => {
    setRunLog(l=>({...l,[key]:`Manual run at ${new Date().toLocaleTimeString()}`}));
  };

  const crons = [
    { key:"lateFees", name:"Apply Late Fees", fn:"applyLateFees()", schedule:"Daily 09:00", lastRun:"Today 09:00", lastStatus:"success" },
    { key:"schedules", name:"Generate Schedules", fn:"generateMonthlySchedules()", schedule:"1st of month", lastRun:"Apr 1 00:01", lastStatus:"success" },
    { key:"reminders", name:"Due Reminders", fn:"sendDueReminders()", schedule:"3-day advance", lastRun:"Mar 29 08:00", lastStatus:"success" },
    { key:"webhook", name:"Stripe Webhook", fn:"payment_intent.succeeded", schedule:"Real-time", lastRun:"5 mins ago", lastStatus:"listening" },
  ];

  const flow = [
    { step:"Payment received", detail:"M-Pesa callback / Stripe webhook / manual verify" },
    { step:"Idempotency check", detail:"ensureNotProcessed(referenceId)" },
    { step:"FIFO allocation", detail:"allocatePayment() — oldest schedule first" },
    { step:"Partial / Overpayment", detail:"Remainder → tenant.creditBalance" },
    { step:"Receipt emailed", detail:"sendReceipt(paymentId) via SMTP" },
  ];

  return (
    <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
      <div style={{ flex:1,minWidth:240,display:"flex",flexDirection:"column",gap:16 }}>
        <GlassPanel>
          <SectionTag>⚙️ Cron Jobs</SectionTag>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:10 }}>
            {crons.map(c => (
              <div key={c.key} style={{ padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{c.name}</div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"monospace",marginTop:2 }}>{c.fn}</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:2 }}>{c.schedule} · Last: {c.lastRun}</div>
                  </div>
                  {/* Toggle */}
                  <div onClick={()=>setCronStates(s=>({...s,[c.key]:!s[c.key]}))} style={{ width:36,height:20,borderRadius:10,background:cronStates[c.key]?"rgba(0,255,135,0.3)":"rgba(255,255,255,0.1)",border:`1px solid ${cronStates[c.key]?"rgba(0,255,135,0.5)":"rgba(255,255,255,0.2)"}`,cursor:"pointer",position:"relative",transition:"all .2s",flexShrink:0 }}>
                    <div style={{ position:"absolute",width:14,height:14,borderRadius:"50%",background:cronStates[c.key]?"#00ff87":"rgba(255,255,255,0.4)",top:2,left:cronStates[c.key]?18:2,transition:"left .2s" }} />
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <StatusBadge status={c.lastStatus==="success"?"paid":c.lastStatus==="listening"?"partial":"pending"} />
                  <NeonButton variant="ghost" onClick={()=>triggerRun(c.key)} style={{ fontSize:10,padding:"4px 8px" }}>▶ Run Now</NeonButton>
                  {runLog[c.key] && <span style={{ fontSize:10,color:"#00ff87" }}>✓ {runLog[c.key]}</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTag>💰 Late Fee Policy</SectionTag>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:10 }}>
            {[["Grace period","7 days","#fbbf24"],["Rate","5% of rent","#f97316"],["Trigger","applyLateFees()","#a78bfa"],["FIFO","Fees paid first","#00ff87"]].map(([k,v,c])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:13 }}>
                <span style={{ color:"rgba(255,255,255,0.45)" }}>{k}</span>
                <span style={{ fontWeight:600,color:c }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10,fontSize:11,color:"rgba(255,255,255,0.3)" }}>
            Override per-tenant via <code style={{ color:"#a78bfa",fontFamily:"monospace" }}>Lease.graceDays</code> &amp; <code style={{ color:"#a78bfa",fontFamily:"monospace" }}>Lease.lateFeePercent</code>
          </div>
          <NeonButton variant="ghost" style={{ marginTop:12,fontSize:12 }}>Update Policy →</NeonButton>
        </GlassPanel>
      </div>

      <div style={{ flex:1,minWidth:240,display:"flex",flexDirection:"column",gap:16 }}>
        <GlassPanel>
          <SectionTag>🔄 Reconciliation Flow</SectionTag>
          <div style={{ position:"relative",marginTop:12 }}>
            <div style={{ position:"absolute",left:7,top:14,bottom:14,width:1,background:"rgba(99,102,241,0.3)" }} />
            {flow.map((f,i) => (
              <div key={i} style={{ display:"flex",gap:14,padding:"8px 0" }}>
                <div style={{ width:15,height:15,borderRadius:"50%",background:i===flow.length-1?"#00ff87":"#6366f1",boxShadow:`0 0 8px ${i===flow.length-1?"#00ff87":"#6366f1"}80`,flexShrink:0,marginTop:2,zIndex:1 }} />
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{f.step}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"monospace",marginTop:2 }}>{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTag>📬 Comms (Apr)</SectionTag>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginTop:10 }}>
            {[
              ["Email reminders","24 sent","#a78bfa"],
              ["Overdue notices","6 sent","#ef4444"],
              ["Receipts issued","31 sent","#00ff87"],
              ["SMS (M-Pesa)","18 auto","#60a5fa"],
              ["Failed sends","0","rgba(255,255,255,0.3)"],
            ].map(([label,val,color])=>(
              <div key={label} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"rgba(255,255,255,0.5)" }}>{label}</span>
                <span style={{ fontWeight:600,color:color as string }}>{val}</span>
              </div>
            ))}
          </div>
          <NeonButton variant="ghost" style={{ marginTop:12,fontSize:12 }}>Send Reminders Now →</NeonButton>
        </GlassPanel>
      </div>
    </div>
  );
}

// ─── Tab: Reports ───────────────────────────────────────────────────────────────

function ReportsTab({ expenses }: { expenses: Expense[] }) {
  const revenue = 284000, arrears = 47000, totalExp = expenses.reduce((s,e)=>s+e.amount,0), pl = revenue - totalExp;
  const CATEGORY_COLORS: Record<string,string> = { Maintenance:"#f97316",Insurance:"#60a5fa",Utilities:"#00ff87",Admin:"#ef4444" };

  const grouped = expenses.reduce((acc,e) => {
    if (!acc[e.category]) acc[e.category] = { total:0, items:[] };
    acc[e.category].total += e.amount;
    acc[e.category].items.push(e);
    return acc;
  }, {} as Record<string,{total:number;items:Expense[]}>);

  const [expanded, setExpanded] = useState<Record<string,boolean>>({});

  const momData = [
    { month:"Jan", revenue:196, expenses:62, pl:134 },
    { month:"Feb", revenue:214, expenses:71, pl:143 },
    { month:"Mar", revenue:253, expenses:68, pl:185 },
    { month:"Apr", revenue:284, expenses:83, pl:201 },
  ];
  const maxVal = 300;

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em" }}>Property</div>
          <select style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13,minWidth:180 }}>
            <option style={{ background:"#1a1a2e" }}>All Properties</option>
            {PROPERTIES.map(p=><option key={p} style={{ background:"#1a1a2e" }}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:5,textTransform:"uppercase",letterSpacing:".06em" }}>Month</div>
          <input type="month" defaultValue="2026-04" style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:13 }} />
        </div>
        <NeonButton variant="primary">📊 KRA CSV →</NeonButton>
        <NeonButton variant="ghost">P&amp;L Report →</NeonButton>
        <NeonButton variant="ghost">📥 Full Export →</NeonButton>
      </div>

      <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
        <MetricCard label="Revenue" value={`KES ${(revenue/1000).toFixed(0)}K`} accent="linear-gradient(90deg,#00ff87,#0ea5e9)" sparkData={[196,214,253,284]} sparkColor="#00ff87" />
        <MetricCard label="Arrears" value={`KES ${(arrears/1000).toFixed(0)}K`} accent="linear-gradient(90deg,#ef4444,#f97316)" />
        <MetricCard label="Expenses" value={`KES ${(totalExp/1000).toFixed(0)}K`} accent="linear-gradient(90deg,#fbbf24,#f97316)" sparkData={[62,71,68,83]} sparkColor="#f97316" />
        <MetricCard label="Net P&L" value={`KES ${(pl/1000).toFixed(0)}K`} sub="+8.6% vs Mar" accent="linear-gradient(90deg,#6366f1,#00ff87)" sparkData={[134,143,185,201]} sparkColor="#00ff87" />
      </div>

      {/* MoM Chart */}
      <GlassPanel>
        <SectionTag>📈 Month-over-Month (KES thousands)</SectionTag>
        <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:100,marginTop:16,padding:"0 8px" }}>
          {momData.map(m => (
            <div key={m.month} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <div style={{ display:"flex",gap:3,alignItems:"flex-end",width:"100%" }}>
                {[
                  { val:m.revenue, color:"#00ff87" },
                  { val:m.expenses, color:"#f97316" },
                  { val:m.pl, color:"#6366f1" },
                ].map((bar,i) => (
                  <div key={i} style={{ flex:1,height:`${(bar.val/maxVal)*80}px`,background:bar.color,borderRadius:"3px 3px 0 0",opacity:0.8,boxShadow:`0 0 6px ${bar.color}40`,transition:"height .4s" }} />
                ))}
              </div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",textAlign:"center" }}>{m.month}</div>
            </div>
          ))}
          <div style={{ display:"flex",gap:10,alignSelf:"flex-start",marginTop:-4,marginLeft:12 }}>
            {[["Revenue","#00ff87"],["Expenses","#f97316"],["P&L","#6366f1"]].map(([l,c])=>(
              <div key={l} style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,color:"rgba(255,255,255,0.5)" }}>
                <div style={{ width:8,height:8,borderRadius:2,background:c as string }} />{l}
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* Grouped Expense Table */}
      <GlassPanel style={{ padding:0,overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <SectionTag>🧾 Expenses — April 2026 (Grouped)</SectionTag>
        </div>
        {Object.entries(grouped).map(([cat,group]) => {
          const color = CATEGORY_COLORS[cat]||"#a78bfa";
          const isOpen = expanded[cat];
          return (
            <div key={cat}>
              {/* Category Row */}
              <div onClick={()=>setExpanded(e=>({...e,[cat]:!e[cat]}))} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.06)",cursor:"pointer",transition:"background .1s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${color}18`,color,border:`1px solid ${color}40` }}>{cat}</span>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{group.items.length} item{group.items.length!==1?"s":""}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{fmt(group.total)}</span>
                  <span style={{ color:"rgba(255,255,255,0.3)",fontSize:12 }}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              {/* Sub-rows */}
              {isOpen && group.items.map(e=>(
                <div key={e.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px 10px 36px",borderBottom:"1px solid rgba(255,255,255,0.03)",background:"rgba(0,0,0,0.1)" }}>
                  <div>
                    <div style={{ fontSize:13,color:"rgba(255,255,255,0.7)" }}>{e.description}</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2 }}>{e.property} · {e.date}</div>
                  </div>
                  <span style={{ fontSize:13,fontWeight:600,color:"#fff" }}>{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          );
        })}
        {/* Total */}
        <div style={{ display:"flex",justifyContent:"flex-end",padding:"14px 20px",borderTop:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.02)" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:".06em" }}>Total Expenses</div>
            <div style={{ fontSize:18,fontWeight:700,color:"#fff",marginTop:2 }}>{fmt(totalExp)}</div>
          </div>
        </div>
        <div style={{ padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <NeonButton variant="ghost" style={{ fontSize:12 }}>+ Add Expense →</NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────

export default function Payments() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: {key:Tab;label:string;icon:string}[] = [
    { key:"overview",   label:"Overview",   icon:"💠" },
    { key:"initiate",   label:"Pay",        icon:"🧊" },
    { key:"schedules",  label:"Schedules",  icon:"🛰️" },
    { key:"tenant",     label:"Tenant",     icon:"👤" },
    { key:"automation", label:"Automation", icon:"⚡" },
    { key:"reports",    label:"Reports",    icon:"📡" },
  ];

  return (
    <div className="dashboard-content">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>

      <div className="page-tag">💳 PAYMENT MANAGEMENT</div>

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
        <div>
          <div className="section-label">PAYMENTS</div>
          <h2 style={{ fontSize:20,fontWeight:700,color:"var(--neon-purple)",marginTop:4 }}>
            <LiveDot />Payment Hub
          </h2>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={()=>setActiveTab("initiate")} style={{ background:"linear-gradient(to right,var(--neon-blue),var(--neon-purple))",color:"white",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:600,cursor:"pointer",fontSize:14 }}>
            + New Payment
          </button>
        </div>
      </div>

      <div style={{ display:"flex",gap:4,marginBottom:24,borderBottom:"1px solid rgba(255,255,255,0.08)",overflowX:"auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{ background:activeTab===t.key?"rgba(99,102,241,0.15)":"transparent",border:"none",borderBottom:activeTab===t.key?"2px solid #00F0FF":"2px solid transparent",borderRadius:"8px 8px 0 0",padding:"8px 24px",cursor:"pointer",fontSize:13,fontWeight:activeTab===t.key?600:400,color:activeTab===t.key?"#a78bfa":"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"all .15s" }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab==="overview"   && <OverviewTab payments={MOCK_PAYMENTS} />}
      {activeTab==="initiate"   && <InitiateTab />}
      {activeTab==="schedules"  && <SchedulesTab schedules={MOCK_SCHEDULES} />}
      {activeTab==="tenant"     && <TenantTab />}
      {activeTab==="automation" && <AutomationTab />}
      {activeTab==="reports"    && <ReportsTab expenses={MOCK_EXPENSES} />}
    </div>
  );
}