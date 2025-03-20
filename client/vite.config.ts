import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

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

  const isDevelopment = mode === "development";
  const backendUrl = isDevelopment
    ? "http://localhost:5000"
    : "https://gift-and-sons.onrender.com";

  console.log("Backend URL:", backendUrl);

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    root: __dirname,
    server: {
      fs: {
        strict: true,
      },
      historyApiFallback: true, // 🔥 Ensures routing works locally!
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(backendUrl),
    },
  };
});
