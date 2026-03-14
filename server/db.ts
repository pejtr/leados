import { eq, desc, and, like, sql, count, inArray, sum, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, leads, leadSessions, emailTemplates, teamMembers,
  InsertLead, InsertLeadSession, Lead, LeadSession,
  InsertEmailTemplate, EmailTemplate, InsertTeamMember, TeamMember,
  trackingPixels, InsertTrackingPixel, TrackingPixel,
  visitorSessions, InsertVisitorSession, VisitorSession,
  visitorPageViews, InsertVisitorPageView, VisitorPageView,
  alertRules, InsertAlertRule, AlertRule,
  smartLists, InsertSmartList, SmartList,
  emailVerifications, InsertEmailVerification, EmailVerification,
  campaignRules, InsertCampaignRule, CampaignRule,
  agencyClients, InsertAgencyClient, AgencyClient,
  speedToLeadConfigs, InsertSpeedToLeadConfig, SpeedToLeadConfig,
  icpProfiles, InsertIcpProfile, IcpProfile,
  linkedinConnections, InsertLinkedinConnection, LinkedinConnection,
  techStackDetections, InsertTechStackDetection, TechStackDetection,
  aiAgents, InsertAiAgent, AiAgent,
  aiAgentLogs, InsertAiAgentLog, AiAgentLog,
  emailSequences, emailSequenceSteps, emailSequenceEnrollments,
  EmailSequence, EmailSequenceStep, EmailSequenceEnrollment,
  tasks, Task, InsertTask,
  capturePlans, CapturePlan, InsertCapturePlan,
  marketIntelReports, MarketIntelReport,
  knowledgeArticles, KnowledgeArticle,
  competitiveMaps, CompetitiveMap,
} from "../drizzle/schema";
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

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
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

// ─── Email Templates ─────────────────────────────────────────────

export async function getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.updatedAt));
}

export async function createEmailTemplate(data: InsertEmailTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailTemplates).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateEmailTemplate(
  id: number,
  userId: number,
  data: Partial<Pick<EmailTemplate, "name" | "subject" | "body">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates).set(data).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

export async function deleteEmailTemplate(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

// ─── Team Members ────────────────────────────────────────────────

export async function getTeamMembers(ownerId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId));
}

export async function addTeamMember(data: InsertTeamMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateTeamMemberRole(id: number, ownerId: number, role: "admin" | "agent" | "viewer"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamMembers).set({ role }).where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, ownerId)));
}

export async function removeTeamMember(id: number, ownerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamMembers).where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, ownerId)));
}

export async function assignLead(leadId: number, userId: number, assignedTo: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ assignedTo }).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

// ─── Webhook Configs ────────────────────────────────────────────

import {
  webhookConfigs, integrationLogs,
  type WebhookConfig, type InsertWebhookConfig,
  type IntegrationLog, type InsertIntegrationLog,
} from "../drizzle/schema";

export async function getWebhookConfigs(userId: number): Promise<WebhookConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookConfigs).where(eq(webhookConfigs.userId, userId)).orderBy(desc(webhookConfigs.createdAt));
}

export async function getActiveWebhookConfigs(userId: number, eventType: "generate" | "status_change" | "deal_close"): Promise<WebhookConfig[]> {
  const db = await getDb();
  if (!db) return [];
  const triggerCol = eventType === "generate" ? webhookConfigs.triggerOnGenerate
    : eventType === "status_change" ? webhookConfigs.triggerOnStatusChange
    : webhookConfigs.triggerOnDealClose;
  return db.select().from(webhookConfigs).where(
    and(eq(webhookConfigs.userId, userId), eq(webhookConfigs.isActive, true), eq(triggerCol, true))
  );
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

// ─── Integration Logs ───────────────────────────────────────────

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

// ─── Autopilot Configs ──────────────────────────────────────────

import {
  autopilotConfigs, autopilotRuns,
  type AutopilotConfig, type InsertAutopilotConfig,
  type AutopilotRun, type InsertAutopilotRun,
} from "../drizzle/schema";

export async function getAutopilotConfigs(userId: number): Promise<AutopilotConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotConfigs).where(eq(autopilotConfigs.userId, userId)).orderBy(desc(autopilotConfigs.createdAt));
}

export async function getAutopilotConfigById(id: number, userId: number): Promise<AutopilotConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(autopilotConfigs).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
  return rows[0];
}

export async function createAutopilotConfig(data: InsertAutopilotConfig): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(autopilotConfigs).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateAutopilotConfig(
  id: number, userId: number,
  data: Partial<Omit<AutopilotConfig, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autopilotConfigs).set(data).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
}

