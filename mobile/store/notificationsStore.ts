import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export interface Notification {
    id: number;
    title?: string;
    message: string;
    landlordId?: number;
    recipientIds: string[]; 
    isRead: boolean;
    sentAt: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;

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

            fetchNotifications: async (token: string) => {
                set({ loading: true, error: null });
                try {
                    const notifications: Notification[] = await api.getNotifications(token);

                    notifications.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
                    set({
                        notifications,
                        unreadCount: notifications.filter(n => !n.isRead).length
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
            partialize: state => ({
                notifications: state.notifications,
                unreadCount: state.unreadCount
            }),
        }
    )
);