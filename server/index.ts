import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "../server/.env") // Adjust if needed
    : path.resolve(__dirname, "./.env"); // For development

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Log incoming requests
app.use((req, res, next) => {
  console.log("Incoming request from origin:", req.headers.origin); // Log the request origin
  next();
});

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://localhost:3000",
      "https://giftandsonsinternational.com", // Allow requests from your production frontend
      "https://www.giftandsonsinternational.com", // Allow requests from your production frontend (with www)
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-uploadthing-version",
      "x-uploadthing-package",
      "x-uploadthing-filename",
    ],
    credentials: true, // Allow cookies/session data to be sent
  })
);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine); // Log the request details
    }
  });

  next();
});

// Register API routes
(async () => {
  try {
    await registerRoutes(app);
  } catch (err) {
    console.error("❌ Error during server setup:", err);
    process.exit(1);
  }
})();

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("❌ Error:", message);
  res.status(status).json({ message });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
