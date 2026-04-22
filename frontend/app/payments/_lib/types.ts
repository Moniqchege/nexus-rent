export type PayMethod = "mpesa" | "airtel" | "card" | "bank";
export type PayStatus = "paid" | "pending" | "overdue" | "partial";
export type SchedStatus = "scheduled" | "overdue" | "paid" | "partial";
export type Tab = "overview" | "initiate" | "schedules" | "tenant" | "automation" | "reports";

export interface Payment {
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

export interface RentSchedule {
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

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  property: string;
}

export interface Tenant {
  id: number;
  name: string;
  unit: string;
  property: string;
  propertyId: number;
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
  paymentHistory: {
    date: string;
    desc: string;
    charge: number;
    payment: number;
    balance: number;
  }[];
}