import { db, pool } from "./db";
import {
  confessions,
  type Confession,
  type InsertConfession,
  type UpdateConfessionStatusRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Ensure schema is correct before operations
async function ensureSchema() {
  try {
    const client = await pool.connect();
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'confessions'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist - create it
      await client.query(`
        CREATE TABLE confessions (
          id VARCHAR PRIMARY KEY,
          sender_name TEXT NOT NULL,
          sender_contact TEXT,
          response TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[storage] Created confessions table");
      client.release();
      return;
    }
    
    // Check if sender_name column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'confessions' AND column_name = 'sender_name'
    `);
    client.release();
    
    if (columnCheck.rows.length === 0) {
      // Column doesn't exist - add it
      const fixClient = await pool.connect();
      try {
        await fixClient.query(`
          ALTER TABLE confessions 
          ADD COLUMN sender_name TEXT DEFAULT ''
        `);
        await fixClient.query(`
          UPDATE confessions 
          SET sender_name = '' 
          WHERE sender_name IS NULL
        `);
        await fixClient.query(`
          ALTER TABLE confessions 
          ALTER COLUMN sender_name SET NOT NULL,
          ALTER COLUMN sender_name DROP DEFAULT
        `);
        console.log("[storage] Fixed missing sender_name column");
      } finally {
        fixClient.release();
      }
    }
  } catch (error) {
    console.error("[storage] Error ensuring schema:", error);
    // Don't throw - let the operation try and fail with a clearer error
  }
}

export interface IStorage {
  createConfession(confession: InsertConfession): Promise<Confession>;
  getConfession(id: string): Promise<Confession | undefined>;
  updateConfessionStatus(id: string, update: UpdateConfessionStatusRequest): Promise<Confession | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createConfession(insertConfession: InsertConfession): Promise<Confession> {
    // Ensure schema is correct before inserting
    await ensureSchema();
    
    const id = nanoid(6);
    const [confession] = await db.insert(confessions).values({
      ...insertConfession,
      id,
    }).returning();
    return confession;
  }

  async getConfession(id: string): Promise<Confession | undefined> {
    const [confession] = await db.select().from(confessions).where(eq(confessions.id, id));
    return confession;
  }

  async updateConfessionStatus(id: string, update: UpdateConfessionStatusRequest): Promise<Confession | undefined> {
    const [confession] = await db.update(confessions)
      .set({ response: update.response })
      .where(eq(confessions.id, id))
      .returning();
    return confession;
  }
}

export const storage = new DatabaseStorage();
