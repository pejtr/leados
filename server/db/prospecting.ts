import { eq, desc, and } from "drizzle-orm";
import {
  speedToLeadConfigs, InsertSpeedToLeadConfig, SpeedToLeadConfig,
  icpProfiles, InsertIcpProfile, IcpProfile,
  linkedinConnections, InsertLinkedinConnection, LinkedinConnection,
  techStackDetections, InsertTechStackDetection, TechStackDetection,
} from "../../drizzle/schema";
import { getDb } from "./core";

// ─── Speed-to-Lead ────────────────────────────────────────────

export async function getSpeedToLeadConfig(userId: number): Promise<SpeedToLeadConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(speedToLeadConfigs).where(eq(speedToLeadConfigs.userId, userId)).limit(1);
  return rows[0];
}

export async function upsertSpeedToLeadConfig(data: InsertSpeedToLeadConfig): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSpeedToLeadConfig(data.userId);
  if (existing) {
    await db.update(speedToLeadConfigs).set(data).where(eq(speedToLeadConfigs.id, existing.id));
  } else {
    await db.insert(speedToLeadConfigs).values(data);
  }
}

// ─── ICP Profiles ─────────────────────────────────────────────

export async function createIcpProfile(data: InsertIcpProfile): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(icpProfiles).values(data);
}

export async function getIcpProfilesByUser(userId: number): Promise<IcpProfile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(icpProfiles).where(eq(icpProfiles.userId, userId)).orderBy(desc(icpProfiles.createdAt));
}

export async function updateIcpProfile(id: number, data: Partial<InsertIcpProfile>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(icpProfiles).set(data).where(eq(icpProfiles.id, id));
}

export async function deleteIcpProfile(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(icpProfiles).where(and(eq(icpProfiles.id, id), eq(icpProfiles.userId, userId)));
}

// ─── LinkedIn Connections ─────────────────────────────────────

export async function getLinkedinConnectionsByLead(leadId: number): Promise<LinkedinConnection[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(linkedinConnections).where(eq(linkedinConnections.leadId, leadId));
}

export async function createLinkedinConnection(data: InsertLinkedinConnection): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(linkedinConnections).values(data);
}

// ─── Tech Stack Detection ─────────────────────────────────────

export async function createTechStackDetection(data: InsertTechStackDetection): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(techStackDetections).values(data);
}

export async function getTechStackByUser(userId: number): Promise<TechStackDetection[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(techStackDetections).where(eq(techStackDetections.userId, userId)).orderBy(desc(techStackDetections.lastScannedAt)).limit(200);
}

export async function getTechStackByDomain(domain: string, userId: number): Promise<TechStackDetection | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(techStackDetections).where(and(eq(techStackDetections.domain, domain), eq(techStackDetections.userId, userId))).limit(1);
  return rows[0];
}

export async function updateTechStackDetection(id: number, data: Partial<InsertTechStackDetection>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(techStackDetections).set(data).where(eq(techStackDetections.id, id));
}
