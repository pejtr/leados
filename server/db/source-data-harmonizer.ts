import { getDb } from "./core";
import { dataProvenance, attributionTrail } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface ProvenanceFilter {
  userId?: number;
  sourceType?: string;
  providerName?: string;
  limit?: number;
  offset?: number;
}

export async function insertProvenance(
  values: typeof dataProvenance.$inferInsert
) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(dataProvenance).values(values);
  return Number((row as any).insertId ?? row.insertId);
}

export async function getProvenanceEntries(filter: ProvenanceFilter) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filter.userId) conditions.push(eq(dataProvenance.userId, filter.userId));
  if (filter.sourceType) conditions.push(eq(dataProvenance.sourceType, filter.sourceType));
  if (filter.providerName) conditions.push(eq(dataProvenance.providerName, filter.providerName));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(dataProvenance)
    .where(where)
    .orderBy(desc(dataProvenance.createdAt))
    .limit(filter.limit ?? 50)
    .offset(filter.offset ?? 0);
}

export async function getProvenanceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(dataProvenance)
    .where(eq(dataProvenance.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateProvenance(
  id: number,
  values: Partial<typeof dataProvenance.$inferInsert>
) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(dataProvenance)
    .set(values)
    .where(eq(dataProvenance.id, id));
  return (result as any).affectedRows > 0;
}

export async function getProvenanceStats(userId?: number) {
  const db = await getDb();
  if (!db) return null;
  const conditions = userId ? [eq(dataProvenance.userId, userId)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select({
      total: sql<number>`count(*)`,
      byType: sql<string>`${dataProvenance.sourceType}`,
      avgConfidence: sql<number>`avg(${dataProvenance.confidenceScore})`,
    })
    .from(dataProvenance)
    .where(where)
    .groupBy(dataProvenance.sourceType);
  return {
    totalEntries: rows.reduce((s, r) => s + Number(r.total), 0),
    bySourceType: rows.map((r) => ({
      sourceType: r.byType,
      count: Number(r.total),
      avgConfidence: Number(r.avgConfidence).toFixed(2),
    })),
    lowConfidenceCount: 0,
  };
}

export async function insertAttribution(
  values: typeof attributionTrail.$inferInsert
) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.insert(attributionTrail).values(values);
  return Number((row as any).insertId ?? row.insertId);
}

export async function getAttributionsByProvenance(provenanceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(attributionTrail)
    .where(eq(attributionTrail.provenanceId, provenanceId))
    .orderBy(desc(attributionTrail.createdAt));
}

export async function getAttributionsByEntity(
  entityType: string,
  entityId: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(attributionTrail)
    .where(
      and(
        eq(attributionTrail.entityType, entityType),
        eq(attributionTrail.entityId, entityId)
      )
    )
    .orderBy(desc(attributionTrail.createdAt));
}
