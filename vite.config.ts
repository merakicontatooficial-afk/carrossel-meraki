import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base = nome do repo no GitHub Pages
export default defineConfig({
  base: "/carrossel-meraki/",
  plugins: [react(), tailwindcss()],
  server: {
    // em dev, /api vai pro backend Express (server/). Em produção o Caddy faz isso.
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