export async function deleteAutopilotConfig(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(autopilotConfigs).where(and(eq(autopilotConfigs.id, id), eq(autopilotConfigs.userId, userId)));
}

export async function getDueAutopilotConfigs(): Promise<AutopilotConfig[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(autopilotConfigs).where(
    and(
      eq(autopilotConfigs.isActive, true),
      lte(autopilotConfigs.nextRunAt, now)
    )
  );
}

// ─── Autopilot Runs ─────────────────────────────────────────────

export async function getAutopilotRuns(configId: number, limit = 20): Promise<AutopilotRun[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotRuns).where(eq(autopilotRuns.configId, configId)).orderBy(desc(autopilotRuns.startedAt)).limit(limit);
}

export async function getRecentAutopilotRuns(userId: number, limit = 10): Promise<AutopilotRun[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autopilotRuns).where(eq(autopilotRuns.userId, userId)).orderBy(desc(autopilotRuns.startedAt)).limit(limit);
}

export async function createAutopilotRun(data: InsertAutopilotRun): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(autopilotRuns).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateAutopilotRun(id: number, data: Partial<Omit<AutopilotRun, "id">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(autopilotRuns).set(data).where(eq(autopilotRuns.id, id));
}

// ─── B2B Match Profiles ────────────────────────────────────────

import {
  matchProfiles,
  type MatchProfile, type InsertMatchProfile,
} from "../drizzle/schema";

export async function getMatchProfiles(userId: number): Promise<MatchProfile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchProfiles).where(eq(matchProfiles.userId, userId)).orderBy(desc(matchProfiles.createdAt));
}

export async function getMatchProfileById(id: number, userId: number): Promise<MatchProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(matchProfiles).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
  return rows[0];
}

export async function createMatchProfile(data: InsertMatchProfile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchProfiles).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateMatchProfile(
  id: number, userId: number,
  data: Partial<Omit<MatchProfile, "id" | "userId" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matchProfiles).set(data).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
}

export async function deleteMatchProfile(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(matchProfiles).where(and(eq(matchProfiles.id, id), eq(matchProfiles.userId, userId)));
}

// ─── AI SDR Campaigns ──────────────────────────────────────────

import {
  sdrCampaigns, sdrActivities,
  type SdrCampaign, type InsertSdrCampaign,
  type SdrActivity, type InsertSdrActivity,
} from "../drizzle/schema";

export async function getSdrCampaigns(userId: number): Promise<SdrCampaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sdrCampaigns).where(eq(sdrCampaigns.userId, userId)).orderBy(desc(sdrCampaigns.createdAt));
}

export async function getSdrCampaignById(id: number, userId: number): Promise<SdrCampaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(sdrCampaigns).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
  return rows[0];
}

export async function createSdrCampaign(data: InsertSdrCampaign): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sdrCampaigns).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSdrCampaign(
  id: number, userId: number,
  data: Partial<Omit<SdrCampaign, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sdrCampaigns).set(data).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
}

export async function deleteSdrCampaign(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sdrCampaigns).where(and(eq(sdrCampaigns.id, id), eq(sdrCampaigns.userId, userId)));
}

export async function getSdrActivities(campaignId: number, limit = 50): Promise<SdrActivity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sdrActivities).where(eq(sdrActivities.campaignId, campaignId)).orderBy(desc(sdrActivities.createdAt)).limit(limit);
}

export async function createSdrActivity(data: InsertSdrActivity): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sdrActivities).values(data);
  return (result[0] as any).insertId as number;
}

// ─── NBA Recommendations ───────────────────────────────────────

import {
  nbaRecommendations,
  type NbaRecommendation, type InsertNbaRecommendation,
} from "../drizzle/schema";

export async function getNbaRecommendations(userId: number, status?: string, limit = 20): Promise<NbaRecommendation[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(nbaRecommendations.userId, userId)];
  if (status) conditions.push(eq(nbaRecommendations.status, status as any));
  return db.select().from(nbaRecommendations).where(and(...conditions)).orderBy(desc(nbaRecommendations.priority)).limit(limit);
}

export async function createNbaRecommendation(data: InsertNbaRecommendation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nbaRecommendations).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateNbaRecommendation(
  id: number, userId: number,
  data: Partial<Pick<NbaRecommendation, "status" | "actionedAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(nbaRecommendations).set(data).where(and(eq(nbaRecommendations.id, id), eq(nbaRecommendations.userId, userId)));
}

export async function deleteNbaRecommendation(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(nbaRecommendations).where(and(eq(nbaRecommendations.id, id), eq(nbaRecommendations.userId, userId)));
}

