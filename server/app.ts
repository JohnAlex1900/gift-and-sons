import "./env";

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const getAllowedOrigins = () => {
  const staticOrigins = [
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://giftandsonsinternational.com",
    "https://www.giftandsonsinternational.com",
  ];

  const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...staticOrigins, ...configuredOrigins]);
};

const allowedOrigins = getAllowedOrigins();

const isAllowedOrigin = (origin: string) => {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    return true;
  }

  return false;
};

const configureMiddleware = (app: express.Express) => {
  app.use((req, res, next) => {
    console.log("Incoming request from origin:", req.headers.origin);
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-uploadthing-version",
        "x-uploadthing-package",
        "x-uploadthing-filename",
      ],
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined;

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
          logLine = logLine.slice(0, 79) + "...";
        }
        console.log(logLine);
      }
    });

    next();
  });
};

const configureErrorHandler = (app: express.Express) => {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", message);
    res.status(status).json({ message });
  });
};

let appPromise: Promise<express.Express> | null = null;

export const getServerApp = async () => {
  if (!appPromise) {
    appPromise = (async () => {
      const app = express();
      configureMiddleware(app);

      try {
        await registerRoutes(app);
      } catch (err) {
        console.error("Error during server setup:", err);
        throw err;
      }

      configureErrorHandler(app);
      return app;
    })();
  }

  return appPromise;
};
