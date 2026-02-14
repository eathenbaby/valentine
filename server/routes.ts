import type { Express } from "express";
import { createServer } from "http";
import { serveStatic } from "./static";
import { initializeDatabase } from "./db";
import { MigrationRunner } from "./migrationRunner";
import session from "express-session";
import passport from "./services/auth";

// Import new route handlers
import confessionRoutes from "./routes/confessions";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import paymentRoutes from "./routes/payments";
import instagramRoutes from "./routes/instagram";
import bouquetRoutes from "./routes/bouquetsNew";
import v4ultRoutes from "./routes/v4ultRoutes";

export async function registerRoutes(
  httpServer: any,
  app: Express
): Promise<any> {

  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Setup passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Healthcheck endpoint - responds immediately, no DB required
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register new API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/confessions', confessionRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/instagram', instagramRoutes);
  app.use('/api/bouquets', bouquetRoutes);
  app.use('/v4ult', v4ultRoutes);

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

  return httpServer;
}
