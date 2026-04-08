import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

interface User {
    id: number;
    email: string;
    name: string;
    username?: string;
    phone?: string;
    plan?: string;
    userProperties: UserProperty[];
}

interface Property {
    id: number;
    title: string;
    location?: string;
    price?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    status?: string;
    amenities?: string[];
    image?: string;
}

interface Role {
    id: number;
    name: string;
}

interface UserProperty {
    propertyId: number;
    role: Role;
    property: Property;
}

const normalizeUser = (user: any): User => ({
    ...user,
    userProperties: (user.userProperties ?? []).map((up: any) => ({
        ...up,
        property: {
            id: up.property.id,
            title: up.property.title,
            location: up.property.location,
            price: up.property.price,
            beds: up.property.beds,
            baths: up.property.baths,
            sqft: up.property.sqft,
            status: up.property.status,
            amenities: up.property.amenities,
            image: up.property.image,
        },
        role: up.role, // keep as is
        propertyId: up.propertyId,
    })),
});

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

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null, isFirstLogin: false, needsOtp: false });
                try {
                    const data = await api.login(email, password);
                    const normalizedUser = normalizeUser(data.user);

                    console.log("Login response user object:", normalizedUser);

                    if (data.isFirstLogin) {
                        set({
                            tempToken: data.token,
                            user: normalizedUser,
                            isFirstLogin: true,
                            isLoading: false,
                            token: null
                        });
                        console.log("First login - user set:", normalizedUser);
                    } else if (data.needsOtp || data.requiresOtp || data.otp_required) {
                        set({ needsOtp: true, user: normalizedUser, tempToken: data.token, isLoading: false });
                        console.log("OTP required - user set:", normalizedUser);
                    } else {
                        set({ token: data.token, user: normalizedUser, isLoading: false });
                        console.log("Normal login - user set:", normalizedUser);
                    }
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                    throw err;
                }
            },

            verifyOtp: async (userId: string, code: string) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await api.verifyOtp(userId, code);
                    const normalizedUser = normalizeUser(data.user);
                   console.log("OTP verification - user object:", JSON.stringify(normalizedUser, null, 2));
                    set({ token: data.token, user: normalizedUser, tempToken: null, isFirstLogin: false, needsOtp: false, isLoading: false });
                } catch (err: any) {
                    set({ error: err.message, isLoading: false });
                    throw err;
                }
            },

            setToken: (token: string, user: User) => {
                const normalizedUser = normalizeUser(user);
                set({ token, user: normalizedUser });
            },

            logout: () => set({ user: null, token: null, tempToken: null, isFirstLogin: false, needsOtp: false, error: null }),
            setTempToken: (token: string) => set({ tempToken: token, isFirstLogin: true }),
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

