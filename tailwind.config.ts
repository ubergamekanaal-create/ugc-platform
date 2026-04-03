import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "rgb(var(--accent-secondary) / <alpha-value>)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(7, 107, 210, 0.18), 0 30px 80px rgba(7, 107, 210, 0.22)",
        panel: "0 40px 120px rgba(2, 6, 23, 0.42)",
      },
      keyframes: {
        growBar: {
          "0%": { height: "0%" },
          "100%": { height: "var(--target-height)" },
        },
      },
      animation: {
        growBar: "growBar 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
