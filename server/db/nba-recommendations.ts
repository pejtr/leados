import { eq, desc, and } from "drizzle-orm";
import {
  nbaRecommendations,
  type NbaRecommendation, type InsertNbaRecommendation,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getNbaRecommendations(userId: number, status?: string, limit = 20): Promise<NbaRecommendation[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(nbaRecommendations.userId, userId)];
  if (status) conditions.push(eq(nbaRecommendations.status, status as any));
  return db.select().from(nbaRecommendations).where(and(...conditions)).orderBy(desc(nbaRecommendations.priority)).limit(limit);
}

export async function createNbaRecommendation(data: InsertNbaRecommendation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nbaRecommendations).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateNbaRecommendation(
  id: number, userId: number,
  data: Partial<Pick<NbaRecommendation, "status" | "actionedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(nbaRecommendations).set(data).where(and(eq(nbaRecommendations.id, id), eq(nbaRecommendations.userId, userId)));
}

export async function deleteNbaRecommendation(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(nbaRecommendations).where(and(eq(nbaRecommendations.id, id), eq(nbaRecommendations.userId, userId)));
}
