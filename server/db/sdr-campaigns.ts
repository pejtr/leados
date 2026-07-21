import { eq, desc, and } from "drizzle-orm";
import {
  sdrCampaigns, sdrActivities,
  type SdrCampaign, type InsertSdrCampaign,
  type SdrActivity, type InsertSdrActivity,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getSdrCampaigns(userId: number): Promise<SdrCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sdrCampaigns).where(eq(sdrCampaigns.userId, userId)).orderBy(desc(sdrCampaigns.createdAt));
}

export async function getSdrCampaignById(id: number, userId: number): Promise<SdrCampaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(sdrCampaigns).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
  return rows[0];
}

export async function createSdrCampaign(data: InsertSdrCampaign): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sdrCampaigns).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSdrCampaign(
  id: number, userId: number,
  data: Partial<Omit<SdrCampaign, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sdrCampaigns).set(data).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
}

export async function deleteSdrCampaign(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sdrCampaigns).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
}

export async function getSdrActivities(campaignId: number, limit = 50): Promise<SdrActivity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sdrActivities).where(eq(sdrActivities.campaignId, campaignId)).orderBy(desc(sdrActivities.createdAt)).limit(limit);
}

export async function createSdrActivity(data: InsertSdrActivity): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sdrActivities).values(data);
  return (result[0] as any).insertId as number;
}
