import { eq, desc, and, lte } from "drizzle-orm";
import {
  autopilotConfigs, autopilotRuns,
  type AutopilotConfig, type InsertAutopilotConfig,
  type AutopilotRun, type InsertAutopilotRun,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getAutopilotConfigs(userId: number): Promise<AutopilotConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotConfigs).where(eq(autopilotConfigs.userId, userId)).orderBy(desc(autopilotConfigs.createdAt));
}

export async function getAutopilotConfigById(id: number, userId: number): Promise<AutopilotConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(autopilotConfigs).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
  return rows[0];
}

export async function createAutopilotConfig(data: InsertAutopilotConfig): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(autopilotConfigs).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateAutopilotConfig(
  id: number, userId: number,
  data: Partial<Omit<AutopilotConfig, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autopilotConfigs).set(data).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
}

export async function deleteAutopilotConfig(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(autopilotConfigs).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
}

export async function getDueAutopilotConfigs(): Promise<AutopilotConfig[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(autopilotConfigs).where(
    and(
      eq(autopilotConfigs.isActive, true),
      lte(autopilotConfigs.nextRunAt, now)
    )
  );
}

export async function getAutopilotRuns(configId: number, limit = 20): Promise<AutopilotRun[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotRuns).where(eq(autopilotRuns.configId, configId)).orderBy(desc(autopilotRuns.startedAt)).limit(limit);
}

export async function getRecentAutopilotRuns(userId: number, limit = 10): Promise<AutopilotRun[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotRuns).where(eq(autopilotRuns.userId, userId)).orderBy(desc(autopilotRuns.startedAt)).limit(limit);
}

export async function createAutopilotRun(data: InsertAutopilotRun): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(autopilotRuns).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateAutopilotRun(id: number, data: Partial<Omit<AutopilotRun, "id">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autopilotRuns).set(data).where(eq(autopilotRuns.id, id));
}
