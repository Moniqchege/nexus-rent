import type { PayMethod, PayStatus, SchedStatus, Payment, RentSchedule, Expense, Tenant } from "./types";

export const PROPERTIES = ["Maple Court", "Sunset Villas", "Central Heights", "Green Park"];

export const METHOD_LABEL: Record<PayMethod, string> = {
  mpesa: "M-Pesa",
  airtel: "Airtel",
  card: "Card",
  bank: "Bank Transfer",
};
export const METHOD_COLOR: Record<PayMethod, string> = {
  mpesa: "#00ff87",
  airtel: "#fb923c",
  card: "#60a5fa",
  bank: "#c084fc",
};
export const METHOD_ICON: Record<PayMethod, string> = {
  mpesa: "📱",
  airtel: "📲",
  card: "💳",
  bank: "🏦",
};

export const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  paid:      { bg: "rgba(0,255,135,0.1)",   color: "#00ff87", border: "rgba(0,255,135,0.3)" },
  pending:   { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  overdue:   { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.3)" },
  partial:   { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
  scheduled: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  active:    { bg: "rgba(0,255,135,0.1)",   color: "#00ff87", border: "rgba(0,255,135,0.3)" },
  listening: { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
};

export const SPARKLINE_DATA = {
  collected: [201, 218, 195, 234, 241, 229, 258, 271, 248, 263, 284, 290],
  rate: [88, 91, 86, 93, 89, 94, 91, 96, 93, 95, 94, 96],
};

export const fmt = (n: number) => `KES ${n.toLocaleString()}`;
export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const timeAgo = (s: string) => {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

// ─── Mock Data ──────────────────────────────────────────────────────────────────

export const generateSchedules = (): RentSchedule[] => {
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
    "Henry Kamau","Irene Achieng","Joseph Waweru","Kathleen Onyango",
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
    const allocated =
      status === "paid" ? amount
      : status === "partial" ? Math.floor(amount * 0.4 + Math.random() * amount * 0.4)
      : 0;
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

export const MOCK_SCHEDULES: RentSchedule[] = generateSchedules();

export const MOCK_PAYMENTS: Payment[] = [
  { id: 1, tenantName: "James Mwangi",   property: "Maple Court",    unit: "A1", amount: 28500, method: "mpesa", status: "paid",    referenceId: "QK3HT72FNZ",          paidAt: new Date(Date.now() - 2 * 60000).toISOString(),     createdAt: new Date().toISOString() },
  { id: 2, tenantName: "Aisha Ochieng",  property: "Sunset Villas",  unit: "B2", amount: 45000, method: "card",  status: "paid",    referenceId: "pi_3QK7aF2eZvK",      paidAt: new Date(Date.now() - 47 * 60000).toISOString(),    createdAt: new Date().toISOString() },
  { id: 3, tenantName: "Peter Kamau",    property: "Central Heights", unit: "C3", amount: 32000, method: "bank",  status: "pending", referenceId: "NEXUS-BANK-3-483920",                                                              createdAt: new Date().toISOString() },
  { id: 4, tenantName: "Grace Njeri",    property: "Maple Court",    unit: "A2", amount: 28500, method: "mpesa", status: "overdue", referenceId: "",                                                                                  createdAt: new Date().toISOString() },
  { id: 5, tenantName: "David Otieno",   property: "Green Park",     unit: "D1", amount: 18000, method: "mpesa", status: "paid",    referenceId: "QK3HT72AAA",          paidAt: new Date(Date.now() - 3 * 3600000).toISOString(),   createdAt: new Date().toISOString() },
  { id: 6, tenantName: "Mary Wanjiku",   property: "Sunset Villas",  unit: "B3", amount: 15000, method: "card",  status: "partial", referenceId: "pi_partial",                                                                       createdAt: new Date().toISOString() },
  { id: 7, tenantName: "Samuel Kipchoge",property: "Central Heights", unit: "C1", amount: 22000, method: "mpesa", status: "paid",    referenceId: "QK3HT72BBB",          paidAt: new Date(Date.now() - 6 * 3600000).toISOString(),   createdAt: new Date().toISOString() },
  { id: 8, tenantName: "Fatuma Hassan",  property: "Green Park",     unit: "D2", amount: 18000, method: "airtel",status: "paid",    referenceId: "AIR-88821",           paidAt: new Date(Date.now() - 8 * 3600000).toISOString(),   createdAt: new Date().toISOString() },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 1, category: "Maintenance", description: "Plumbing repair Apt A1",        amount: 8500,  date: "2026-04-05", property: "Maple Court" },
  { id: 2, category: "Maintenance", description: "Gate motor servicing",           amount: 4200,  date: "2026-04-12", property: "Central Heights" },
  { id: 3, category: "Insurance",   description: "Property insurance premium",     amount: 12000, date: "2026-04-01", property: "All Properties" },
  { id: 4, category: "Utilities",   description: "Common area electricity",        amount: 6800,  date: "2026-04-15", property: "Sunset Villas" },
  { id: 5, category: "Admin",       description: "Agent commission",               amount: 11500, date: "2026-04-20", property: "Green Park" },
  { id: 6, category: "Maintenance", description: "Roof leak repair",               amount: 22000, date: "2026-04-08", property: "Maple Court" },
  { id: 7, category: "Utilities",   description: "Borehole pump servicing",        amount: 9500,  date: "2026-04-18", property: "Central Heights" },
  { id: 8, category: "Admin",       description: "Legal fees — lease renewal",     amount: 8000,  date: "2026-04-22", property: "Sunset Villas" },
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 1, name: "James Mwangi", unit: "A1", property: "Maple Court",
    phone: "0712345678", email: "james.mwangi@email.com", since: "Jan 2024",
    rent: 28500, outstanding: 0, creditBalance: 1500, nextDue: "May 1 · KES 28,500",
    lateFees: 0, avgDelayDays: 1.2, preferredMethod: "mpesa", ytdPaid: 114000,
    paymentHistory: [
      { date: "Apr 3", desc: "M-Pesa payment",    charge: 0,     payment: 30000, balance: -1500 },
      { date: "Apr 1", desc: "Rent — Apr 2026",   charge: 28500, payment: 0,     balance: 28500 },
      { date: "Mar 2", desc: "M-Pesa payment",    charge: 0,     payment: 28500, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026",   charge: 28500, payment: 0,     balance: 28500 },
      { date: "Feb 2", desc: "Card payment",       charge: 0,     payment: 28500, balance: 0 },
      { date: "Feb 1", desc: "Rent — Feb 2026",   charge: 28500, payment: 0,     balance: 28500 },
    ],
  },
  {
    id: 2, name: "Aisha Ochieng", unit: "B2", property: "Sunset Villas",
    phone: "0722456789", email: "aisha.ochieng@email.com", since: "Mar 2023",
    rent: 45000, outstanding: 0, creditBalance: 0, nextDue: "May 1 · KES 45,000",
    lateFees: 0, avgDelayDays: 0.8, preferredMethod: "card", ytdPaid: 180000,
    paymentHistory: [
      { date: "Apr 2", desc: "Card payment",      charge: 0,     payment: 45000, balance: 0 },
      { date: "Apr 1", desc: "Rent — Apr 2026",   charge: 45000, payment: 0,     balance: 45000 },
      { date: "Mar 1", desc: "Card payment",      charge: 0,     payment: 45000, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026",   charge: 45000, payment: 0,     balance: 45000 },
    ],
  },
  {
    id: 3, name: "Grace Njeri", unit: "A2", property: "Maple Court",
    phone: "0733567890", email: "grace.njeri@email.com", since: "Jun 2022",
    rent: 28500, outstanding: 29925, creditBalance: 0, nextDue: "OVERDUE",
    lateFees: 1425, avgDelayDays: 12.4, preferredMethod: "mpesa", ytdPaid: 85500,
    paymentHistory: [
      { date: "Apr 1", desc: "Rent — Apr 2026",        charge: 28500, payment: 0,     balance: 28500 },
      { date: "Apr 8", desc: "Late fee applied (5%)",  charge: 1425,  payment: 0,     balance: 29925 },
      { date: "Mar 14",desc: "M-Pesa payment",         charge: 0,     payment: 28500, balance: 0 },
      { date: "Mar 1", desc: "Rent — Mar 2026",        charge: 28500, payment: 0,     balance: 28500 },
    ],
  },
];