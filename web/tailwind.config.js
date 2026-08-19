/**
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fondo: "rgb(var(--c-fondo) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        soft: "rgb(var(--c-soft) / <alpha-value>)",
        tinta: "rgb(var(--c-tinta) / <alpha-value>)",
        subtinta: "rgb(var(--c-subtinta) / <alpha-value>)",
        acc: {
          DEFAULT: "rgb(var(--c-acc) / <alpha-value>)",
          fuerte: "rgb(var(--c-acc-fuerte) / <alpha-value>)",
          suave: "rgb(var(--c-acc-suave) / <alpha-value>)",
        },
        borde: "rgb(var(--c-borde) / <alpha-value>)",
        onacc: "rgb(var(--c-onacc) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "pop": "pop 0.3s cubic-bezier(.175,.885,.32,1.275)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
