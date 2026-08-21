import { useThemeStore } from '../store/themeStore';

export interface Theme {
    bg: string;
    bgCard: string;
    bgInput: string;
    bgInputDark: string;
    border: string;
    borderAccent: string;
    text: string;
    textSub: string;
    textMuted: string;
    textDim: string;
    accent: string;
    accentPurple: string;
    accentGreen: string;
    accentRed: string;
    accentWarn: string;
    /** Comma-separated RGB for building rgba() strings */
    accentRgb: string;
    accentPurpleRgb: string;
    accentGreenRgb: string;
    accentRedRgb: string;
    accentWarnRgb: string;
    tabBar: string;
    tabBarBorder: string;
    ambientOpacity: number;
}

export function rgba(rgb: string, opacity: number): string {
    return `rgba(${rgb},${opacity})`;
}

// Dark theme — neon accents on a dark canvas
export const darkTheme: Theme = {
    bg: '#060A14',
    bgCard: '#111827',
    bgInput: '#111827',
    bgInputDark: '#0D1421',
    border: '#1F2937',
    borderAccent: 'rgba(0,240,255,0.2)',
    text: '#FFFFFF',
    textSub: '#9CA3AF',
    textMuted: '#888888',
    textDim: '#555555',
    accent: '#00F0FF',
    accentPurple: '#7C3AED',
    accentGreen: '#00FFA3',
    accentRed: '#FF3B81',
    accentWarn: '#FFB84D',
    accentRgb: '0,240,255',
    accentPurpleRgb: '124,58,237',
    accentGreenRgb: '0,255,163',
    accentRedRgb: '255,59,129',
    accentWarnRgb: '255,184,77',
    tabBar: 'rgba(6,10,20,0.98)',
    tabBarBorder: 'rgba(0,240,255,0.15)',
    ambientOpacity: 0.1,
};

// Light theme — professional, high-contrast (no neon)
export const lightTheme: Theme = {
    bg: '#F8FAFC',
    bgCard: '#FFFFFF',
    bgInput: '#F1F5F9',
    bgInputDark: '#E2E8F0',
    border: '#E2E8F0',
    borderAccent: 'rgba(8,145,178,0.3)',
    text: '#0F172A',
    textSub: '#475569',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    accent: '#0891B2',
    accentPurple: '#7C3AED',
    accentGreen: '#059669',
    accentRed: '#E11D48',
    accentWarn: '#D97706',
    accentRgb: '8,145,178',
    accentPurpleRgb: '124,58,237',
    accentGreenRgb: '5,150,105',
    accentRedRgb: '225,29,72',
    accentWarnRgb: '217,119,6',
    tabBar: 'rgba(255,255,255,0.98)',
    tabBarBorder: 'rgba(8,145,178,0.2)',
    ambientOpacity: 0.04,
};

export function useTheme(): { theme: Theme; isDark: boolean } {
    const isDark = useThemeStore((state) => state.isDark);
    return { theme: isDark ? darkTheme : lightTheme, isDark };
}
