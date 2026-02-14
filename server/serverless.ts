// Serverless entry point for Vercel
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeDatabase } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Initialize once
let initialized = false;

async function initialize() {
  if (initialized) return;
  
  console.log("[serverless] Initializing...");
  
  // Register routes
  await registerRoutes(httpServer, app);
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log("[serverless] Database initialized");
  } catch (error) {
    console.error("[serverless] Database initialization failed:", error);
  }

  // Error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  // Serve static files
  serveStatic(app);
  
  initialized = true;
  console.log("[serverless] Initialization complete");
}

// Export handler for Vercel
export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}
