import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        castrol: {
          green: "#00984A",
          red: "#E2231A",
        },
        gold: {
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFC107",
          600: "#D4A017",
          700: "#A8800B",
          800: "#6E5300",
          900: "#3B2C00",
        },
        f6: "#F26C2A",
      },
      fontFamily: {
        sans: ["var(--font-source-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "bottle-tilt": "bottle-tilt 0.4s ease-out",
        "oil-pour": "oil-pour 1s ease-in-out infinite",
        "burst": "burst 0.6s ease-out forwards",
        "reveal-scale": "reveal-scale 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "oil-flow": "oil-flow 0.4s linear infinite",
        "oil-splash-pulse": "oil-splash-pulse 0.5s ease-in-out infinite",
      },
      keyframes: {
        "bottle-tilt": {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(-22deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "oil-pour": {
          "0%, 100%": { opacity: "0.7", transform: "scaleY(0.95)" },
          "50%": { opacity: "1", transform: "scaleY(1.05)" },
        },
        "burst": {
          "0%": { transform: "scale(0.4)", opacity: "1" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "reveal-scale": {
          "0%": { transform: "scale(0.2)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        // Continuous downward flow — scrolls the repeating gradient by one
        // tile (36px) so the oil stream looks like it's pouring.
        "oil-flow": {
          "0%": { backgroundPositionY: "0px" },
          "100%": { backgroundPositionY: "36px" },
        },
        // The pool where the stream lands, gently pulsing while pouring.
        "oil-splash-pulse": {
          "0%, 100%": { transform: "translateX(-50%) scale(0.85)", opacity: "0.5" },
          "50%": { transform: "translateX(-50%) scale(1.15)", opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
