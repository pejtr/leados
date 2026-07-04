/**
 * CML persistent memory — conversation history stored in MySQL so context
 * survives server restarts and redeploys.
 *
 * The table is created lazily via CREATE TABLE IF NOT EXISTS (drizzle-kit
 * generate is blocked by pre-existing snapshot drift, and this keeps the
 * module self-contained). All operations degrade gracefully: when the DB is
 * unavailable the caller falls back to in-memory history.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import type { ChatTurn } from "./cml";

let tableReady = false;

async function ensureTable(): Promise<boolean> {
  if (tableReady) return true;
  try {
    const db = await getDb();
    if (!db) return false;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cml_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id VARCHAR(32) NOT NULL,
        role VARCHAR(16) NOT NULL,
        content TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_cml_chat (chat_id, id)
      )
    `);
    tableReady = true;
    return true;
  } catch (err: any) {
    console.warn("[CML Memory] ensureTable failed:", err?.message);
    return false;
  }
}

/** Load the most recent turns for a chat (oldest first). Null = persistence unavailable. */
export async function loadHistory(chatId: number, limit = 40): Promise<ChatTurn[] | null> {
  try {
    if (!(await ensureTable())) return null;
    const db = await getDb();
    if (!db) return null;
    const result: any = await db.execute(sql`
      SELECT role, content FROM cml_messages
      WHERE chat_id = ${String(chatId)}
      ORDER BY id DESC
      LIMIT ${limit}
    `);
    const rows: any[] = Array.isArray(result) ? (result[0] ?? []) : (result?.rows ?? []);
    return rows
      .reverse()
      .map(r => ({ role: r.role === "assistant" ? "assistant" : "user", content: String(r.content) }) as ChatTurn);
  } catch (err: any) {
    console.warn("[CML Memory] loadHistory failed:", err?.message);
    return null;
  }
}

/** Persist one turn (fire-and-forget from the caller's perspective). */
export async function saveTurn(chatId: number, turn: ChatTurn): Promise<void> {
  try {
    if (!(await ensureTable())) return;
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO cml_messages (chat_id, role, content, created_at)
      VALUES (${String(chatId)}, ${turn.role}, ${turn.content.slice(0, 60000)}, ${Date.now()})
    `);
  } catch (err: any) {
    console.warn("[CML Memory] saveTurn failed:", err?.message);
  }
}
