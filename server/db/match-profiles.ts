import { eq, desc, and } from "drizzle-orm";
import {
  matchProfiles,
  type MatchProfile, type InsertMatchProfile,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getMatchProfiles(userId: number): Promise<MatchProfile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchProfiles).where(eq(matchProfiles.userId, userId)).orderBy(desc(matchProfiles.createdAt));
}

export async function getMatchProfileById(id: number, userId: number): Promise<MatchProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(matchProfiles).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
  return rows[0];
}

export async function createMatchProfile(data: InsertMatchProfile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchProfiles).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateMatchProfile(
  id: number, userId: number,
  data: Partial<Omit<MatchProfile, "id" | "userId" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matchProfiles).set(data).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
}

export async function deleteMatchProfile(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(matchProfiles).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
}
