import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeDatabase } from "./db";
import { MigrationRunner } from "./migrationRunner";

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register routes first so healthcheck works immediately
  await registerRoutes(httpServer, app);
  
  // Initialize database and run migrations
  try {
    console.log("[init] Initializing database...");
    await initializeDatabase();
    
    // Check and run migrations if needed
    const migrationsNeeded = await MigrationRunner.checkMigrations();
    if (migrationsNeeded) {
      console.log("[init] Running database migrations...");
      await MigrationRunner.runMigrations();
      console.log("[init] Database migrations completed");
    } else {
      console.log("[init] Database is up to date");
    }
  } catch (error) {
    console.error("[init] Database initialization failed:", error);
    // Don't crash - let the server start but log the error clearly
    // The first request will fail and show the real error
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Setup vite in development after other routes to avoid catch-all conflicts
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Serve on PORT env var (defaults to 5000)
  const port = parseInt(process.env.PORT || "5000", 10);

  // On Windows Node does not support `reusePort` on sockets and attempting to
  // use it causes ENOTSUP. Only set reusePort when the platform supports it.
  const listenOptions: any = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  // Start server immediately - don't wait for DB init
  httpServer.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    console.log("[server] Server is ready and listening");
    console.log(`[server] Healthcheck available at http://0.0.0.0:${port}/health`);
  });
})();
