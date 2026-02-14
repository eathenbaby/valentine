import type { Express } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
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

// Basic input sanitization - trim and limit length
// React automatically escapes HTML, so we just need to validate and trim
function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input.trim().slice(0, maxLength);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  // API routes only - static files will handle SPA routes
  app.post(api.confessions.create.path, async (req, res) => {
    try {
      const input = api.confessions.create.input.parse(req.body);
      // Sanitize user inputs
      const sanitizedInput = {
        ...input,
        senderName: sanitizeInput(input.senderName),
        senderContact: input.senderContact ? sanitizeInput(input.senderContact) : undefined,
        intentOption: input.intentOption ? sanitizeInput(input.intentOption) : undefined,
        message: input.message ? sanitizeInput(input.message) : undefined,
      };
      const confession = await storage.createConfession(sanitizedInput);
      res.status(201).json(confession);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Public endpoint - excludes sender_name for privacy
  app.get(api.confessions.get.path, async (req, res) => {
    const confession = await storage.getConfession(req.params.id);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    // Strip sender_name from public response and ensure proper date serialization
    const { senderName, ...publicConfession } = confession;
    res.json({
      ...publicConfession,
      createdAt: publicConfession.createdAt ? new Date(publicConfession.createdAt).toISOString() : null,
    });
  });

  // Admin endpoint - includes sender_name (requires auth in production)
  app.get('/api/admin/confessions/:id', async (req, res) => {
    const confession = await storage.getConfession(req.params.id);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    // Return full confession with sender_name for admin
    res.json(confession);
  });

  app.patch(api.confessions.updateStatus.path, async (req, res) => {
    try {
      const input = z.object({ response: z.enum(['yes', 'no']) }).parse(req.body);
      const confession = await storage.updateConfessionStatus(req.params.id, input);
      if (!confession) {
        return res.status(404).json({ message: 'Confession not found' });
      }
      res.json(confession);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      throw err;
    }
  });

  app.get(api.gifts.list.path, (_req, res) => {
    const gifts = [
      { id: '1', name: 'Chocolates', price: '$15', emoji: '🍫' },
      { id: '2', name: 'Teddy Bear', price: '$25', emoji: '🧸' },
      { id: '3', name: 'Love Letter', price: '$5', emoji: '💌' },
      { id: '4', name: 'Rose Bouquet', price: '$40', emoji: '🌹' },
    ];
    res.json(gifts);
  });

  // V4ult-specific API surface
  // await registerV4ultRoutes(httpServer, app);

  return httpServer;
}
