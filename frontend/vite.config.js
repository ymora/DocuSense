import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173, // Le port du frontend (Vite)
    proxy: {
      "/api": {
        target: "http://localhost:5000", // ou http://localhost:8000 selon ton backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
