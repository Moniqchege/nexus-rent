import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export interface Notification {
    id: number;
    title?: string;
    message: string;
    landlordId?: number;
    recipientIds: string[];
    status: string;
    icon: string;
    isRead: boolean;
    sentAt: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    _hasHydrated: boolean;

    setHasHydrated: (state: boolean) => void;
    fetchNotifications: (token: string) => Promise<void>;
    markRead: (id: number, token: string) => Promise<void>;
    refreshUnreadCount: (token: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            loading: false,
            error: null,
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

            fetchNotifications: async (token: string) => {

                set({ loading: true, error: null });

                try {
                    const notifications = await api.getNotifications(token);

                    notifications.sort((a, b) =>
                        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
                    );

                    const unread = notifications.filter(n => !n.isRead).length;

                    set({ notifications, unreadCount: unread });
                } catch (error: any) {
                    set({ error: error.message });
                } finally {
                    set({ loading: false });
                }
            },

            markRead: async (id: number, token: string) => {
                try {
                    await api.markNotificationRead(id, token);
                    set(state => {
                        const updated = state.notifications.map(n =>
                            n.id === id ? { ...n, isRead: true } : n
                        );
                        return {
                            notifications: updated,
                            unreadCount: updated.filter(n => !n.isRead).length
                        };
                    });
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            refreshUnreadCount: async (token: string) => {
                await get().fetchNotifications(token);
            }
        }),
        {
            name: 'notifications-storage',
            // ✅ Explicitly provide AsyncStorage instead of relying on default
            storage: createJSONStorage(() => AsyncStorage),
            partialize: state => ({
                notifications: state.notifications,
                unreadCount: state.unreadCount
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                }
                state?.setHasHydrated(true);
            }
        }
    )
);