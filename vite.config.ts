import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Deploy = VPS Meraki (carrossel.merakidigital.cloud) atrás do Caddy, na raiz do domínio.
export default defineConfig({
  base: "/",
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
