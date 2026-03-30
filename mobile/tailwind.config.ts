import type { Config } from 'tailwindcss';   // Add NativeWind types if needed\n}

    const config: Config = {
        content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
        theme: {
            extend: {
                colors: {
                    bg: '#0B0F19',
                    'bg-card': '#111827',
                    'bg-card2': '#0d1520',
                    border: '#1F2937',
                    neon: '#00F0FF',
                    purple: '#7C3AED',
                    danger: '#FF3B81',
                    success: '#00FFA3',
                    warn: '#FFB84D',
                    text: '#E5E7EB',
                    muted: '#9CA3AF',
                    glass: 'rgba(17,24,39,0.8)',
                },
                fontFamily: {
                    'orbitron': ['Orbitron', 'monospace'],
                    'sora': ['Sora', 'sans-serif'],
                    'jetbrains': ['JetBrains Mono', 'monospace'],
                },
                animation: {
                    'fade-up': 'fadeUp 0.4s ease forwards',
                    'pulse-neon': 'pulse 2s infinite',
                },
                keyframes: {
                    fadeUp: {
                        '0%': { opacity: '0', transform: 'translateY(16px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' },
                    },
                    pulse: {
                        '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,240,255,0.3)' },
                        '50%': { boxShadow: '0 0 0 8px rgba(0,240,255,0)' },
                    },
                },
            },
        },
        plugins: [],
    };

    export default config;
