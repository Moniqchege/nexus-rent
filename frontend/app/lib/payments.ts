import api from './api';
import type { Payment, RentSchedule } from '../../types/payment';

export const getPayments = (params?: {
    propertyId?: number;
    tenantId?: number;
    status?: string;
}) => {
    const query = new URLSearchParams();
    if (params?.propertyId) query.set('propertyId', params.propertyId.toString());
    if (params?.tenantId) query.set('tenantId', params.tenantId.toString());
    if (params?.status) query.set('status', params.status);

    return api.get(`/api/payments?${query.toString()}`).then(res => res.data.payments as Payment[]);
};

export const getRentSchedules = (status?: string, leaseId?: number): Promise<RentSchedule[]> => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (leaseId) params.set('leaseId', String(leaseId));

  return api.get(`/api/payments/schedules?${params}`).then(res => res.data.schedules as RentSchedule[]);
};

export const getTenantStatement = (tenantId: number) => {
    return api.get(`/api/payments/tenants/${tenantId}/statement`).then(res => res.data.ledger);
};

export const initiateMpesaSTK = (data: {
    phone: string;
    amount: number;
    accountRef: string;
    propertyId: number;
    tenantId: number;
    description: string;
}) => {
    return api.post('/api/payments/mpesa', data);
};

export const createStripeSession = (data: {
    propertyId: number;
    tenantId: number;
    amount: number;
    accountRef: string;
}) => {
    return api.post('/api/payments/card/session', data).then(res => ({
        clientSecret: res.data.clientSecret,
        id: res.data.id
    }));
};

export const confirmStripePayment = (data: {
    piId: string;
    tenantId: number;
    propertyId: number;
}) => {
    return api.post('/api/payments/card/confirm', data);
};

export const initiateBankTransfer = (data: {
    propertyId: number;
    tenantId: number;
    amount: number;
    accountRef: string;
}) => {
    return api.post('/api/payments/bank', data);
};

export const resendReceipt = (paymentId: number) => {
    return api.post(`/api/payments/${paymentId}/receipt`);
};

export const verifyPayment = (paymentId: number) => {
    return api.put(`/api/payments/${paymentId}/verify`);
};

// ── Reports ───────────────────────────────────────────────
export const getPaymentReport = (propertyId: number, month?: string) => {
    const query = month ? `?propertyId=${propertyId}&month=${month}` : `?propertyId=${propertyId}`;
    return api.get(`/api/payments/reports${query}`, {
        responseType: 'blob'
    }).then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `payments-report-${propertyId}.csv`;
        link.click();
    });
};

export const getBatchReport = (month?: string) => {
    const query = month ? `?month=${month}` : '';
    return api.get(`/api/payments/reports/batch${query}`, {
        responseType: 'blob'
    }).then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch-report-${month ?? 'current'}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    });
};

export const getCashFlow = (days: 7 | 30 = 7) => {
    return api.get(`/api/payments/cashflow?days=${days}`).then(
        res => res.data.days as { date: string; label: string; inflow: number; outflow: number }[]
    );
};

// ── Expenses ──────────────────────────────────────────────
export const getExpensesSummary = (month?: string) => {
    const query = month ? `?month=${month}` : '';
    return api.get(`/api/expenses/summary${query}`).then(res => res.data.expenses as number);
};