export interface Payment {
  id: number;
  tenantId: number;
  propertyId: number;
  amount: number;
  method: 'mpesa' | 'card' | 'airtel';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  referenceId?: string;
  metadata?: any;
  lateFee?: number;
  paidAt?: string;
  createdAt: string;
  tenant: {
    name: string;
  };
  property: {
    title: string;
  };
}

export interface RentSchedule {
  id: number;
  propertyId: number;
  tenantId: number;
  dueDate: string;
  amount: number;
  lateFeeAmount: number;
  status: 'scheduled' | 'paid' | 'overdue';
  period: string;
  tenant: { name: string };
  property: { title: string };
}
