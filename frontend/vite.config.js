import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In `npm run dev`, REST calls go to /api on the dev server, which forwards them to the
// deployed API Gateway. The browser only ever talks to its own origin, so CORS never
// gets in the way, from localhost or from your phone on the same Wi-Fi (npm run dev:phone).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
