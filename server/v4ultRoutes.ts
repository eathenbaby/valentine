import type { Express } from "express";
import type { Server } from "http";
import { db } from "./db";
import {
  profiles,
  vaultConfessions,
  analytics,
  type InsertVaultConfession,
} from "@shared/schema";
import { revealSessions } from "@shared/schema";
import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { validateName } from "./lib/nameValidator";
import { checkToxicity } from "./lib/profanityFilter";
import { getUserById } from "./lib/supabaseAdmin";

const ADMIN_TOKEN = process.env.V4ULT_ADMIN_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Discord or Telegram webhook
const paymentCooldowns: Record<string, number> = {}; // IP -> timestamp
const COOLDOWN_MS = 5000; // 5 second cooldown per IP

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
  // Skip if no database configured
  if (!db) {
    console.log("[V4ULT] No database configured. V4ULT routes disabled.");
    return;
  }
  // Create / upsert profile + insert vault confession
  app.post("/api/v4ult/confessions", async (req, res) => {
    try {
      let {
        supabaseUserId,
        fullName,
        avatarUrl,
        vibe,
        shadowName,
        targetCrushName,
        body,
        department,
      } = req.body as {
        supabaseUserId?: string;
        fullName?: string;
        avatarUrl?: string | null;
        vibe?: string;
        shadowName?: string;
        targetCrushName?: string;
        body?: string;
        department?: string | null;
      };

      // Validate required fields
      if (!supabaseUserId || !fullName || !vibe || !shadowName || !body || !targetCrushName) {
        return res.status(400).json({
          message: "Missing required fields. Need: supabaseUserId, fullName, vibe, shadowName, targetCrushName, body"
        });
      }

      // Server-side verification: ensure the supabase user id maps to a real OAuth user
      const verifiedUser = await getUserById(supabaseUserId as string);
      if (!verifiedUser) {
        console.warn("[V4ULT] Supabase service key not present or user not found; rejecting anonymous submission");
        return res.status(401).json({ message: "User not verified. Ensure server has SUPABASE_SERVICE_ROLE_KEY configured." });
      }

      // Prefer the authoritative name from Supabase admin if available
      const authoritativeName = (verifiedUser as any)?.user_metadata?.full_name || (verifiedUser as any)?.email;
      if (authoritativeName && authoritativeName !== fullName) {
        // overwrite fullName with verified value to prevent spoofing
        fullName = authoritativeName;
      }
      const authoritativeSocial =
        (verifiedUser as any)?.user_metadata?.profile_url ||
        (verifiedUser as any)?.identities?.[0]?.identity_data?.url ||
        null;

      // ===== VALIDATION LAYER =====

      // 1. Validate sender's real name (entropy checks)
      const nameValidation = validateName(fullName);
      if (!nameValidation.valid) {
        return res.status(400).json({
          message: `Invalid name: ${nameValidation.reason}`
        });
      }

      // 2. Validate crush name (entropy checks)
      const crushNameValidation = validateName(targetCrushName);
      if (!crushNameValidation.valid) {
        return res.status(400).json({
          message: `Invalid crush name: ${crushNameValidation.reason}`
        });
      }

      // 3. Check confession for toxicity (Perspective API)
      const toxicityResult = await checkToxicity(body);
      if (toxicityResult.toxic) {
        return res.status(400).json({
          message: `Your confession contains inappropriate content. Please revise and try again.`,
          toxicityScore: toxicityResult.toxicityScore,
        });
      }

      // ===== PROFILE SETUP =====

      // Ensure profile exists or update
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, supabaseUserId as any));

      if (!existingProfile) {
        await db.insert(profiles).values({
          id: supabaseUserId as any,
          fullName,
          avatarUrl: avatarUrl ?? null,
          socialLink: authoritativeSocial ?? null,
        });
      }

      // ===== GENERATE SHORT ID =====

      let shortId = generateShortId();
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

      // ===== CREATE CONFESSION =====

      const insert: InsertVaultConfession = {
        shortId,
        authorId: supabaseUserId as any,
        senderRealName: fullName,
        targetCrushName,
        vibe,
        shadowName,
        body,
        department: department ?? null,
        validationScore: nameValidation.validationScore,
        toxicityScore: toxicityResult.toxicityScore,
        toxicityFlagged: toxicityResult.toxic,
        status: "pending", // Admin must approve before posting
      };

      const [created] = await db
        .insert(vaultConfessions)
        .values(insert)
        .returning();

      // ===== LOG ANALYTICS =====

      await db.insert(analytics).values({
        eventName: "v4ult_confession_created",
        metadata: JSON.stringify({
          shortId: created.shortId,
          department,
          toxicityScore: toxicityResult.toxicityScore,
        }),
      });

      return res.status(201).json({
        id: created.id,
        shortId: created.shortId,
        shadowName: created.shadowName,
        message: "Confession submitted successfully! Admin will review and post soon.",
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
          senderRealName: vaultConfessions.senderRealName,
          targetCrushName: vaultConfessions.targetCrushName,
          vibe: vaultConfessions.vibe,
          shadowName: vaultConfessions.shadowName,
          body: vaultConfessions.body,
          status: vaultConfessions.status,
          viewCount: vaultConfessions.viewCount,
          paymentStatus: vaultConfessions.paymentStatus,
          paymentRef: vaultConfessions.paymentRef,
          revealCount: vaultConfessions.revealCount,
          validationScore: vaultConfessions.validationScore,
          toxicityScore: vaultConfessions.toxicityScore,
          toxicityFlagged: vaultConfessions.toxicityFlagged,
          department: vaultConfessions.department,
          createdAt: vaultConfessions.createdAt,
        })
        .from(vaultConfessions)
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
          senderRealName: vaultConfessions.senderRealName,
          targetCrushName: vaultConfessions.targetCrushName,
          vibe: vaultConfessions.vibe,
          shadowName: vaultConfessions.shadowName,
          body: vaultConfessions.body,
          status: vaultConfessions.status,
          viewCount: vaultConfessions.viewCount,
          toxicityScore: vaultConfessions.toxicityScore,
          department: vaultConfessions.department,
          createdAt: vaultConfessions.createdAt,
        })
        .from(vaultConfessions)
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

  // Admin update confession status
  app.patch("/api/v4ult/admin/confessions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };

      if (!status || !["pending", "approved", "posted", "revealed", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updateData: any = { status };
      if (status === "posted") {
        updateData.postedAt = new Date();
      }

      const [updated] = await db
        .update(vaultConfessions)
        .set(updateData)
        .where(eq(vaultConfessions.id, id as any))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Confession not found" });
      }

      // Log the action
      await db.insert(analytics).values({
        eventName: "v4ult_status_updated",
        metadata: JSON.stringify({ confessionId: id, newStatus: status }),
      });

      res.json({ message: "Status updated", confession: updated });
    } catch (error) {
      console.error("[V4ULT] Failed to update confession status", error);
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
          senderRealName: vaultConfessions.senderRealName,
          body: vaultConfessions.body,
          paymentStatus: vaultConfessions.paymentStatus,
          paymentRef: vaultConfessions.paymentRef,
          revealCount: vaultConfessions.revealCount,
          avatarUrl: profiles.avatarUrl,
          senderSocial: profiles.socialLink,
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

      // If the confession hasn't been paid for, return only the anonymous text and 402
      if (existing.paymentStatus !== "paid") {
        return res.status(402).json({
          shortId: existing.shortId,
          vibe: existing.vibe,
          viewCount: (existing.viewCount ?? 0) + 1,
          avatarUrl: existing.avatarUrl,
          message: existing.body ?? "Payment required to reveal identity",
          identity: "LOCKED",
          price: 99,
        });
      }

      // Paid: reveal authoritative identity and social link (only these fields)
      res.json({
        shortId: existing.shortId,
        vibe: existing.vibe,
        viewCount: (existing.viewCount ?? 0) + 1,
        avatarUrl: existing.avatarUrl,
        identity: existing.senderRealName,
        socialLink: existing.senderSocial ?? null,
      });
    } catch (error) {
      console.error("[V4ULT] Failed to handle reveal preview", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Public: submit payment proof (UPI/Txn ref) for manual verification
  app.post("/api/v4ult/reveal/:shortId/submit-payment", async (req, res) => {
    try {
      const shortId = req.params.shortId;
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const { paymentRef, viewerEmail, paymentProvider, amount } = req.body as {
        paymentRef?: string;
        viewerEmail?: string;
        paymentProvider?: string;
        amount?: number;
      };

      if (!paymentRef) {
        return res.status(400).json({ message: "paymentRef is required" });
      }

      // Ensure confession exists
      const [conf] = await db
        .select({ id: vaultConfessions.id, shortId: vaultConfessions.shortId, senderRealName: vaultConfessions.senderRealName, targetCrushName: vaultConfessions.targetCrushName })
        .from(vaultConfessions)
        .where(eq(vaultConfessions.shortId, shortId));

      if (!conf) return res.status(404).json({ message: "Confession not found" });

      // Rate limit: prevent spam from same IP
      const now = Date.now();
      const lastSubmit = paymentCooldowns[clientIp] || 0;
      if (now - lastSubmit < COOLDOWN_MS) {
        return res.status(429).json({ message: "Too many requests. Please wait a moment." });
      }
      paymentCooldowns[clientIp] = now;

      const [session] = await db
        .insert(revealSessions)
        .values({
          confessionShortId: shortId,
          viewerEmail: viewerEmail ?? null,
          paymentProvider: paymentProvider ?? "upi",
          paymentStatus: "pending",
          paymentId: paymentRef,
          amount: amount ?? 99,
        })
        .returning();

      await db.insert(analytics).values({
        eventName: "v4ult_payment_submitted",
        metadata: JSON.stringify({ shortId, paymentRef, viewerEmail }),
      });

      // Send webhook notification
      if (WEBHOOK_URL) {
        const adminUrl = process.env.ADMIN_URL || 'https://yoursite.com/admin/v4ult';
        const payload = {
          content: `💰 New Payment Submission!\nAmount: ₹${amount ?? 99}\nRef: ${paymentRef}\nConfession: ${conf.senderRealName} → ${conf.targetCrushName}\nDashboard: ${adminUrl}`,
        };
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('[V4ULT] Webhook failed:', err));
      }

      return res.status(201).json({ message: "Payment submitted", sessionId: session.id });
    } catch (error) {
      console.error("[V4ULT] Failed to submit payment proof", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Admin action: mark confession as paid (manual or webhook backed)
  app.post("/api/v4ult/admin/confessions/:id/mark-paid", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentRef } = req.body as { paymentRef?: string };

      const [existing] = await db
        .select({ id: vaultConfessions.id, paymentStatus: vaultConfessions.paymentStatus, revealCount: vaultConfessions.revealCount })
        .from(vaultConfessions)
        .where(eq(vaultConfessions.id, id as any));

      if (!existing) {
        return res.status(404).json({ message: "Confession not found" });
      }

      const [updated] = await db
        .update(vaultConfessions)
        .set({ paymentStatus: "paid", paymentRef: paymentRef ?? null, revealCount: (existing.revealCount ?? 0) + 1 })
        .where(eq(vaultConfessions.id, id as any))
        .returning();

      await db.insert(analytics).values({ eventName: "v4ult_marked_paid", metadata: JSON.stringify({ confessionId: id, paymentRef }) });

      res.json({ message: "Marked as paid", confession: updated });
    } catch (error) {
      console.error("[V4ULT] Failed to mark confession paid", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Validation endpoint: Check if a name is valid (for real-time feedback in UI)
  app.post("/api/v4ult/validate-name", async (req, res) => {
    try {
      const { name } = req.body as { name?: string };

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const result = validateName(name);
      return res.json(result);
    } catch (error) {
      console.error("[V4ULT] Failed to validate name", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Validation endpoint: Check if confession is toxic
  app.post("/api/v4ult/validate-confession", async (req, res) => {
    try {
      const { body } = req.body as { body?: string };

      if (!body) {
        return res.status(400).json({ message: "Confession body is required" });
      }

      const result = await checkToxicity(body);
      return res.json(result);
    } catch (error) {
      console.error("[V4ULT] Failed to validate confession", error);
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

