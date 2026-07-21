import { eq, desc, and } from "drizzle-orm";
import {
  webhookConfigs, integrationLogs, webhookLogs,
  type WebhookConfig, type InsertWebhookConfig,
  type IntegrationLog, type InsertIntegrationLog,
  type InsertWebhookLog,
} from "../../drizzle/schema";
import { getDb } from "./core";

export async function getWebhookConfigs(userId: number): Promise<WebhookConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookConfigs).where(eq(webhookConfigs.userId, userId)).orderBy(desc(webhookConfigs.createdAt));
}

export async function getActiveWebhookConfigs(userId: number, eventType: "new_lead" | "new_order" | "quiz_completed"): Promise<WebhookConfig[]> {
  const db = await getDb();
  if (!db) return [];
  // New schema uses events comma-separated string + status enum
  const allConfigs = await db.select().from(webhookConfigs).where(
    and(eq(webhookConfigs.userId, userId), eq(webhookConfigs.status, "active"))
  );
  // Filter by event type in the events comma-separated field
  return allConfigs.filter(config => {
    const events = config.events.split(",").map(e => e.trim());
    return events.includes(eventType);
  });
}

export async function getWebhookConfigById(id: number, userId: number): Promise<WebhookConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(webhookConfigs).where(and(eq(webhookConfigs.id, id), eq(webhookConfigs.userId, userId)));
  return rows[0];
}

export async function createWebhookConfig(data: InsertWebhookConfig): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookConfigs).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateWebhookConfig(
  id: number,
  userId: number,
  data: Partial<Omit<WebhookConfig, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhookConfigs).set(data).where(and(eq(webhookConfigs.id, id), eq(webhookConfigs.userId, userId)));
}

export async function deleteWebhookConfig(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(webhookConfigs).where(and(eq(webhookConfigs.id, id), eq(webhookConfigs.userId, userId)));
}

export async function getIntegrationLogs(userId: number, limit = 50): Promise<IntegrationLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationLogs).where(eq(integrationLogs.userId, userId)).orderBy(desc(integrationLogs.createdAt)).limit(limit);
}

export async function createIntegrationLog(data: InsertIntegrationLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(integrationLogs).values(data);
  return (result[0] as any).insertId as number;
}

// Webhook delivery log (webhook_logs) — drives the retry scheduler. A row with
// status "failed", attempt < maxRetries and a due nextRetryAt is picked up for redelivery.
export async function createWebhookLog(data: InsertWebhookLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookLogs).values(data);
  return (result[0] as any).insertId as number;
}
