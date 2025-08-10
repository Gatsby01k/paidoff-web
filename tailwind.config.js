/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFEB00",
          black: "#0A0A0A"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(255,235,0,0.35)"
      }
    },
  },
  plugins: [],
}
