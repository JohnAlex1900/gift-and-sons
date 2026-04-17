import { getServerApp } from "../server/dist/app.js";

const setCorsHeaders = (req, res) => {
  const origin = req.headers?.origin;
  const allowOrigin = typeof origin === "string" ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-uploadthing-version, x-uploadthing-package, x-uploadthing-filename"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    // If Vercel rewrites /api/<nested> to this function with ?path=<nested>,
    // reconstruct the original API URL so Express route matching works.
    const rewrittenPath = req.query?.path;
    const normalizedRewrittenPath = Array.isArray(rewrittenPath)
      ? rewrittenPath[0]
      : rewrittenPath;

    if (typeof normalizedRewrittenPath === "string" && normalizedRewrittenPath.length > 0) {
      const originalUrl = new URL(req.url || "/", "http://localhost");
      originalUrl.searchParams.delete("path");
      const remainingQuery = originalUrl.searchParams.toString();
      const cleanPath = normalizedRewrittenPath.startsWith("/")
        ? normalizedRewrittenPath.slice(1)
        : normalizedRewrittenPath;
      req.url = `/api/${cleanPath}${remainingQuery ? `?${remainingQuery}` : ""}`;
    }

    // Vercel catch-all functions can forward URL as /properties/... instead of /api/properties/...
    // while our Express routes are mounted under /api.
    if (typeof req.url === "string" && !req.url.startsWith("/api")) {
      const normalizedPath = req.url.startsWith("/") ? req.url : `/${req.url}`;
      req.url = `/api${normalizedPath}`;
    }

    const app = await getServerApp();
    return app(req, res);
  } catch (error) {
    console.error("Serverless startup failure:", error);
    res.status(500).json({ message: "Server startup failure" });
  }
}
