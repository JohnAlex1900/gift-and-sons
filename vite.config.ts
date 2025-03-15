import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  console.log("Current mode:", mode);
  const env = loadEnv(mode, process.cwd(), "VITE");

  const plugins = [react(), runtimeErrorOverlay(), themePlugin()];

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
    import("@replit/vite-plugin-cartographer")
      .then(({ cartographer }) => {
        plugins.push(cartographer());
      })
      .catch((error) => {
        console.warn("Failed to load @replit/vite-plugin-cartographer", error);
      });
  }

  // Determine the backend URL based on the environment
  const isDevelopment = mode === "development";
  const backendUrl = isDevelopment
    ? "http://localhost:5000" // Use local backend during development
    : "https://www.giftandsonsinternational.com"; // Use production backend in production

  console.log("Backend URL:", backendUrl);

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist", "public"), // ✅ Frontend output in a clearer location
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": {
          target: backendUrl, // Use the dynamically determined backend URL
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            console.log("Proxying request to:", backendUrl + path); // Log the proxied URL
            return path;
          },
        },
      },
    },
  };
});
