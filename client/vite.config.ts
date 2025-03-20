import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ mode }) => {
  console.log("Current mode:", mode);

  // Load environment variables
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
    ? "http://localhost:5000" // Local backend for development
    : "https://gift-and-sons.onrender.com"; // Render backend for production

  console.log("Backend URL:", backendUrl);

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"), // Alias for client/src
      },
    },
    root: __dirname, // Set root to the client directory
    server: {
      fs: {
        strict: true,
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist"), // Output directory for the frontend
      emptyOutDir: true, // Clear the output directory before building
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(backendUrl), // Pass backend URL to frontend
    },
  };
});
