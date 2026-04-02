import Constants from 'expo-constants';
import { Property } from '../types/property';

export const API_BASE = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

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

    async login(email: string, password: string): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
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
        if (data.requiresOtp) {
            throw new Error('OTP required - login flow needs OTP screen');
        }
        return { token: data.token, user: data.user };
    },

};

export default api;

