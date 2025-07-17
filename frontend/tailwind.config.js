/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // si tu as un dossier src
    "./frontend/**/*.{js,jsx,ts,tsx}", // adapte selon ton arborescence
    "./public/index.html" // si tu as un html statique
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}