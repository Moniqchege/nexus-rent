import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDark: true,
            toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
        }),
        {
            name: 'theme-storage',
            storage: {
                getItem: async (name) => {
                    try {
                        const value = await AsyncStorage.getItem(name);
                        return value ? JSON.parse(value) : null;
                    } catch {
                        return null;
                    }
                },
                setItem: async (name, value) => {
                    try {
                        await AsyncStorage.setItem(name, JSON.stringify(value));
                    } catch {
                        // Silently fail — in-memory state is already updated
                    }
                },
                removeItem: async (name) => {
                    try {
                        await AsyncStorage.removeItem(name);
                    } catch {
                        // Silently fail
                    }
                },
            },
        }
    )
);
