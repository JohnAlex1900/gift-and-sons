import "./env.js";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "").toLowerCase();
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
    const vercelOrigins = [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
        process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : "",
    ].filter(Boolean);
    const allOrigins = [...staticOrigins, ...configuredOrigins, ...vercelOrigins]
        .map(normalizeOrigin);
    return new Set(allOrigins);
};
const allowedOrigins = getAllowedOrigins();
const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
        return true;
    }
    // Vercel preview/prod domains
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)) {
        return true;
    }
    // Localhost variants for local testing.
    if (/^https?:\/\/localhost(?::\d+)?$/i.test(normalizedOrigin)) {
        return true;
    }
    if (/^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(normalizedOrigin)) {
        return true;
    }
    return false;
};
const configureMiddleware = (app) => {
    app.use((req, res, next) => {
        console.log("Incoming request from origin:", req.headers.origin);
        next();
    });
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }
            // Do not throw from CORS callback; returning false avoids turning CORS issues into 500s.
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(null, false);
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
        optionsSuccessStatus: 204,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path;
        let capturedJsonResponse;
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
const configureErrorHandler = (app) => {
    app.use((err, req, res, next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Error:", message);
        res.status(status).json({ message });
    });
};
let appPromise = null;
export const getServerApp = async () => {
    if (!appPromise) {
        appPromise = (async () => {
            const app = express();
            configureMiddleware(app);
            try {
                await registerRoutes(app);
            }
            catch (err) {
                console.error("Error during server setup:", err);
                throw err;
            }
            configureErrorHandler(app);
            return app;
        })();
        appPromise.catch(() => {
            // Allow a later invocation to retry app initialization.
            appPromise = null;
        });
    }
    return appPromise;
};
