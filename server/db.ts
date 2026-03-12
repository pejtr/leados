import { eq, desc, and, like, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, leadSessions, InsertLead, InsertLeadSession, Lead, LeadSession } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

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
  limit?: number;
  offset?: number;
}

export async function getLeads(opts: GetLeadsOptions): Promise<{ items: Lead[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [eq(leads.userId, opts.userId)];
  if (opts.industry) conditions.push(eq(leads.industry, opts.industry));
  if (opts.sessionId) conditions.push(eq(leads.sessionId, opts.sessionId));
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
}

export async function getLeadStats(userId: number): Promise<LeadStats> {
  const db = await getDb();
  if (!db) return { totalLeads: 0, enrichedLeads: 0, totalSessions: 0, industryBreakdown: [] };

  const [totalResult, enrichedResult, sessionsResult, industryResult] = await Promise.all([
    db.select({ count: count() }).from(leads).where(eq(leads.userId, userId)),
    db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.isEnriched, true))),
    db.select({ count: count() }).from(leadSessions).where(eq(leadSessions.userId, userId)),
    db
      .select({ industry: leads.industry, count: count() })
      .from(leads)
      .where(eq(leads.userId, userId))
      .groupBy(leads.industry)
      .orderBy(desc(count())),
  ]);

  return {
    totalLeads: totalResult[0]?.count ?? 0,
    enrichedLeads: enrichedResult[0]?.count ?? 0,
    totalSessions: sessionsResult[0]?.count ?? 0,
    industryBreakdown: industryResult.map((r) => ({ industry: r.industry, count: r.count })),
  };
}