// ─── Social Listening ──────────────────────────────────────────

import {
  socialMonitors, socialSignals,
  type SocialMonitor, type InsertSocialMonitor,
  type SocialSignal, type InsertSocialSignal,
} from "../drizzle/schema";

export async function getSocialMonitors(userId: number): Promise<SocialMonitor[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialMonitors).where(eq(socialMonitors.userId, userId)).orderBy(desc(socialMonitors.createdAt));
}

export async function getSocialMonitorById(id: number, userId: number): Promise<SocialMonitor | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(socialMonitors).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
  return rows[0];
}

export async function createSocialMonitor(data: InsertSocialMonitor): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialMonitors).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSocialMonitor(
  id: number, userId: number,
  data: Partial<Omit<SocialMonitor, "id" | "userId" | "createdAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialMonitors).set(data).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
}

export async function deleteSocialMonitor(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(socialMonitors).where(and(eq(socialMonitors.id, id), eq(socialMonitors.userId, userId)));
}

export async function getSocialSignals(monitorId: number, limit = 50): Promise<SocialSignal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialSignals).where(eq(socialSignals.monitorId, monitorId)).orderBy(desc(socialSignals.createdAt)).limit(limit);
}

export async function getSocialSignalsByUser(userId: number, limit = 50): Promise<SocialSignal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialSignals).where(eq(socialSignals.userId, userId)).orderBy(desc(socialSignals.createdAt)).limit(limit);
}

export async function createSocialSignal(data: InsertSocialSignal): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialSignals).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateSocialSignal(
  id: number,
  data: Partial<Pick<SocialSignal, "convertedToLead" | "leadId">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialSignals).set(data).where(eq(socialSignals.id, id));
}

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

// ─── Agency Clients ───────────────────────────────────────────

export async function createAgencyClient(data: InsertAgencyClient): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agencyClients).values(data);
}

export async function getAgencyClientsByUser(userId: number): Promise<AgencyClient[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agencyClients).where(eq(agencyClients.agencyUserId, userId)).orderBy(desc(agencyClients.createdAt));
}

export async function updateAgencyClient(id: number, data: Partial<InsertAgencyClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agencyClients).set(data).where(eq(agencyClients.id, id));
}

export async function deleteAgencyClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agencyClients).where(and(eq(agencyClients.id, id), eq(agencyClients.agencyUserId, userId)));
}

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

// ─── AI Agents ────────────────────────────────────────────────

export async function createAiAgent(data: InsertAiAgent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiAgents).values(data);
}

export async function getAiAgentsByUser(userId: number): Promise<AiAgent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAgents).where(eq(aiAgents.userId, userId)).orderBy(desc(aiAgents.createdAt));
}

export async function updateAiAgent(id: number, data: Partial<InsertAiAgent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiAgents).set(data).where(eq(aiAgents.id, id));
}

export async function deleteAiAgent(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId)));
}

export async function getAiAgentById(id: number): Promise<AiAgent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).limit(1);
  return rows[0];
}

export async function createAiAgentLog(data: InsertAiAgentLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiAgentLogs).values(data);
}

export async function getAiAgentLogsByAgent(agentId: number): Promise<AiAgentLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAgentLogs).where(eq(aiAgentLogs.agentId, agentId)).orderBy(desc(aiAgentLogs.createdAt)).limit(50);
}

// ─── Onboarding ──────────────────────────────────────────────
export async function getOnboardingStatus(userId: number) {
  const db = await getDb();
  const [user] = await db.select({ onboardingCompleted: users.onboardingCompleted }).from(users).where(eq(users.id, userId));
  return user?.onboardingCompleted ?? false;
}

export async function completeOnboarding(userId: number) {
  const db = await getDb();
  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId));
  return true;
}

// ─── Email Sequences ─────────────────────────────────────────────
export async function getEmailSequences(userId: number): Promise<EmailSequence[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequences).where(eq(emailSequences.userId, userId));
}

export async function createEmailSequence(data: { userId: number; name: string; description?: string }): Promise<EmailSequence> {
  const db = await getDb();
  const [row] = await db!.insert(emailSequences).values({ userId: data.userId, name: data.name, description: data.description ?? null });
  const [seq] = await db!.select().from(emailSequences).where(eq(emailSequences.id, (row as any).insertId));
  return seq;
}

export async function deleteEmailSequence(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, id));
  await db.delete(emailSequenceEnrollments).where(eq(emailSequenceEnrollments.sequenceId, id));
  await db.delete(emailSequences).where(and(eq(emailSequences.id, id), eq(emailSequences.userId, userId)));
}

