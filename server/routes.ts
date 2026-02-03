import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerV4ultRoutes } from "./v4ultRoutes";

// Basic input sanitization - trim and limit length
// React automatically escapes HTML, so we just need to validate and trim
function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input.trim().slice(0, maxLength);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Healthcheck endpoint - responds immediately, no DB required
  // Railway can use either "/health" or "/" (served by static files) for healthchecks
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

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

  // V4ULT-specific API surface
  await registerV4ultRoutes(httpServer, app);

  return httpServer;
}
