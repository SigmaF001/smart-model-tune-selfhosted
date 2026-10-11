import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const engineProxyTarget = env.VITE_ENGINE_PROXY_TARGET || "http://localhost:5173";

  const authProxyTarget = env.VITE_AUTH_PROXY_TARGET || "http://localhost:5173";

  return {
    server: {
      host: "::",
      port: 5174,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/auth": {
          target: authProxyTarget,
          changeOrigin: true,
        },
        // Forward API calls and WebSocket to the Engine backend
        "/api/v1": {
          target: engineProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/ws/": {
          target: engineProxyTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
        "/health": {
          target: engineProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/ready": {
          target: engineProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
