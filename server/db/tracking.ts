import { eq, desc, and } from "drizzle-orm";
import {
  trackingPixels, InsertTrackingPixel, TrackingPixel,
  visitorSessions, InsertVisitorSession, VisitorSession,
  visitorPageViews, VisitorPageView,
  alertRules, InsertAlertRule, AlertRule,
  smartLists, InsertSmartList, SmartList,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Tracking Pixels ──────────────────────────────────────────

export async function createTrackingPixel(data: InsertTrackingPixel): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trackingPixels).values(data);
}

export async function getTrackingPixelsByUser(userId: number): Promise<TrackingPixel[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trackingPixels).where(eq(trackingPixels.userId, userId)).orderBy(desc(trackingPixels.createdAt));
}

export async function deleteTrackingPixel(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(trackingPixels).where(and(eq(trackingPixels.id, id), eq(trackingPixels.userId, userId)));
}

export async function updateTrackingPixel(id: number, data: Partial<InsertTrackingPixel>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trackingPixels).set(data).where(eq(trackingPixels.id, id));
}

// ─── Visitor Sessions ─────────────────────────────────────────

export async function getVisitorSessionsByPixel(pixelId: number, userId: number): Promise<VisitorSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitorSessions).where(and(eq(visitorSessions.pixelId, pixelId), eq(visitorSessions.userId, userId))).orderBy(desc(visitorSessions.lastSeenAt)).limit(100);
}

export async function getVisitorSessionsByUser(userId: number): Promise<VisitorSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitorSessions).where(eq(visitorSessions.userId, userId)).orderBy(desc(visitorSessions.lastSeenAt)).limit(200);
}

export async function createVisitorSession(data: InsertVisitorSession): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(visitorSessions).values(data);
}

// ─── Visitor Page Views ───────────────────────────────────────

export async function getPageViewsBySession(sessionId: number): Promise<VisitorPageView[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visitorPageViews).where(eq(visitorPageViews.visitorSessionId, sessionId)).orderBy(desc(visitorPageViews.createdAt));
}

// ─── Alert Rules ──────────────────────────────────────────────

export async function createAlertRule(data: InsertAlertRule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(alertRules).values(data);
}

export async function getAlertRulesByUser(userId: number): Promise<AlertRule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertRules).where(eq(alertRules.userId, userId)).orderBy(desc(alertRules.createdAt));
}

export async function updateAlertRule(id: number, data: Partial<InsertAlertRule>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alertRules).set(data).where(eq(alertRules.id, id));
}

export async function deleteAlertRule(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(alertRules).where(and(eq(alertRules.id, id), eq(alertRules.userId, userId)));
}

// ─── Smart Lists ──────────────────────────────────────────────

export async function createSmartList(data: InsertSmartList): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(smartLists).values(data);
}

export async function getSmartListsByUser(userId: number): Promise<SmartList[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smartLists).where(eq(smartLists.userId, userId)).orderBy(desc(smartLists.createdAt));
}

export async function updateSmartList(id: number, data: Partial<InsertSmartList>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smartLists).set(data).where(eq(smartLists.id, id));
}

export async function deleteSmartList(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(smartLists).where(and(eq(smartLists.id, id), eq(smartLists.userId, userId)));
}
