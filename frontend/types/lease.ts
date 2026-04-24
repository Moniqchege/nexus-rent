export type LeaseStatus = "active" | "ended" | "suspended";
export type BillingCycle = "monthly" | "weekly";

export interface Lease {
    id: number;
    propertyId: number;
    tenantId: number;
    startDate: string;
    endDate: string;
    rentAmount: number;
    billingCycle: BillingCycle;
    status: LeaseStatus;
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
    tenant: {
        id: number;
        name: string;
        email: string;
        phone?: string | null;
    };
}

export interface CreateLeaseInput {
    propertyId: number;
    tenantId: number;
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
}

