/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#E1F5EE",
          100: "#9FE1CB",
          400: "#1D9E75",
          600: "#0F6E56",
          800: "#085041",
          900: "#04342C",
        },
        amber: { 400: "#EF9F27", 600: "#BA7517" },
        cream: { 50: "#FAFAF8", 100: "#F5F4F0" },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "pulse-line": {
          "0%, 100%": { opacity: "0.4", transform: "scaleX(0.2)" },
          "50%": { opacity: "1", transform: "scaleX(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "thinking-glow": {
          "0%, 100%": {
            opacity: "0.75",
            filter: "drop-shadow(0 0 6px rgba(15, 110, 86, 0.45))",
          },
          "50%": {
            opacity: "1",
            filter: "drop-shadow(0 0 14px rgba(239, 159, 39, 0.55))",
          },
        },
      },
      animation: {
        "pulse-line": "pulse-line 1.2s ease-in-out infinite",
        "fade-up": "fade-up 0.35s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
        "thinking-glow": "thinking-glow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
