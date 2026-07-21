import {
  int,
  bigint,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Connected Projects (Multi-Project API Hub) ──────────────────
export const connectedProjects = mysqlTable("connected_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 512 }),
  category: varchar("category", { length: 64 }).default("ecommerce"), // ecommerce, saas, content, affiliate, other
  apiKey: varchar("apiKey", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConnectedProject = typeof connectedProjects.$inferSelect;
export type InsertConnectedProject = typeof connectedProjects.$inferInsert;

// ─── Project Events (inbound analytics data) ─────────────────────
export const projectEvents = mysqlTable("project_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(), // sale, pageview, signup, refund, adspend, custom
  value: decimal("value", { precision: 14, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  metadata: text("metadata"), // JSON string for extra fields (orderId, productName, source, etc.)
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProjectEvent = typeof projectEvents.$inferSelect;
export type InsertProjectEvent = typeof projectEvents.$inferInsert;

// ─── Ad Campaigns (Meta Ads / Google Ads ROAS/PNO tracking) ──────────────────
export const adCampaigns = mysqlTable("ad_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),  // FK to connectedProjects.id (nullable)
  name: varchar("name", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull().default("meta"), // meta | google | linkedin | other
  externalCampaignId: varchar("externalCampaignId", { length: 255 }),
  adSpend: decimal("adSpend", { precision: 12, scale: 2 }).notNull().default("0"),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  conversions: int("conversions").notNull().default(0),
  clicks: int("clicks").notNull().default(0),
  impressions: int("impressions").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
  periodStart: bigint("periodStart", { mode: "number" }),
  periodEnd: bigint("periodEnd", { mode: "number" }),
  notes: text("notes"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = typeof adCampaigns.$inferInsert;

// ─── Ad Campaign Snapshots (historical ROAS/PNO data points for trend charts) ─
export const adCampaignSnapshots = mysqlTable("ad_campaign_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  snapshotDate: varchar("snapshotDate", { length: 10 }).notNull(), // "YYYY-MM-DD"
  adSpend: decimal("adSpend", { precision: 12, scale: 2 }).notNull().default("0"),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  conversions: int("conversions").notNull().default(0),
  clicks: int("clicks").notNull().default(0),
  roas: decimal("roas", { precision: 8, scale: 4 }).notNull().default("0"),
  pno: decimal("pno", { precision: 8, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdCampaignSnapshot = typeof adCampaignSnapshots.$inferSelect;
export type InsertAdCampaignSnapshot = typeof adCampaignSnapshots.$inferInsert;

// ─── Portfolio Share Tokens (read-only public ROAS report links) ──
export const portfolioShareTokens = mysqlTable("portfolio_share_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).default("Portfolio ROAS Report"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PortfolioShareToken = typeof portfolioShareTokens.$inferSelect;
export type InsertPortfolioShareToken = typeof portfolioShareTokens.$inferInsert;

// ─── Ingested Leads (from external projects via /api/leads/ingest) ────────────────
export const ingestedLeads = mysqlTable("ingested_leads", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id"),           // FK to connectedProjects.id (nullable if unknown project)
  projectName: varchar("project_name", { length: 128 }).notNull(), // e.g. "bezmasajidla.cz"
  source: varchar("source", { length: 128 }).notNull(),            // project slug / identifier
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  interest: varchar("interest", { length: 512 }),
  pageUrl: text("page_url"),
  utmSource: varchar("utm_source", { length: 128 }),
  utmMedium: varchar("utm_medium", { length: 128 }),
  utmCampaign: varchar("utm_campaign", { length: 128 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  extraData: json("extra_data").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "disqualified"]).default("new").notNull(),
  assignedUserId: int("assigned_user_id"),  // OPTIHUB user who owns this lead
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type IngestedLead = typeof ingestedLeads.$inferSelect;
export type InsertIngestedLead = typeof ingestedLeads.$inferInsert;

// ─── Project Orchestration (Tasks, Milestones, Heartbeats) ────────

export const projectTasks = mysqlTable("project_tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "completed", "failed"]).default("todo").notNull(),
  manusTaskId: varchar("manusTaskId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;

export const projectMilestones = mysqlTable("project_milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

export const heartbeatJobs = mysqlTable("heartbeat_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobName: varchar("jobName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed", "timeout"]).default("running").notNull(),
  lastRunAt: timestamp("lastRunAt").defaultNow().notNull(),
  nextRunAt: timestamp("nextRunAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HeartbeatJob = typeof heartbeatJobs.$inferSelect;
export type InsertHeartbeatJob = typeof heartbeatJobs.$inferInsert;
