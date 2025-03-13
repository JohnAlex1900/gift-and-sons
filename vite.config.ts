import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE"); // ✅ Load environment variables

  const plugins = [react(), runtimeErrorOverlay(), themePlugin()];

  // Conditionally import the Replit plugin
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    import("@replit/vite-plugin-cartographer").then((m) => {
      plugins.push(m.cartographer()); // ✅ Push plugin dynamically
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
      outDir: path.resolve(__dirname, "dist", "public"),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": env.VITE_API_URL || "http://localhost:5000", // ✅ Uses loaded env variable
      },
    },
  };
});
