"use client";

import { create } from 'zustand';
import api from '../lib/api';

// ── Dashboard Stats Interfaces ─────────────────────────────
interface RevenueTrendItem {
    month: string;
    revenue: number;
}

interface ExpenseCategoryItem {
    category: string;
    total: number;
}

interface RecentPayment {
    id: number;
    tenantName: string;
    propertyTitle: string;
    amount: number;
    paidAt: string;
    method: string;
}

interface ExpiringLease {
    id: number;
    propertyTitle: string;
    tenantNames: string[];
    endDate: string;
}

export interface DashboardStats {
    totalProperties: number;
    activeLeases: number;
    occupancyRate: number;
    monthlyRevenue: number;
    totalArrears: number;
    revenueTrend: RevenueTrendItem[];
    expenseByCategory: ExpenseCategoryItem[];
    recentPayments: RecentPayment[];
    leasesExpiringSoon: ExpiringLease[];
}

// ── Dashboard Store Interface ─────────────────────────────
interface DashboardStore {
    stats: DashboardStats | null;
    loading: boolean;
    error: string | null;
    fetchStats: () => Promise<void>;
}

// ── Dashboard Store Implementation ─────────────────────────
export const useDashboardStore = create<DashboardStore>((set) => ({
    stats: null,
    loading: false,
    error: null,

    fetchStats: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/api/dashboard/stats');
            set({ stats: res.data, loading: false });
        } catch (error) {
            set({
                error: "Could not load dashboard data. Please refresh.",
                loading: false,
            });
        }
    },
}));
