import { eq, desc, and, sql, count, inArray, sum } from "drizzle-orm";
import {
  InsertLead, InsertLeadSession, Lead, LeadSession,
  leads, leadSessions,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Lead Sessions ───────────────────────────────────────────────

export async function createLeadSession(data: InsertLeadSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leadSessions).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateLeadSession(
  id: number,
  data: Partial<Pick<LeadSession, "status" | "generatedCount" | "enrichedCount" | "errorMessage" | "completedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leadSessions).set(data).where(eq(leadSessions.id, id));
}

export async function getLeadSessionsByUser(userId: number): Promise<LeadSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadSessions).where(eq(leadSessions.userId, userId)).orderBy(desc(leadSessions.createdAt));
}

// ─── Leads ───────────────────────────────────────────────────────

export async function insertLeads(data: InsertLead[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(leads).values(data);
}

export interface GetLeadsOptions {
  userId: number;
  search?: string;
  industry?: string;
  sessionId?: number;
  status?: string;
  qualityRating?: string;
  assignedTo?: number;
  segment?: string;
  limit?: number;
  offset?: number;
}

export async function getLeads(opts: GetLeadsOptions): Promise<{ items: Lead[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [eq(leads.userId, opts.userId)];
  if (opts.industry) conditions.push(eq(leads.industry, opts.industry));
  if (opts.sessionId) conditions.push(eq(leads.sessionId, opts.sessionId));
  if (opts.status) conditions.push(eq(leads.status, opts.status as any));
  if (opts.qualityRating) conditions.push(eq(leads.qualityRating, opts.qualityRating as any));
  if (opts.assignedTo) conditions.push(eq(leads.assignedTo, opts.assignedTo));
  if (opts.segment) conditions.push(eq(leads.segment, opts.segment));
  if (opts.search) {
    conditions.push(
      sql`(${leads.companyName} LIKE ${`%${opts.search}%`} OR ${leads.email} LIKE ${`%${opts.search}%`} OR ${leads.contactName} LIKE ${`%${opts.search}%`})`
    );
  }

  const where = and(...conditions);
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const [items, totalResult] = await Promise.all([
    db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(leads).where(where),
  ]);

  return { items, total: totalResult[0]?.count ?? 0 };
}

export async function getLeadsBySession(sessionId: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.sessionId, sessionId)).orderBy(leads.id);
}

export async function getLeadsByIds(ids: number[], userId: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(leads).where(and(inArray(leads.id, ids), eq(leads.userId, userId)));
}

export async function getLeadById(id: number, userId: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.userId, userId))).limit(1);
  return rows[0];
}

export async function updateLeadStatus(
  leadId: number,
  userId: number,
  status: "new" | "contacted" | "replied" | "qualified" | "disqualified"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ status }).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

export async function bulkUpdateLeadStatus(
  leadIds: number[],
  userId: number,
  status: "new" | "contacted" | "replied" | "qualified" | "disqualified"
): Promise<void> {
  const db = await getDb();
  if (!db || leadIds.length === 0) return;
  await db.update(leads).set({ status }).where(and(inArray(leads.id, leadIds), eq(leads.userId, userId)));
}

export async function bulkDeleteLeads(leadIds: number[], userId: number): Promise<void> {
  const db = await getDb();
  if (!db || leadIds.length === 0) return;
  await db.delete(leads).where(and(inArray(leads.id, leadIds), eq(leads.userId, userId)));
}

export async function updateLeadQuality(
  leadId: number,
  userId: number,
  qualityRating: "good" | "bad",
  qualityNote?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads)
    .set({ qualityRating, qualityNote: qualityNote ?? null })
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

export async function closeDeal(
  leadId: number,
  userId: number,
  dealValue: string,
  currency: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads)
    .set({ dealClosed: true, dealValue, dealClosedAt: new Date(), currency, status: "qualified" })
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

export async function deleteLeadsBySession(sessionId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leads).where(and(eq(leads.sessionId, sessionId), eq(leads.userId, userId)));
  await db.delete(leadSessions).where(and(eq(leadSessions.id, sessionId), eq(leadSessions.userId, userId)));
}

// ─── Stats ───────────────────────────────────────────────────────

export interface LeadStats {
  totalLeads: number;
  enrichedLeads: number;
  totalSessions: number;
  industryBreakdown: { industry: string; count: number }[];
  qualityBreakdown: { good: number; bad: number; unrated: number };
  roiStats: { closedDeals: number; totalRevenue: number; avgDealValue: number; closeRate: number };
  statusBreakdown: { status: string; count: number }[];
}

export async function getLeadStats(userId: number): Promise<LeadStats> {
  const db = await getDb();
  if (!db) return {
    totalLeads: 0, enrichedLeads: 0, totalSessions: 0,
    industryBreakdown: [],
    qualityBreakdown: { good: 0, bad: 0, unrated: 0 },
    roiStats: { closedDeals: 0, totalRevenue: 0, avgDealValue: 0, closeRate: 0 },
    statusBreakdown: [],
  };

  const [
    totalResult, enrichedResult, sessionsResult, industryResult,
    goodResult, badResult, closedResult, revenueResult, statusResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(leads).where(eq(leads.userId, userId)),
    db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.isEnriched, true))),
    db.select({ count: count() }).from(leadSessions).where(eq(leadSessions.userId, userId)),
    db.select({ industry: leads.industry, count: count() }).from(leads)
      .where(eq(leads.userId, userId)).groupBy(leads.industry).orderBy(desc(count())),
    db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.qualityRating, "good"))),
    db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.qualityRating, "bad"))),
    db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.dealClosed, true))),
    db.select({ total: sum(leads.dealValue) }).from(leads).where(and(eq(leads.userId, userId), eq(leads.dealClosed, true))),
    db.select({ status: leads.status, count: count() }).from(leads)
      .where(eq(leads.userId, userId)).groupBy(leads.status),
  ]);

  const totalLeads = totalResult[0]?.count ?? 0;
  const closedDeals = closedResult[0]?.count ?? 0;
  const totalRevenue = parseFloat(String(revenueResult[0]?.total ?? "0")) || 0;
  const good = goodResult[0]?.count ?? 0;
  const bad = badResult[0]?.count ?? 0;

  return {
    totalLeads,
    enrichedLeads: enrichedResult[0]?.count ?? 0,
    totalSessions: sessionsResult[0]?.count ?? 0,
    industryBreakdown: industryResult.map((r) => ({ industry: r.industry, count: r.count })),
    qualityBreakdown: { good, bad, unrated: totalLeads - good - bad },
    roiStats: {
      closedDeals,
      totalRevenue,
      avgDealValue: closedDeals > 0 ? totalRevenue / closedDeals : 0,
      closeRate: totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0,
    },
    statusBreakdown: statusResult.map((r) => ({ status: r.status ?? "new", count: r.count })),
  };
}
