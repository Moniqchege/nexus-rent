import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface Notification {
    id: number;
    message: string;
    landlordId?: number;
    tenantIds: number[];
    isRead: boolean;
    sentAt: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;

    fetchNotifications: (token: string, unreadOnly?: boolean) => Promise<void>;
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

            fetchNotifications: async (token: string, unreadOnly = false) => {
                set({ loading: true, error: null });
                try {
                    const notifications = await api.getNotifications(token, unreadOnly);
                    set({
                        notifications: unreadOnly ? notifications : [...get().notifications, ...notifications],
                        unreadCount: notifications.filter((n: Notification) => !n.isRead).length
                    });
                } catch (error: any) {
                    set({ error: error.message });
                } finally {
                    set({ loading: false });
                }
            },

            markRead: async (id: number, token: string) => {
                try {
                    await api.markNotificationRead(id, token);
                    set((state) => ({
                        notifications: state.notifications.map(n =>
                            n.id === id ? { ...n, isRead: true } : n
                        ),
                        unreadCount: state.notifications.filter((n: Notification) => !n.isRead).length
                    }));
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            refreshUnreadCount: async (token: string) => {
                await get().fetchNotifications(token, true);
            }
        }),
        {
            name: 'notifications-storage',
            partialize: (state) => ({ notifications: state.notifications, unreadCount: state.unreadCount }),
        }
    )
);

