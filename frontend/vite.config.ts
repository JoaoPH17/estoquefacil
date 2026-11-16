import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },
    server: {
      port: 5173,
      // Em desenvolvimento, as chamadas para /api vão para o backend local.
      // Assim o frontend e a API parecem estar no mesmo endereço e não há problema de CORS.
      proxy: {
        "/api": env.VITE_API_PROXY || "http://localhost:8000",
      },
    },
  };
});
