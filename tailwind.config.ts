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
        "oil-drop": "oil-drop 950ms cubic-bezier(0.4, 0, 0.6, 1) forwards",
        "oil-splash": "oil-splash 400ms ease-out forwards",
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
        // A single blob of oil falling from the spout to past the bottom of
        // the bottle area. Stretches vertically as it falls (gravity look)
        // and squashes/fades at the bottom.
        "oil-drop": {
          "0%":   { transform: "translate(-50%, 0) scaleX(0.55) scaleY(1.3)", opacity: "0" },
          "10%":  { transform: "translate(-50%, 24px) scaleX(0.55) scaleY(1.4)", opacity: "1" },
          "70%":  { transform: "translate(-50%, 280px) scaleX(0.85) scaleY(1.1)", opacity: "1" },
          "100%": { transform: "translate(-50%, 420px) scaleX(1.4) scaleY(0.55)", opacity: "0" },
        },
        // A small ring/halo at the spout the moment a tap lands.
        "oil-splash": {
          "0%":   { transform: "translate(-50%, -50%) scale(0.4)", opacity: "0.9" },
          "100%": { transform: "translate(-50%, -50%) scale(2.4)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
