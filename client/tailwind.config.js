/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Sophisticated indigo with subtle violet — feels academic and modern
        brand: {
          50: "#f5f6ff",
          100: "#ebedff",
          200: "#d4d8ff",
          300: "#b1b8fc",
          400: "#8a90f6",
          500: "#6c6def",
          600: "#5a4ee2",
          700: "#4d3fc8",
          800: "#3f35a1",
          900: "#363280",
          950: "#211e4a",
        },
        // Warm grays instead of cold slate — softer feel
        ink: {
          50: "#fafaf9",
          100: "#f4f4f3",
          200: "#e7e6e4",
          300: "#d2d0cc",
          400: "#a4a19a",
          500: "#76736b",
          600: "#5d5a52",
          700: "#46443e",
          800: "#2c2a26",
          900: "#1c1b18",
          950: "#0f0e0c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
      },
      boxShadow: {
        // Layered, warm shadows for depth without heaviness
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 8px -4px rgb(0 0 0 / 0.06)",
        elevated:
          "0 2px 4px -1px rgb(0 0 0 / 0.05), 0 12px 24px -8px rgb(0 0 0 / 0.08), 0 24px 48px -16px rgb(0 0 0 / 0.10)",
        glow: "0 0 0 1px rgb(90 78 226 / 0.20), 0 8px 24px -8px rgb(90 78 226 / 0.32)",
      },
      backgroundImage: {
        "grid-pattern":
          "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.04) 1px, transparent 0)",
        "dot-pattern":
          "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.08) 1px, transparent 0)",
        "brand-mesh":
          "radial-gradient(at 0% 0%, rgb(90 78 226 / 0.10) 0px, transparent 50%), radial-gradient(at 100% 100%, rgb(108 109 239 / 0.08) 0px, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 220ms ease-out",
        "slide-down": "slideDown 220ms ease-out",
        "slide-up": "slideUp 220ms ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: 0, transform: "translateY(-8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
