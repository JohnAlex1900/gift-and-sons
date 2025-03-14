import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
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
  };
});
