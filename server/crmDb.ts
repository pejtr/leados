/**
 * CRM Database helpers — deals, deal activities, quotas, commissions
 */
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  deals, dealActivities, commissions, quotas,
  type Deal, type InsertDeal,
  type DealActivity, type InsertDealActivity,
  type Commission, type InsertCommission,
  type Quota, type InsertQuota,
} from "../drizzle/schema";

// ─── Deals ────────────────────────────────────────────────────────────────────

export async function getDeals(userId: number): Promise<Deal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deals).where(eq(deals.userId, userId)).orderBy(desc(deals.updatedAt));
}

export async function getDealById(id: number, userId: number): Promise<Deal | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(deals).where(and(eq(deals.id, id), eq(deals.userId, userId))).limit(1);
  return rows[0] as Deal | undefined;
}

export async function createDeal(data: InsertDeal): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(deals).values(data);
  return (result as any).insertId ?? 0;
}

export async function updateDeal(id: number, userId: number, data: Partial<InsertDeal>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(deals).set({ ...data, updatedAt: new Date() }).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

export async function deleteDeal(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(deals).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

export async function getDealStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, won: 0, lost: 0, totalValue: 0, wonValue: 0, pipelineValue: 0 };
  const allDeals = await db.select().from(deals).where(eq(deals.userId, userId));
  const total = allDeals.length;
  const won = allDeals.filter((d: any) => d.stage === "won").length;
  const lost = allDeals.filter((d: any) => d.stage === "lost").length;
  const totalValue = allDeals.reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0);
  const wonValue = allDeals.filter((d: any) => d.stage === "won").reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0);
  const pipelineValue = allDeals.filter((d: any) => !["won", "lost"].includes(d.stage)).reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0);
  return { total, won, lost, totalValue, wonValue, pipelineValue };
}

// ─── Deal Activities ───────────────────────────────────────────────────────────

export async function getDealActivities(dealId: number): Promise<DealActivity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealActivities).where(eq(dealActivities.dealId, dealId)).orderBy(desc(dealActivities.createdAt));
}

export async function createDealActivity(data: InsertDealActivity): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(dealActivities).values(data);
  return (result as any).insertId ?? 0;
}

// ─── Quotas ───────────────────────────────────────────────────────────────────

export async function getQuotas(userId: number): Promise<Quota[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotas).where(eq(quotas.userId, userId)).orderBy(desc(quotas.createdAt));
}

export async function upsertQuota(data: InsertQuota): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(quotas).values(data).onDuplicateKeyUpdate({ set: { targetValue: data.targetValue, achievedValue: data.achievedValue } });
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export async function getCommissions(userId: number): Promise<Commission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).where(eq(commissions.userId, userId)).orderBy(desc(commissions.createdAt));
}

export async function createCommission(data: InsertCommission): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(commissions).values(data);
  return (result as any).insertId ?? 0;
}