export async function getSequenceSteps(sequenceId: number): Promise<EmailSequenceStep[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, sequenceId));
}

export async function upsertSequenceSteps(sequenceId: number, steps: Array<{ stepNumber: number; delayDays: number; subject: string; body: string }>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, sequenceId));
  if (steps.length > 0) {
    await db.insert(emailSequenceSteps).values(steps.map(s => ({ sequenceId, ...s })));
  }
}

export async function enrollLeadInSequence(data: { sequenceId: number; leadId: number; userId: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const nextSendAt = new Date();
  await db.insert(emailSequenceEnrollments).values({ ...data, nextSendAt });
}

export async function getSequenceEnrollments(userId: number): Promise<EmailSequenceEnrollment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSequenceEnrollments).where(eq(emailSequenceEnrollments.userId, userId));
}

// ─── Tasks ───────────────────────────────────────────────────────
export async function getTasks(userId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  const [row] = await db!.insert(tasks).values(data);
  const [task] = await db!.select().from(tasks).where(eq(tasks.id, (row as any).insertId));
  return task;
}

export async function updateTask(id: number, userId: number, data: Partial<Pick<Task, "title" | "description" | "type" | "status" | "dueAt" | "reminderAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// ─── Capture Plans ───────────────────────────────────────────────
export async function getCapturePlans(userId: number): Promise<CapturePlan[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(capturePlans).where(eq(capturePlans.userId, userId));
}

export async function createCapturePlan(data: InsertCapturePlan): Promise<CapturePlan> {
  const db = await getDb();
  const [row] = await db!.insert(capturePlans).values(data);
  const [plan] = await db!.select().from(capturePlans).where(eq(capturePlans.id, (row as any).insertId));
  return plan;
}

export async function updateCapturePlan(id: number, userId: number, data: Partial<Pick<CapturePlan, "title" | "companyName" | "stage" | "notes" | "estimatedValue" | "probability" | "expectedCloseAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(capturePlans).set(data).where(and(eq(capturePlans.id, id), eq(capturePlans.userId, userId)));
}

export async function deleteCapturePlan(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(capturePlans).where(and(eq(capturePlans.id, id), eq(capturePlans.userId, userId)));
}

// ─── Market Intelligence Reports ─────────────────────────────────
export async function getMarketIntelReports(userId: number): Promise<MarketIntelReport[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketIntelReports).where(eq(marketIntelReports.userId, userId));
}

export async function saveMarketIntelReport(userId: number, industry: string, reportData: string): Promise<MarketIntelReport> {
  const db = await getDb();
  const [row] = await db!.insert(marketIntelReports).values({ userId, industry, reportData });
  const [report] = await db!.select().from(marketIntelReports).where(eq(marketIntelReports.id, (row as any).insertId));
  return report;
}

// ─── Knowledge Articles ───────────────────────────────────────────
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeArticles);
}

