export interface Payment {
  id: number;
  tenantId: number;
  propertyId: number;
  amount: number;
  method: 'mpesa' | 'card' | 'airtel';
  status: PaymentStatus
  referenceId?: string;
  metadata?: any;
  lateFee?: number;
  paidAt?: string;
  createdAt: string;
  date: string;
  tenant: {
    name: string;
  };
  property: {
    title: string;
  };
  scheduleId: number;
}

type RentScheduleStatus = "scheduled" | "overdue" | "paid";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type DerivedStatus = "scheduled" | "partial" | "paid";

export const getPaymentState = (schedule: RentSchedule, payments: Payment[]): DerivedStatus => {
  const totalPaid = payments
    .filter(p => p.status === "paid" && p.scheduleId === schedule.id)
    .reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid === 0) return "scheduled";
  if (totalPaid < schedule.amount) return "partial";
  return "paid";
};

export interface RentSchedule {
  id: number;
  propertyId: number;
  tenantId: number;
  dueDate: string;
  amount: number;
  lateFeeAmount: number;
  status: RentScheduleStatus;
  period: string;
  tenant: { name: string, phone: string };
  property: { title: string, location?: string; };
  allocatedAmount: number;
  unit: string;
}
