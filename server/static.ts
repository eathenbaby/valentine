import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  // This must be last, after all API routes are registered
  // Use app.use() instead of app.get() for Express 5 compatibility
  app.use((req, res, next) => {
    // Only serve HTML for non-API, non-healthcheck, non-static file routes
    // API routes and static files should have been matched already
    if (!req.path.startsWith("/api") && req.path !== "/health" && !req.path.startsWith("/assets")) {
      res.sendFile(path.resolve(distPath, "index.html"));
    } else {
      // Let Express handle 404s for unmatched routes
      next();
    }
  });
}
