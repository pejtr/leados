import { eq, and, desc, gte } from "drizzle-orm";
import { getDb } from "./db";
import { connectedProjects, projectEvents } from "../drizzle/schema";
import crypto from "crypto";

// ─── API Key generation ───────────────────────────────────────────
export function generateApiKey(): string {
  return "lpos_" + crypto.randomBytes(24).toString("hex");
}

// ─── Projects CRUD ───────────────────────────────────────────────
export async function createProject(data: {
  userId: number;
  name: string;
  description?: string;
  url?: string;
  category?: string;
  currency?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const apiKey = generateApiKey();
  await db.insert(connectedProjects).values({
    userId: data.userId,
    name: data.name,
    description: data.description ?? null,
    url: data.url ?? null,
    category: data.category ?? "ecommerce",
    apiKey,
    currency: data.currency ?? "CZK",
  });
  const [project] = await db
    .select()
    .from(connectedProjects)
    .where(eq(connectedProjects.apiKey, apiKey));
  return project;
}

export async function listProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(connectedProjects)
    .where(eq(connectedProjects.userId, userId))
    .orderBy(desc(connectedProjects.createdAt));
}

export async function getProjectByApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db
    .select()
    .from(connectedProjects)
    .where(and(eq(connectedProjects.apiKey, apiKey), eq(connectedProjects.isActive, true)));
  return project ?? null;
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db
    .select()
    .from(connectedProjects)
    .where(and(eq(connectedProjects.id, id), eq(connectedProjects.userId, userId)));
  return project ?? null;
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(connectedProjects)
    .where(and(eq(connectedProjects.id, id), eq(connectedProjects.userId, userId)));
}

export async function regenerateApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const newKey = generateApiKey();
  await db
    .update(connectedProjects)
    .set({ apiKey: newKey })
    .where(and(eq(connectedProjects.id, id), eq(connectedProjects.userId, userId)));
  return newKey;
}

// ─── Event ingestion ─────────────────────────────────────────────
export async function ingestEvent(data: {
  projectId: number;
  eventType: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(projectEvents).values({
    projectId: data.projectId,
    eventType: data.eventType,
    value: data.value?.toString() ?? "0",
    currency: data.currency ?? "CZK",
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    occurredAt: data.occurredAt ?? new Date(),
  });
}

// ─── Analytics aggregation ───────────────────────────────────────
export async function getProjectStats(projectId: number, days = 30) {
  const db = await getDb();
  if (!db) return {
    totalRevenue: 0, netRevenue: 0, totalAdSpend: 0, totalRefunds: 0,
    profit: 0, roas: null, salesCount: 0, pageviewCount: 0,
    signupCount: 0, cvr: null, daily: [], recentEvents: [],
  };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(projectEvents)
    .where(
      and(
        eq(projectEvents.projectId, projectId),
        gte(projectEvents.occurredAt, since)
      )
    )
    .orderBy(desc(projectEvents.occurredAt));

  const sales = events.filter((e) => e.eventType === "sale");
  const adspend = events.filter((e) => e.eventType === "adspend");
  const pageviews = events.filter((e) => e.eventType === "pageview");
  const signups = events.filter((e) => e.eventType === "signup");
  const refunds = events.filter((e) => e.eventType === "refund");

  const totalRevenue = sales.reduce((s, e) => s + parseFloat(e.value ?? "0"), 0);
  const totalAdSpend = adspend.reduce((s, e) => s + parseFloat(e.value ?? "0"), 0);
  const totalRefunds = refunds.reduce((s, e) => s + parseFloat(e.value ?? "0"), 0);
  const netRevenue = totalRevenue - totalRefunds;
  const profit = netRevenue - totalAdSpend;
  const roas = totalAdSpend > 0 ? netRevenue / totalAdSpend : null;
  const cvr = pageviews.length > 0 ? (sales.length / pageviews.length) * 100 : null;

  // Daily breakdown for chart
  const dailyMap: Record<string, { revenue: number; sales: number; adspend: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { revenue: 0, sales: 0, adspend: 0 };
  }
  for (const e of events) {
    const key = e.occurredAt.toISOString().slice(0, 10);
    if (!dailyMap[key]) continue;
    if (e.eventType === "sale") {
      dailyMap[key].revenue += parseFloat(e.value ?? "0");
      dailyMap[key].sales += 1;
    }
    if (e.eventType === "adspend") {
      dailyMap[key].adspend += parseFloat(e.value ?? "0");
    }
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return {
    totalRevenue,
    netRevenue,
    totalAdSpend,
    totalRefunds,
    profit,
    roas,
    salesCount: sales.length,
    pageviewCount: pageviews.length,
    signupCount: signups.length,
    cvr,
    daily,
    recentEvents: events.slice(0, 20),
  };
}

export async function getAllProjectsStats(userId: number, days = 30) {
  const projects = await listProjects(userId);
  const stats = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      stats: await getProjectStats(p.id, days),
    }))
  );
  return stats;
}
