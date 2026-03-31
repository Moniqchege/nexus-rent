/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        "bg-card": "#111827",
        "bg-card2": "#0d1520",
        border: "#1F2937",

        neon: "#00F0FF",
        purple: "#7C3AED",

        danger: "#FF3B81",
        success: "#00FFA3",
        warn: "#FFB84D",

        text: "#E5E7EB",
        muted: "#9CA3AF",

        "neon-soft": "rgba(0,240,255,0.1)",
        "neon-border": "rgba(0,240,255,0.2)",
        "glass": "rgba(17,24,39,0.8)",
      },

       fontFamily: {
        sora: ["Sora"],
        orbitron: ["Orbitron"],
        mono: ["JetBrainsMono"],
      },

      borderRadius: {
        xl2: "18px",
        xl3: "24px",
        phone: "50px",
      },

      boxShadow: {
        neon: "0 0 12px rgba(0,240,255,0.5)",
        "neon-soft": "0 0 30px rgba(0,240,255,0.2)",
        card: "0 10px 30px rgba(0,0,0,0.6)",
      },

      letterSpacing: {
        wide2: "0.5px",
        wide3: "1px",
        wide4: "2px",
      },
      
      fontSize: {
        xxs: "9px",
        xs2: "10px",
      },
    },
  },
  plugins: [],
};
