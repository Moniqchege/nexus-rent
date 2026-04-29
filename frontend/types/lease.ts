export type LeaseStatus = "active" | "ended" | "suspended";
export type BillingCycle = "monthly" | "weekly";

export interface LeaseTenant {
  id: number;
  leaseId: number;
  tenantId: number;
  tenant: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface Lease {
  id: number;
  propertyId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  billingCycle: BillingCycle;
  status: LeaseStatus;
  creditBalance?: number;
  lateFeePercent: number;
  graceDays: number;
  signedDocumentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: number;
    title: string;
    location: string;
  };
  tenants: LeaseTenant[];   
}

export interface CreateLeaseInput {
  propertyId: number;
  tenantIds: number[];       
  startDate: string;
  endDate: string;
  rentAmount: number;
  billingCycle?: BillingCycle;
  status?: LeaseStatus;
  lateFeePercent?: number;
  graceDays?: number;
}

export interface UpdateLeaseInput {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  billingCycle?: BillingCycle;
  status?: LeaseStatus;
  lateFeePercent?: number;
  graceDays?: number;
  tenantIds?: number[];      // ← optional re-sync
}