/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFE500",
          black: "#0A0A0A",
          gray: "#121212",
        },
      },
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(255,229,0,0.15), 0 0 40px rgba(255,229,0,0.12)",
        card: "0 10px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        hero:
          "radial-gradient(1200px 600px at -10% -20%, rgba(255,229,0,0.12), transparent 60%), radial-gradient(800px 400px at 120% -10%, rgba(255,229,0,0.09), transparent 60%)",
      },
    },
  },
  plugins: [],
}
