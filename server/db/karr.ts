import { desc, eq, and, count } from "drizzle-orm";
import { karrReviews, type InsertKarrReview, type KarrReview } from "../../drizzle/schema";
import { getDb } from "./core";

export async function insertKarrReview(data: InsertKarrReview): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(karrReviews).values(data);
  return Number((result as any).insertId ?? 0);
}

export async function getKarrReviews(opts: {
  userId?: number;
  targetType?: string;
  targetId?: number;
  limit?: number;
  offset?: number;
}): Promise<{ items: KarrReview[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions: any[] = [];
  if (opts.userId) conditions.push(eq(karrReviews.userId, opts.userId));
  if (opts.targetType) conditions.push(eq(karrReviews.targetType, opts.targetType as any));
  if (opts.targetId) conditions.push(eq(karrReviews.targetId, opts.targetId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const [items, totalResult] = await Promise.all([
    db.select().from(karrReviews).where(where).orderBy(desc(karrReviews.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(karrReviews).where(where),
  ]);

  return { items: items as KarrReview[], total: totalResult[0]?.count ?? 0 };
}