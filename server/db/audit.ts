import { desc, eq, and, count, gte, lte } from "drizzle-orm";
import { auditEvents, type InsertAuditEvent, type AuditEvent } from "../../drizzle/schema";
import { getDb } from "./core";

export async function insertAuditEvent(data: InsertAuditEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(data);
}

export async function getAuditEvents(opts: {
  userId?: number;
  eventType?: string;
  resourceType?: string;
  resourceId?: number;
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
}): Promise<{ items: AuditEvent[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions: any[] = [];
  if (opts.userId) conditions.push(eq(auditEvents.userId, opts.userId));
  if (opts.eventType) conditions.push(eq(auditEvents.eventType, opts.eventType));
  if (opts.resourceType) conditions.push(eq(auditEvents.resourceType, opts.resourceType));
  if (opts.resourceId) conditions.push(eq(auditEvents.resourceId, opts.resourceId));
  if (opts.from) conditions.push(gte(auditEvents.createdAt, opts.from));
  if (opts.to) conditions.push(lte(auditEvents.createdAt, opts.to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const [items, totalResult] = await Promise.all([
    db.select().from(auditEvents).where(where).orderBy(desc(auditEvents.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(auditEvents).where(where),
  ]);

  return { items: items as AuditEvent[], total: totalResult[0]?.count ?? 0 };
}

export async function getAuditStats(userId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, byEventType: [] as { eventType: string; count: number }[] };

  const where = userId ? eq(auditEvents.userId, userId) : undefined;
  const [totalResult, byType] = await Promise.all([
    db.select({ count: count() }).from(auditEvents).where(where),
    db.select({ eventType: auditEvents.eventType, count: count() })
      .from(auditEvents).where(where).groupBy(auditEvents.eventType).orderBy(desc(count())),
  ]);

  return {
    total: totalResult[0]?.count ?? 0,
    byEventType: byType.map((r) => ({ eventType: r.eventType, count: r.count })),
  };
}