export async function seedKnowledgeArticles(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(knowledgeArticles);
  if (existing.length > 0) return;
  await db.insert(knowledgeArticles).values([
    { category: "Pipeline Development", title: "Building a 12-Month B2B Pipeline", content: "A strong pipeline requires identifying opportunities before your competitors. Start by mapping your ideal customer profile (ICP), then use multi-source prospecting: LinkedIn, industry databases, and intent data signals. Aim for 3x your revenue target in pipeline value at all times.", readTime: 5 },
    { category: "Pipeline Development", title: "Bid/No-Bid Decision Framework", content: "Before pursuing any opportunity, score it on: Strategic fit (0-10), Win probability (0-10), Revenue potential (0-10), Resource availability (0-10). Only pursue opportunities scoring 28+. This prevents wasted effort on low-probability deals.", readTime: 4 },
    { category: "Outreach & Capture", title: "Cold Email Best Practices for B2B", content: "Effective cold emails are short (under 100 words), hyper-personalized, and focused on the prospect's pain — not your product. Use a 3-step structure: 1) Personalized opener referencing their specific situation, 2) One-line value proposition, 3) Low-friction CTA (15-min call, not a demo).", readTime: 6 },
    { category: "Outreach & Capture", title: "Capture Management: From Opportunity to Win", content: "Capture management is the process of positioning yourself to win before an RFP drops. Key steps: 1) Identify the opportunity 6-12 months early, 2) Build relationships with decision-makers, 3) Shape requirements through whitepapers and thought leadership, 4) Assemble your team and identify gaps, 5) Develop win themes.", readTime: 7 },
    { category: "Market Intelligence", title: "Competitive Analysis Framework", content: "Map your competitors across 4 dimensions: 1) Strengths (what they do better than you), 2) Weaknesses (where they fall short), 3) Pricing (how they position on price), 4) Customer base (who they serve). Use this to identify positioning gaps and differentiation opportunities.", readTime: 5 },
    { category: "Market Intelligence", title: "Using Intent Data to Prioritize Leads", content: "Intent data reveals which companies are actively researching solutions like yours. Prioritize leads showing: website visits to competitor pages, job postings for roles your solution replaces, content downloads related to your category, and social media engagement with industry topics.", readTime: 4 },
    { category: "Closing & Negotiation", title: "Proposal Writing That Wins", content: "Winning proposals are customer-centric, not product-centric. Structure: 1) Executive Summary (restate their problem), 2) Understanding of Requirements, 3) Your Approach (methodology), 4) Team & Credentials, 5) Pricing, 6) Risk Mitigation. Always lead with their pain, not your features.", readTime: 8 },
    { category: "Closing & Negotiation", title: "Speed-to-Lead: Why Response Time Wins Deals", content: "Studies show that responding to a lead within 5 minutes increases conversion by 9x vs. responding after 30 minutes. Set up automated acknowledgment emails, use lead routing to the right rep, and track response time as a KPI. The first vendor to engage often wins.", readTime: 3 },
    { category: "Team & Process", title: "Building a High-Performance BD Team", content: "Structure your BD team with clear roles: 1) SDRs (prospecting and initial outreach), 2) AEs (discovery, demos, proposals), 3) Capture Managers (strategic opportunities), 4) Proposal Writers. Define clear handoff criteria between stages and track conversion rates at each stage.", readTime: 6 },
    { category: "Team & Process", title: "CRM Hygiene: Keeping Your Pipeline Clean", content: "A dirty CRM leads to bad forecasts and missed follow-ups. Establish rules: 1) Update lead status within 24h of contact, 2) Log every touchpoint, 3) Set next action date on every open opportunity, 4) Review and purge stale leads monthly. Pipeline reviews should happen weekly.", readTime: 4 },
  ]);
}

// ─── Competitive Maps ─────────────────────────────────────────────
export async function getCompetitiveMaps(userId: number): Promise<CompetitiveMap[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitiveMaps).where(eq(competitiveMaps.userId, userId));
}

export async function saveCompetitiveMap(userId: number, companyName: string, industry: string, mapData: string): Promise<CompetitiveMap> {
  const db = await getDb();
  const [row] = await db!.insert(competitiveMaps).values({ userId, companyName, industry, mapData });
  const [map] = await db!.select().from(competitiveMaps).where(eq(competitiveMaps.id, (row as any).insertId));
  return map;
}

// ─── AI Agent Memory ──────────────────────────────────────────────
import { aiAgentMemory, aiChatHistory, aiPerformanceLog } from "../drizzle/schema";
import type { InsertAiAgentMemory, InsertAiPerformanceLog, InsertAiChatHistory } from "../drizzle/schema";

export async function getAiMemory(userId: number, memoryType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(aiAgentMemory.userId, userId)];
  if (memoryType) conditions.push(eq(aiAgentMemory.memoryType, memoryType as any));
  return db.select().from(aiAgentMemory).where(and(...conditions)).orderBy(desc(aiAgentMemory.updatedAt)).limit(50);
}

export async function upsertAiMemory(
  userId: number,
  key: string,
  value: string,
  memoryType: "learning" | "optimization" | "preference" | "insight",
  confidence = 0.7
) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(aiAgentMemory)
    .where(and(eq(aiAgentMemory.userId, userId), eq(aiAgentMemory.key, key))).limit(1);
  if (existing.length > 0) {
    await db.update(aiAgentMemory)
      .set({ value, confidence: confidence.toFixed(2), usageCount: (existing[0].usageCount ?? 0) + 1 })
      .where(eq(aiAgentMemory.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(aiAgentMemory).values({ userId, key, value, memoryType, confidence: confidence.toFixed(2) });
  return (result as any).insertId as number;
}

export async function logAiPerformance(data: InsertAiPerformanceLog) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiPerformanceLog).values(data);
  return (result as any).insertId as number;
}

export async function getAiPerformanceLogs(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPerformanceLog)
    .where(eq(aiPerformanceLog.userId, userId))
    .orderBy(desc(aiPerformanceLog.createdAt)).limit(limit);
}

export async function saveChatMessage(data: InsertAiChatHistory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiChatHistory).values(data);
  return (result as any).insertId as number;
}

export async function getChatHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .orderBy(aiChatHistory.createdAt).limit(limit);
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiChatHistory).where(eq(aiChatHistory.userId, userId));
}
