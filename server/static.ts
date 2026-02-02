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
  app.get("*", (req, res) => {
    // Only serve HTML for non-API, non-healthcheck routes
    // API routes should have been matched already
    if (!req.path.startsWith("/api") && req.path !== "/health") {
      res.sendFile(path.resolve(distPath, "index.html"));
    } else {
      // This shouldn't happen if routes are registered correctly, but just in case
      res.status(404).json({ error: "Not found" });
    }
  });
}
