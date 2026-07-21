import { getDb } from "./core";
import { eq, desc, sql } from "drizzle-orm";
import { seoKeywords, seoContentScores } from "../../drizzle/schema";

export async function listKeywords() {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot list keywords: database not available"); return []; }
  return db.select().from(seoKeywords).orderBy(desc(seoKeywords.createdAt));
}

export async function getKeyword(id: number) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get keyword: database not available"); return null; }
  const [row] = await db.select().from(seoKeywords).where(eq(seoKeywords.id, id)).limit(1);
  return row ?? null;
}

export async function createKeyword(data: typeof seoKeywords.$inferInsert) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot create keyword: database not available"); return null; }
  const [row] = await db.insert(seoKeywords).values(data);
  return Number((row as any).insertId ?? row.insertId);
}

export async function updateKeyword(id: number, data: Partial<typeof seoKeywords.$inferInsert>) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot update keyword: database not available"); return false; }
  const result = await db.update(seoKeywords).set(data).where(eq(seoKeywords.id, id));
  return (result as any).affectedRows > 0;
}

export async function deleteKeyword(id: number) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot delete keyword: database not available"); return false; }
  const result = await db.delete(seoKeywords).where(eq(seoKeywords.id, id));
  return (result as any).affectedRows > 0;
}

export async function listContentScores() {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot list content scores: database not available"); return []; }
  return db.select().from(seoContentScores).orderBy(desc(seoContentScores.analyzedAt));
}

export async function getContentScore(id: number) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get content score: database not available"); return null; }
  const [row] = await db.select().from(seoContentScores).where(eq(seoContentScores.id, id)).limit(1);
  return row ?? null;
}

export async function createContentScore(data: typeof seoContentScores.$inferInsert) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot create content score: database not available"); return null; }
  const [row] = await db.insert(seoContentScores).values(data);
  return Number((row as any).insertId ?? row.insertId);
}

export async function getKeywordStats() {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get keyword stats: database not available"); return null; }
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      avgDifficulty: sql<number>`avg(${seoKeywords.difficulty})`,
    })
    .from(seoKeywords);
  return {
    totalKeywords: Number(result?.total ?? 0),
    averageDifficulty: result?.avgDifficulty ? Number(result.avgDifficulty).toFixed(2) : "0.00",
  };
}
