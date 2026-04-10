import Constants from 'expo-constants';
import { Property } from '../types/property';

export const API_BASE = Constants.expoConfig?.extra?.apiUrl ?? 'https://lavenia-pronounceable-radically.ngrok-free.dev';

const api = {
    async fetchProperties(token?: string): Promise<Property[]> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            (headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/properties`, { headers });

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
    },

    async login(email: string, password: string): Promise<any> {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const data = await response.json();
        return data;
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        return response.json();
    },

    async resetPassword(password: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        return response.json();
    },

    async resetFirstPassword(token: string, password: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/auth/reset-first-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword: password }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        return response.json();
    },

    sendOtp: async (token: string) => {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to send OTP.");
        }

        return data;
    },

    async verifyOtp(userId: string, code: string): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, code }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        return response.json();
    },

    async getNotifications(token: string): Promise<any[]> {
        const url = `${API_BASE}/api/notifications`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const text = await response.text();
        console.log('🧾 Raw response:', text);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const json = JSON.parse(text);
        return json.notifications ?? [];
    },

    async markNotificationRead(id: number, token: string): Promise<any> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
    },
};

export default api;

