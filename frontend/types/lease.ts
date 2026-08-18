export type LeaseStatus = "pending_signature" | "active" | "ended" | "suspended" | "cancelled";
export type BillingCycle = "monthly" | "weekly";

export interface UnitType {
  id: number;
  propertyId: number;
  type: string;
  baths: number;
  price: number;
  totalUnits: number;
}

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
  unitTypeId?: number | null;
  depositAmount?: number | null;
  unitType?: UnitType | null;
  renewedFromId?: number | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  property: {
    id: number;
    title: string;
    location: string;
    unitTypes: UnitType[];
  };
  tenants: LeaseTenant[];
}

export interface RenewLeaseInput {
  startDate: string;
  endDate: string;
  rentAmount?: number;
  unitTypeId?: number | null;
  depositAmount?: number | null;
  billingCycle?: BillingCycle;
  lateFeePercent?: number;
  graceDays?: number;
  tenantIds?: number[];
  requiresNewSignature?: boolean;
}

export interface CreateLeaseInput {
  propertyId: number;
  tenantIds: number[];
  startDate: string;
  endDate: string;
  rentAmount?: number;
  unitTypeId?: number;
  depositAmount?: number;
  billingCycle?: BillingCycle;
  status?: LeaseStatus;
  lateFeePercent?: number;
  graceDays?: number;
}

export interface UpdateLeaseInput {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  unitTypeId?: number | null;
  depositAmount?: number | null;
  billingCycle?: BillingCycle;
  status?: LeaseStatus;
  lateFeePercent?: number;
  graceDays?: number;
  tenantIds?: number[];      // ← optional re-sync
}