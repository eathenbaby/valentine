import type { Express } from "express";
import type { Server } from "http";
import { db } from "./db";
import {
  profiles,
  vaultConfessions,
  analytics,
  type InsertVaultConfession,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";

const ADMIN_TOKEN = process.env.V4ULT_ADMIN_TOKEN;

function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_TOKEN) {
    return res
      .status(500)
      .json({ message: "Admin token not configured on server" });
  }
  const token = req.header("x-v4ult-admin-token");
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

function generateShortId(): string {
  // STC-XYZ style where XYZ is 3–4 random base36 chars
  return `STC-${nanoid(4).toUpperCase()}`;
}

export async function registerV4ultRoutes(
  _httpServer: Server,
  app: Express
): Promise<void> {
  // Create / upsert profile + insert vault confession
  app.post("/api/v4ult/confessions", async (req, res) => {
    try {
      const {
        supabaseUserId,
        fullName,
        avatarUrl,
        vibe,
        shadowName,
        body,
        department,
      } = req.body as {
        supabaseUserId?: string;
        fullName?: string;
        avatarUrl?: string | null;
        vibe?: string;
        shadowName?: string;
        body?: string;
        department?: string | null;
      };

      if (!supabaseUserId || !fullName || !vibe || !shadowName || !body) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Ensure profile exists
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, supabaseUserId as any));

      if (!existingProfile) {
        await db.insert(profiles).values({
          id: supabaseUserId as any,
          fullName,
          avatarUrl: avatarUrl ?? null,
        });
      }

      let shortId = generateShortId();
      // Very small loop to avoid collisions
      // (real solution: unique constraint + retry on error)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db
          .select()
          .from(vaultConfessions)
          .where(eq(vaultConfessions.shortId, shortId));
        if (existing.length === 0) break;
        shortId = generateShortId();
        attempts += 1;
      }

      const insert: InsertVaultConfession = {
        shortId,
        authorId: supabaseUserId as any,
        vibe,
        shadowName,
        body,
        department: department ?? null,
      };

      const [created] = await db
        .insert(vaultConfessions)
        .values(insert)
        .returning();

      return res.status(201).json({
        id: created.id,
        shortId: created.shortId,
        vibe: created.vibe,
        shadowName: created.shadowName,
      });
    } catch (error) {
      console.error("[V4ULT] Failed to create confession", error);
      return res.status(500).json({ message: "Internal error" });
    }
  });

  // Admin feed: joined view of profiles + vault_confessions
  app.get("/api/v4ult/admin/confessions", requireAdmin, async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: vaultConfessions.id,
          shortId: vaultConfessions.shortId,
          vibe: vaultConfessions.vibe,
          shadowName: vaultConfessions.shadowName,
          status: vaultConfessions.status,
          viewCount: vaultConfessions.viewCount,
          createdAt: vaultConfessions.createdAt,
          department: vaultConfessions.department,
          fullName: profiles.fullName,
        })
        .from(vaultConfessions)
        .leftJoin(profiles, eq(vaultConfessions.authorId, profiles.id))
        .orderBy(desc(vaultConfessions.viewCount), desc(vaultConfessions.createdAt));

      res.json(rows);
    } catch (error) {
      console.error("[V4ULT] Failed to load admin feed", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Admin single confession (for export layout)
  app.get("/api/v4ult/admin/confessions/:shortId", requireAdmin, async (req, res) => {
    try {
      const shortId = req.params.shortId;
      const [row] = await db
        .select({
          id: vaultConfessions.id,
          shortId: vaultConfessions.shortId,
          vibe: vaultConfessions.vibe,
          shadowName: vaultConfessions.shadowName,
          status: vaultConfessions.status,
          viewCount: vaultConfessions.viewCount,
          createdAt: vaultConfessions.createdAt,
          body: vaultConfessions.body,
          fullName: profiles.fullName,
        })
        .from(vaultConfessions)
        .leftJoin(profiles, eq(vaultConfessions.authorId, profiles.id))
        .where(eq(vaultConfessions.shortId, shortId));

      if (!row) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json(row);
    } catch (error) {
      console.error("[V4ULT] Failed to load admin confession", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Public reveal preview + view_count tracking
  app.get("/api/v4ult/reveal/:shortId", async (req, res) => {
    try {
      const shortId = req.params.shortId;

      const [existing] = await db
        .select({
          id: vaultConfessions.id,
          shortId: vaultConfessions.shortId,
          vibe: vaultConfessions.vibe,
          viewCount: vaultConfessions.viewCount,
          avatarUrl: profiles.avatarUrl,
        })
        .from(vaultConfessions)
        .leftJoin(profiles, eq(vaultConfessions.authorId, profiles.id))
        .where(eq(vaultConfessions.shortId, shortId));

      if (!existing) {
        return res.status(404).json({ message: "Not found" });
      }

      // Increment view_count, update lastTrackedAt and log analytics
      await db
        .update(vaultConfessions)
        .set({
          viewCount: (existing.viewCount ?? 0) + 1,
          lastTrackedAt: new Date(),
        })
        .where(eq(vaultConfessions.id, existing.id));

      await db.insert(analytics).values({
        eventName: "v4ult_reveal_search",
        metadata: JSON.stringify({ shortId }),
      });

      res.json({
        shortId: existing.shortId,
        vibe: existing.vibe,
        viewCount: (existing.viewCount ?? 0) + 1,
        avatarUrl: existing.avatarUrl,
      });
    } catch (error) {
      console.error("[V4ULT] Failed to handle reveal preview", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Sender dashboard - list own confessions
  app.get("/api/v4ult/my-confessions", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      if (!authorId) {
        return res.status(400).json({ message: "authorId is required" });
      }

      const rows = await db
        .select({
          id: vaultConfessions.id,
          shortId: vaultConfessions.shortId,
          vibe: vaultConfessions.vibe,
          shadowName: vaultConfessions.shadowName,
          status: vaultConfessions.status,
          viewCount: vaultConfessions.viewCount,
          department: vaultConfessions.department,
          createdAt: vaultConfessions.createdAt,
          lastTrackedAt: vaultConfessions.lastTrackedAt,
        })
        .from(vaultConfessions)
        .where(eq(vaultConfessions.authorId, authorId as any))
        .orderBy(desc(vaultConfessions.createdAt));

      res.json(rows);
    } catch (error) {
      console.error("[V4ULT] Failed to load my-vault feed", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Global stats ticker
  app.get("/api/v4ult/stats", async (_req, res) => {
    try {
      const [{ count }] = await db.execute<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM vault_confessions`
      );

      const [lastReveal] = await db
        .select({
          createdAt: analytics.createdAt,
        })
        .from(analytics)
        .where(eq(analytics.eventName, "v4ult_reveal_search"))
        .orderBy(desc(analytics.createdAt))
        .limit(1);

      const totalSecrets = parseInt(count ?? "0", 10);
      const activeTrackers = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

      res.json({
        totalSecrets,
        activeTrackers,
        lastRevealAt: lastReveal?.createdAt ?? null,
      });
    } catch (error) {
      console.error("[V4ULT] Failed to load stats", error);
      res.status(500).json({ message: "Internal error" });
    }
  });
}

