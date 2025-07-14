// frontend/tailwind.config.js
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D3557",         // Bleu foncé professionnel
        secondary: "#457B9D",       // Bleu doux
        accent: "#E63946",          // Rouge vif pour alertes ou actions
        neutral: "#F1FAEE",         // Fond clair agréable
        dark: "#343A40",            // Texte foncé
        success: "#38B000",         // Pour feedback positifs
        warning: "#FFB703",         // Pour alertes neutres
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.08)",
      },
      spacing: {
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
    },
  },
  plugins: [],
}
