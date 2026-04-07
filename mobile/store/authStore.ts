import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    tempToken: string | null;
    isFirstLogin: boolean;
    needsOtp: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setToken: (token: string, user: User) => void;
    setTempToken: (token: string) => void;
    verifyOtp: (userId: string, code: string) => Promise<void>;

    setError: (msg: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            tempToken: null,
            isFirstLogin: false,
            needsOtp: false,
            isLoading: false,
            error: null,

            // login: async (email: string, password: string) => {
            //     set({ isLoading: true, error: null });
            //     try {
            //         const data = await api.login(email, password);
            //         if (data.isFirstLogin) {
            //             set({ tempToken: data.token, user: data.user, isFirstLogin: true, isLoading: false });
            //         } else if (data.requiresOtp) {
            //             set({ needsOtp: true, user: data.user, isLoading: false });
            //         } else {
            //             set({ token: data.token, user: data.user, isLoading: false });
            //         }
            //     } catch (err: any) {
            //         set({ error: err.message, isLoading: false });
            //         throw err;
            //     }
            // },

            login: async (email: string, password: string) => {
                set({
                    isLoading: true,
                    error: null,
                    isFirstLogin: false,
                    needsOtp: false,
                    token: null,
                    tempToken: null
                });
                try {
                    const data = await api.login(email, password);
                    console.log("Login response:", JSON.stringify(data));

                    if (data.isFirstLogin) {
                        set({
                            tempToken: data.token,
                            user: data.user,
                            isFirstLogin: true,
                            isLoading: false,
                            token: null
                        });
                    } else if (data.needsOtp || data.requiresOtp || data.otp_required) {
                        // ← match whatever field your API actually returns
                        set({ needsOtp: true, user: data.user, tempToken: data.token, isLoading: false });
                    } else {
                        set({ token: data.token, user: data.user, isLoading: false });
                    }
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                    throw err;
                }
            },

            logout: () => {
                set({ user: null, token: null, tempToken: null, isFirstLogin: false, needsOtp: false, error: null });
            },

            setTempToken: (token: string) => set({ tempToken: token, isFirstLogin: true }),

            verifyOtp: async (userId: string, code: string) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await api.verifyOtp(userId, code);
                    set({ token: data.token, user: data.user, tempToken: null, isFirstLogin: false, needsOtp: false, isLoading: false });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                    throw err;
                }
            },

            setToken: (token: string, user: User) => set({ token, user }),
            setError: (msg: string | null) => set({ error: msg }),
            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isFirstLogin: state.isFirstLogin,
                tempToken: state.tempToken,
            }),
            storage: {
                getItem: async (name) => {
                    const value = await AsyncStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: async (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
                removeItem: async (name) => AsyncStorage.removeItem(name),
            },
        }
    )
);

