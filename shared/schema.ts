import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Legacy Valentine's Day confessions table.
 * Kept for backwards compatibility with the existing flow.
 */
export const confessions = pgTable("confessions", {
  id: varchar("id").primaryKey(),
  senderName: text("sender_name").notNull(), // ADMIN ONLY - never exposed to recipient
  senderContact: text("sender_contact"),
  intentOption: text("intent_option"), // PUBLIC - shown to recipient
  message: text("message"), // PUBLIC - confession text
  response: text("response").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for Stage 1: Sender info and intent selection
export const senderInfoSchema = z.object({
  senderName: z.string().min(1, "Name is required"),
  intentOption: z.string().min(1, "Please select an option"),
});

// Schema for Stage 2: Confession composition
export const confessionComposeSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

// Full confession creation schema (combines both stages)
export const insertConfessionSchema = createInsertSchema(confessions).pick({
  senderName: true,
  senderContact: true,
  intentOption: true,
  message: true,
});

// Public confession schema (excludes sender_name)
export const publicConfessionSchema = z.object({
  id: z.string(),
  intentOption: z.string().nullable(),
  message: z.string().nullable(),
  response: z.string(),
  createdAt: z.date().nullable(),
});

export type Confession = typeof confessions.$inferSelect;
export type InsertConfession = z.infer<typeof insertConfessionSchema>;
export type PublicConfession = z.infer<typeof publicConfessionSchema>;
export type SenderInfo = z.infer<typeof senderInfoSchema>;
export type ConfessionCompose = z.infer<typeof confessionComposeSchema>;

export type CreateConfessionRequest = InsertConfession;
export type UpdateConfessionStatusRequest = { response: "yes" | "no" };
export type ConfessionResponse = Confession;
export type PublicConfessionResponse = PublicConfession;

export interface GiftOption {
  id: string;
  name: string;
  price: string;
  emoji: string;
  image?: string;
}

/**
 * V4ULT: Profiles & Verification
 *
 * Each authenticated student gets a profile row tied to an auth user id.
 * In production this would align with Supabase Auth's user UUID.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * V4ULT: Confessions (social stock exchange)
 *
 * These are the "vault" submissions, distinct from the legacy confessions above.
 */
export const vaultConfessions = pgTable("vault_confessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortId: varchar("short_id", { length: 16 }).notNull().unique(), // e.g. STC-721
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),

  // REAL IDENTITY (Private - Admin only)
  senderRealName: text("sender_real_name").notNull(), // Real verified name from OAuth
  targetCrushName: text("target_crush_name").notNull(), // Who the confession is for

  // CONTENT
  vibe: text("vibe").notNull(), // Coffee, Movie, Late Night Study, The One That Got Away, Chaos Love
  department: text("department").notNull(), // Physics, Chemistry, Commerce, etc.
  shadowName: text("shadow_name").notNull(), // public-facing "Display / Shadow" name for teasing
  body: text("body").notNull(), // The actual confession message

  // VALIDATION METADATA
  validationScore: integer("validation_score").default(100), // 0-100 trust score (name entropy, toxicity, etc)
  toxicityScore: real("toxicity_score"), // 0.0-1.0 from Perspective API
  toxicityFlagged: boolean("toxicity_flagged").default(false), // Set if flagged by profanity filter

  // WORKFLOW STATUS
  status: text("status").notNull().default("pending"), // pending | approved | posted | revealed | rejected
  viewCount: integer("view_count").notNull().default(0),
  trackingCount: integer("tracking_count").notNull().default(0),
  lastTrackedAt: timestamp("last_tracked_at"),

  // METADATA
  createdAt: timestamp("created_at").defaultNow(),
  postedAt: timestamp("posted_at"),
  reviousConfessionId: varchar("previous_confession_id"), // Link to legacy confessions if migrated
});

/**
 * V4ULT: Reveal / Monetization tracking
 */
export const revealSessions = pgTable("reveal_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  confessionShortId: varchar("confession_short_id", { length: 16 })
    .notNull()
    .references(() => vaultConfessions.shortId, { onDelete: "cascade" }),

  // VIEWER IDENTITY
  viewerId: uuid("viewer_id"), // The person trying to reveal (logged in user)
  viewerEmail: text("viewer_email"), // Optional email for notifications

  // PAYMENT TRACKING
  paymentProvider: text("payment_provider").notNull(), // stripe | upi | test
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | cancelled
  paymentId: text("payment_id"), // Stripe session ID or payment reference
  amount: integer("amount"), // smallest currency unit (e.g. cents, paise)
  paymentProof: text("payment_proof"), // Screenshot or proof URL for manual verification (UPI)

  // REVEAL STATE
  revealedAt: timestamp("revealed_at"), // When identity was actually revealed

  // METADATA
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * V4ULT: Simple analytics log
 * For now we just track page/event hits in a cheap way.
 */
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventName: text("event_name").notNull(),
  metadata: text("metadata"), // JSON string; keep loose for now
  createdAt: timestamp("created_at").defaultNow(),
});

// V4ULT zod helpers
export const insertProfileSchema = createInsertSchema(profiles);

export const insertVaultConfessionSchema = createInsertSchema(vaultConfessions).pick(
  {
    shortId: true,
    authorId: true,
    vibe: true,
    shadowName: true,
    body: true,
  }
);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export type VaultConfession = typeof vaultConfessions.$inferSelect;
export type InsertVaultConfession = typeof vaultConfessions.$inferInsert;

export type RevealSession = typeof revealSessions.$inferSelect;
export type AnalyticsEvent = typeof analytics.$inferSelect;

