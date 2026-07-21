import { eq, desc, and } from "drizzle-orm";
import {
  emailVerifications, InsertEmailVerification, EmailVerification,
  campaignRules, InsertCampaignRule, CampaignRule,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Email Verifications ──────────────────────────────────────

export async function createEmailVerification(data: InsertEmailVerification): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(emailVerifications).values(data);
}

export async function getEmailVerificationsByUser(userId: number): Promise<EmailVerification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailVerifications).where(eq(emailVerifications.userId, userId)).orderBy(desc(emailVerifications.createdAt)).limit(200);
}

export async function updateEmailVerification(id: number, data: Partial<InsertEmailVerification>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailVerifications).set(data).where(eq(emailVerifications.id, id));
}

// ─── Campaign Rules (If/Then) ─────────────────────────────────

export async function createCampaignRule(data: InsertCampaignRule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(campaignRules).values(data);
}

export async function getCampaignRulesByUser(userId: number): Promise<CampaignRule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaignRules).where(eq(campaignRules.userId, userId)).orderBy(desc(campaignRules.createdAt));
}

export async function updateCampaignRule(id: number, data: Partial<InsertCampaignRule>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaignRules).set(data).where(eq(campaignRules.id, id));
}

export async function deleteCampaignRule(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(campaignRules).where(and(eq(campaignRules.id, id), eq(campaignRules.userId, userId)));
}
