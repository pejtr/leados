import { eq, desc, and } from "drizzle-orm";
import {
  socialMonitors, socialSignals,
  type SocialMonitor, type InsertSocialMonitor,
  type SocialSignal, type InsertSocialSignal,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getSocialMonitors(userId: number): Promise<SocialMonitor[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialMonitors).where(eq(socialMonitors.userId, userId)).orderBy(desc(socialMonitors.createdAt));
}

export async function getSocialMonitorById(id: number, userId: number): Promise<SocialMonitor | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(socialMonitors).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
  return rows[0];
}

export async function createSocialMonitor(data: InsertSocialMonitor): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialMonitors).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSocialMonitor(
  id: number, userId: number,
  data: Partial<Omit<SocialMonitor, "id" | "userId" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialMonitors).set(data).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
}

export async function deleteSocialMonitor(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(socialMonitors).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
}

export async function getSocialSignals(monitorId: number, limit = 50): Promise<SocialSignal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialSignals).where(eq(socialSignals.monitorId, monitorId)).orderBy(desc(socialSignals.createdAt)).limit(limit);
}

export async function getSocialSignalsByUser(userId: number, limit = 50): Promise<SocialSignal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialSignals).where(eq(socialSignals.userId, userId)).orderBy(desc(socialSignals.createdAt)).limit(limit);
}

export async function createSocialSignal(data: InsertSocialSignal): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialSignals).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSocialSignal(
  id: number,
  data: Partial<Pick<SocialSignal, "convertedToLead" | "leadId">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialSignals).set(data).where(eq(socialSignals.id, id));
}
