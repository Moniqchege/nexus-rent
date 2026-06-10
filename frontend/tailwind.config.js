module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existing theme tokens
        "bg-primary": "var(--bg-primary)",
        "bg-card": "var(--bg-card)",
        "bg-muted": "var(--bg-muted)",
        "border-glow": "var(--border-glow)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "neon-blue": "var(--neon-blue)",
        "neon-purple": "var(--neon-purple)",
        "accent-danger": "var(--accent-danger)",
        "accent-success": "var(--accent-success)",
        "accent-warning": "var(--accent-warning)",

        // Tokens required by PropertyForm.tsx
        "surface": "var(--bg-primary)",
        "surface-container-high": "var(--bg-card)",
        "surface-variant": "var(--bg-muted)",
        "tertiary": "var(--bg-card)",

        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "on-error-container": "var(--accent-danger)",
      },
      fontSize: {
        // PropertyForm uses semantic font sizes
        "data-label": ["11px", { lineHeight: "16px" }],
        "body-sm": ["12px", { lineHeight: "16px" }],
        "body-md": ["14px", { lineHeight: "20px" }],
      },
      fontFamily: {
        // PropertyForm references these as utility classes
        headline: ["Inter", "sans-serif"],
        data: ["Inter", "sans-serif"],
      },
      spacing: {
        gutter: "24px",
        "card-gap": "20px",
        "section-margin": "48px",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
}