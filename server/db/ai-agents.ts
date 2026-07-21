import { eq, desc, and } from "drizzle-orm";
import {
  aiAgents, InsertAiAgent, AiAgent,
  aiAgentLogs, InsertAiAgentLog, AiAgentLog,
} from "../../drizzle/schema";
import { aiAgentMemory, aiChatHistory, aiPerformanceLog } from "../../drizzle/schema";
import type { InsertAiAgentMemory, InsertAiPerformanceLog, InsertAiChatHistory } from "../../drizzle/schema";
import { getDb } from "./core";

// ─── AI Agents ────────────────────────────────────────────────

export async function createAiAgent(data: InsertAiAgent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiAgents).values(data);
}

export async function getAiAgentsByUser(userId: number): Promise<AiAgent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAgents).where(eq(aiAgents.userId, userId)).orderBy(desc(aiAgents.createdAt));
}

export async function updateAiAgent(id: number, data: Partial<InsertAiAgent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiAgents).set(data).where(eq(aiAgents.id, id));
}

export async function deleteAiAgent(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId)));
}

export async function getAiAgentById(id: number): Promise<AiAgent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).limit(1);
  return rows[0];
}

export async function createAiAgentLog(data: InsertAiAgentLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiAgentLogs).values(data);
}

export async function getAiAgentLogsByAgent(agentId: number): Promise<AiAgentLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAgentLogs).where(eq(aiAgentLogs.agentId, agentId)).orderBy(desc(aiAgentLogs.createdAt)).limit(50);
}

// ─── AI Agent Memory ──────────────────────────────────────────────

export async function getAiMemory(userId: number, memoryType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(aiAgentMemory.userId, userId)];
  if (memoryType) conditions.push(eq(aiAgentMemory.memoryType, memoryType as any));
  return db.select().from(aiAgentMemory).where(and(...conditions)).orderBy(desc(aiAgentMemory.updatedAt)).limit(50);
}

export async function upsertAiMemory(
  userId: number,
  key: string,
  value: string,
  memoryType: "learning" | "optimization" | "preference" | "insight",
  confidence = 0.7
) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(aiAgentMemory)
    .where(and(eq(aiAgentMemory.userId, userId), eq(aiAgentMemory.key, key))).limit(1);
  if (existing.length > 0) {
    await db.update(aiAgentMemory)
      .set({ value, confidence: confidence.toFixed(2), usageCount: (existing[0].usageCount ?? 0) + 1 })
      .where(eq(aiAgentMemory.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(aiAgentMemory).values({ userId, key, value, memoryType, confidence: confidence.toFixed(2) });
  return (result as any).insertId as number;
}

export async function logAiPerformance(data: InsertAiPerformanceLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiPerformanceLog).values(data);
  return (result as any).insertId as number;
}

export async function getAiPerformanceLogs(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPerformanceLog)
    .where(eq(aiPerformanceLog.userId, userId))
    .orderBy(desc(aiPerformanceLog.createdAt)).limit(limit);
}

export async function saveChatMessage(data: InsertAiChatHistory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiChatHistory).values(data);
  return (result as any).insertId as number;
}

export async function getChatHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .orderBy(aiChatHistory.createdAt).limit(limit);
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiChatHistory).where(eq(aiChatHistory.userId, userId));
}
