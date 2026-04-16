import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export interface AuditTrail {
    id: number;
    action: string;
    status: 'SUCCESS' | 'FAILED';
    title: string;
    subtitle?: string;
    metadata?: any;
    createdAt: string;
    user?: { name: string };
}

interface AuditState {
    auditTrails: AuditTrail[];
    loading: boolean;
    error: string | null;
    _hasHydrated: boolean;

    setHasHydrated: (state: boolean) => void;
    fetchAuditTrails: (token: string) => Promise<void>;
}

export const useAuditTrailsStore = create<AuditState>()(
    persist(
        (set, get) => ({
            auditTrails: [],
            loading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

            fetchAuditTrails: async (token: string) => {
                set({ loading: true, error: null });

                try {
                    const auditTrails = await api.getAuditTrails(token);
                    // Sort newest first
                    auditTrails.sort((a: AuditTrail, b: AuditTrail) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    set({ auditTrails });
                } catch (error: any) {
                    set({ error: error.message });
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'audit-trails-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ auditTrails: state.auditTrails }),
            onRehydrateStorage: () => (state, error) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

