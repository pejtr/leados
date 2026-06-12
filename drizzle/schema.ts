import {
  int,
  bigint,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
  decimal,
  tinyint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("free"),
  subscriptionPlan: varchar("subscriptionPlan", { length: 32 }).default("free"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Lead Sessions ──────────────────────────────────────────────
export const leadSessions = mysqlTable("lead_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  location: varchar("location", { length: 128 }).notNull(),
  seniorityLevel: varchar("seniorityLevel", { length: 64 }).notNull(),
  requestedCount: int("requestedCount").notNull(),
  generatedCount: int("generatedCount").default(0).notNull(),
  enrichedCount: int("enrichedCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "running", "done", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type LeadSession = typeof leadSessions.$inferSelect;
export type InsertLeadSession = typeof leadSessions.$inferInsert;

// ─── Leads ──────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),

  // Company info
  companyName: varchar("companyName", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 512 }),
  industry: varchar("industry", { length: 128 }).notNull(),
  location: varchar("location", { length: 128 }),
  companySize: varchar("companySize", { length: 64 }),
  seniorityLevel: varchar("seniorityLevel", { length: 64 }),
  contactName: varchar("contactName", { length: 256 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  companyDescription: text("companyDescription"),

  // AI enrichment
  icebreaker: text("icebreaker"),
  isEnriched: boolean("isEnriched").default(false).notNull(),

  // Data source
  dataSource: mysqlEnum("dataSource", ["mock", "linkedin_apify", "xing_apify"]).default("mock").notNull(),

  // Pipeline status
  status: mysqlEnum("status", ["new", "contacted", "replied", "qualified", "disqualified"]).default("new").notNull(),

  // Quality rating
  qualityRating: mysqlEnum("qualityRating", ["good", "bad"]),
  qualityNote: varchar("qualityNote", { length: 256 }),

  // ROI tracking
  dealValue: decimal("dealValue", { precision: 12, scale: 2 }),
  dealClosed: boolean("dealClosed").default(false).notNull(),
  dealClosedAt: timestamp("dealClosedAt"),
  currency: varchar("currency", { length: 8 }).default("USD"),

  // Team assignment
  assignedTo: int("assignedTo"),

  // Segment preset
  segment: varchar("segment", { length: 64 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Email Templates ────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Team Members ───────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["admin", "agent", "viewer"]).default("agent").notNull(),
  status: mysqlEnum("status", ["pending", "active"]).default("pending").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Webhook Configs (Legacy — use webhookLogs for new integration) ────────
// Old webhook_configs table kept for backward compatibility
// New integrations should use webhookLogs + webhookConfigs from CRM integration

// ─── Integration Logs ───────────────────────────────────────────
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  webhookConfigId: int("webhookConfigId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(), // generate, status_change, deal_close, test
  payload: text("payload"), // JSON stringified payload sent
  responseStatus: int("responseStatus"), // HTTP status code
  responseBody: text("responseBody"), // truncated response
  success: boolean("success").default(false).notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;

// ─── Autopilot Configs ─────────────────────────────────────────
export const autopilotConfigs = mysqlTable("autopilot_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  location: varchar("location", { length: 128 }).notNull(),
  seniorityLevel: varchar("seniorityLevel", { length: 64 }).notNull(),
  leadCount: int("leadCount").default(10).notNull(),
  segment: varchar("segment", { length: 64 }),
  // Schedule: cron-like
  scheduleType: mysqlEnum("scheduleType", ["daily", "weekly", "monthly"]).default("weekly").notNull(),
  scheduleDayOfWeek: int("scheduleDayOfWeek").default(1), // 0=Sun, 1=Mon...
  scheduleHour: int("scheduleHour").default(9).notNull(), // 0-23 UTC
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  totalRuns: int("totalRuns").default(0).notNull(),
  totalLeadsGenerated: int("totalLeadsGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutopilotConfig = typeof autopilotConfigs.$inferSelect;
export type InsertAutopilotConfig = typeof autopilotConfigs.$inferInsert;

// ─── Autopilot Runs ────────────────────────────────────────────
export const autopilotRuns = mysqlTable("autopilot_runs", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed"]).default("running").notNull(),
  leadsGenerated: int("leadsGenerated").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AutopilotRun = typeof autopilotRuns.$inferSelect;
export type InsertAutopilotRun = typeof autopilotRuns.$inferInsert;

// ─── NBA Recommendations ───────────────────────────────────────
export const nbaRecommendations = mysqlTable("nba_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  action: mysqlEnum("action", ["call", "email", "linkedin", "qualify", "disqualify", "wait"]).notNull(),
  priority: int("priority").default(50).notNull(),
  reason: text("reason").notNull(),
  aiScore: int("aiScore").default(50).notNull(),
  status: mysqlEnum("status", ["pending", "actioned", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  actionedAt: timestamp("actionedAt"),
});

export type NbaRecommendation = typeof nbaRecommendations.$inferSelect;
export type InsertNbaRecommendation = typeof nbaRecommendations.$inferInsert;

// ─── B2B Match Profiles ────────────────────────────────────────
export const matchProfiles = mysqlTable("match_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  industries: text("industries").notNull(),
  companySizeMin: int("companySizeMin").default(10),
  companySizeMax: int("companySizeMax").default(500),
  revenueMin: varchar("revenueMin", { length: 32 }),
  revenueMax: varchar("revenueMax", { length: 32 }),
  locations: text("locations").notNull(),
  keywords: text("keywords"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchProfile = typeof matchProfiles.$inferSelect;
export type InsertMatchProfile = typeof matchProfiles.$inferInsert;

// ─── AI SDR Campaigns ─────────────────────────────────────────
export const sdrCampaigns = mysqlTable("sdr_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  location: varchar("location", { length: 128 }).notNull().default(""),
  seniorityLevel: varchar("seniorityLevel", { length: 64 }).notNull().default("C-Level"),
  leadCount: int("leadCount").default(20).notNull(),
  emailSubject: varchar("emailSubject", { length: 256 }),
  emailTone: mysqlEnum("emailTone", ["professional", "friendly", "direct"]).default("professional").notNull(),
  followUpDays: int("followUpDays").default(3).notNull(),
  maxFollowUps: int("maxFollowUps").default(2).notNull(),
  leadsGenerated: int("leadsGenerated").default(0).notNull(),
  emailsSent: int("emailsSent").default(0).notNull(),
  replies: int("replies").default(0).notNull(),
  meetings: int("meetings").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SdrCampaign = typeof sdrCampaigns.$inferSelect;
export type InsertSdrCampaign = typeof sdrCampaigns.$inferInsert;

export const sdrActivities = mysqlTable("sdr_activities", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId"),
  type: mysqlEnum("type", ["lead_generated", "email_sent", "reply_received", "meeting_booked", "follow_up_sent"]).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SdrActivity = typeof sdrActivities.$inferSelect;
export type InsertSdrActivity = typeof sdrActivities.$inferInsert;

// ─── Social Listening ─────────────────────────────────────────
export const socialMonitors = mysqlTable("social_monitors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  keywords: text("keywords").notNull(),
  platforms: varchar("platforms", { length: 128 }).notNull().default("linkedin"),
  isActive: boolean("isActive").default(true).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  signalsFound: int("signalsFound").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialMonitor = typeof socialMonitors.$inferSelect;
export type InsertSocialMonitor = typeof socialMonitors.$inferInsert;

export const socialSignals = mysqlTable("social_signals", {
  id: int("id").autoincrement().primaryKey(),
  monitorId: int("monitorId").notNull(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "reddit", "twitter"]).notNull(),
  authorName: varchar("authorName", { length: 128 }),
  authorTitle: varchar("authorTitle", { length: 128 }),
  authorCompany: varchar("authorCompany", { length: 128 }),
  content: text("content").notNull(),
  url: varchar("url", { length: 512 }),
  matchedKeyword: varchar("matchedKeyword", { length: 128 }),
  convertedToLead: boolean("convertedToLead").default(false).notNull(),
  leadId: int("leadId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialSignal = typeof socialSignals.$inferSelect;
export type InsertSocialSignal = typeof socialSignals.$inferInsert;

// ─── Website Tracking Pixels ──────────────────────────────────
export const trackingPixels = mysqlTable("tracking_pixels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  domain: varchar("domain", { length: 256 }).notNull(),
  pixelCode: text("pixelCode").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  totalVisitors: int("totalVisitors").default(0).notNull(),
  identifiedCompanies: int("identifiedCompanies").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackingPixel = typeof trackingPixels.$inferSelect;
export type InsertTrackingPixel = typeof trackingPixels.$inferInsert;

// ─── Visitor Sessions (tracked by pixel) ──────────────────────
export const visitorSessions = mysqlTable("visitor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  pixelId: int("pixelId").notNull(),
  userId: int("userId").notNull(),
  visitorIp: varchar("visitorIp", { length: 64 }),
  companyName: varchar("companyName", { length: 256 }),
  companyDomain: varchar("companyDomain", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  location: varchar("location", { length: 128 }),
  pageViews: int("pageViews").default(1).notNull(),
  intentScore: int("intentScore").default(0).notNull(), // 0-100
  isIsp: boolean("isIsp").default(false).notNull(), // AI ISP filtering
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
});

export type VisitorSession = typeof visitorSessions.$inferSelect;
export type InsertVisitorSession = typeof visitorSessions.$inferInsert;

// ─── Visitor Page Views (journey analytics) ───────────────────
export const visitorPageViews = mysqlTable("visitor_page_views", {
  id: int("id").autoincrement().primaryKey(),
  visitorSessionId: int("visitorSessionId").notNull(),
  pageUrl: varchar("pageUrl", { length: 512 }).notNull(),
  pageTitle: varchar("pageTitle", { length: 256 }),
  timeOnPage: int("timeOnPage").default(0), // seconds
  scrollDepth: int("scrollDepth").default(0), // percentage 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorPageView = typeof visitorPageViews.$inferSelect;
export type InsertVisitorPageView = typeof visitorPageViews.$inferInsert;

// ─── Smart Alert Rules ────────────────────────────────────────
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  // Condition: what triggers the alert
  conditionType: mysqlEnum("conditionType", [
    "high_intent_visitor", "new_lead_generated", "lead_status_change",
    "deal_closed", "visitor_returning", "keyword_match"
  ]).notNull(),
  conditionValue: varchar("conditionValue", { length: 256 }), // e.g. threshold, keyword
  // Channel
  channel: mysqlEnum("channel", ["email", "slack", "webhook"]).notNull(),
  channelTarget: text("channelTarget").notNull(), // email address, slack webhook, or webhook URL
  isActive: boolean("isActive").default(true).notNull(),
  totalFired: int("totalFired").default(0).notNull(),
  lastFiredAt: timestamp("lastFiredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

// ─── Smart Lists ──────────────────────────────────────────────
export const smartLists = mysqlTable("smart_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  // Filters stored as JSON
  filters: text("filters").notNull(), // JSON: { industry, status, minScore, dateRange, etc. }
  autoRefresh: boolean("autoRefresh").default(false).notNull(),
  refreshInterval: mysqlEnum("refreshInterval", ["hourly", "daily", "weekly"]).default("daily"),
  leadCount: int("leadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmartList = typeof smartLists.$inferSelect;
export type InsertSmartList = typeof smartLists.$inferInsert;

// ─── Email Verifications ──────────────────────────────────────
export const emailVerifications = mysqlTable("email_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["valid", "invalid", "risky", "unknown", "pending"]).default("pending").notNull(),
  provider: varchar("provider", { length: 64 }).default("bouncer"),
  score: int("score"), // 0-100
  reason: varchar("reason", { length: 256 }),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;

// ─── Condition-Based Campaigns (If/Then) ──────────────────────
export const campaignRules = mysqlTable("campaign_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  // IF condition
  triggerType: mysqlEnum("triggerType", [
    "lead_created", "status_changed", "email_opened", "email_replied",
    "intent_score_above", "visitor_returned", "deal_value_above"
  ]).notNull(),
  triggerValue: varchar("triggerValue", { length: 256 }),
  // THEN action
  actionType: mysqlEnum("actionType", [
    "send_email", "change_status", "assign_to", "add_to_list",
    "send_webhook", "send_slack", "create_task"
  ]).notNull(),
  actionValue: text("actionValue"), // JSON config for the action
  isActive: boolean("isActive").default(true).notNull(),
  totalExecutions: int("totalExecutions").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignRule = typeof campaignRules.$inferSelect;
export type InsertCampaignRule = typeof campaignRules.$inferInsert;

// ─── Agency Panel (multi-tenant) ──────────────────────────────
export const agencyClients = mysqlTable("agency_clients", {
  id: int("id").autoincrement().primaryKey(),
  agencyUserId: int("agencyUserId").notNull(), // the agency owner
  clientName: varchar("clientName", { length: 256 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientDomain: varchar("clientDomain", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  brandColor: varchar("brandColor", { length: 16 }),
  brandLogo: text("brandLogo"),
  totalLeads: int("totalLeads").default(0).notNull(),
  totalCampaigns: int("totalCampaigns").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgencyClient = typeof agencyClients.$inferSelect;
export type InsertAgencyClient = typeof agencyClients.$inferInsert;

// ─── Speed-to-Lead ────────────────────────────────────────────
export const speedToLeadConfigs = mysqlTable("speed_to_lead_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Auto-response settings
  autoEmailEnabled: boolean("autoEmailEnabled").default(true).notNull(),
  autoEmailTemplateId: int("autoEmailTemplateId"), // FK to email_templates
  responseDelaySeconds: int("responseDelaySeconds").default(60).notNull(), // how fast to respond
  // Notification
  notifyOnNewLead: boolean("notifyOnNewLead").default(true).notNull(),
  notifyChannel: mysqlEnum("notifyChannel", ["email", "slack", "both"]).default("email"),
  notifyTarget: text("notifyTarget"),
  totalAutoResponses: int("totalAutoResponses").default(0).notNull(),
  avgResponseTime: int("avgResponseTime").default(0), // seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpeedToLeadConfig = typeof speedToLeadConfigs.$inferSelect;
export type InsertSpeedToLeadConfig = typeof speedToLeadConfigs.$inferInsert;

// ─── ICP Builder ──────────────────────────────────────────────
export const icpProfiles = mysqlTable("icp_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  // Firmographic
  industries: text("industries").notNull(),
  companySizeMin: int("companySizeMin").default(10),
  companySizeMax: int("companySizeMax").default(500),
  revenueRange: varchar("revenueRange", { length: 64 }),
  locations: text("locations").notNull(),
  // Technographic
  technologies: text("technologies"),
  // Behavioral
  buyingSignals: text("buyingSignals"),
  painPoints: text("painPoints"),
  // Scoring
  fitScore: int("fitScore").default(0), // AI-calculated 0-100
  matchedLeads: int("matchedLeads").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IcpProfile = typeof icpProfiles.$inferSelect;
export type InsertIcpProfile = typeof icpProfiles.$inferInsert;

// ─── LinkedIn Mutual Connections ──────────────────────────────
export const linkedinConnections = mysqlTable("linkedin_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  connectionName: varchar("connectionName", { length: 256 }).notNull(),
  connectionTitle: varchar("connectionTitle", { length: 256 }),
  connectionCompany: varchar("connectionCompany", { length: 256 }),
  connectionLinkedinUrl: varchar("connectionLinkedinUrl", { length: 512 }),
  relationshipStrength: mysqlEnum("relationshipStrength", ["strong", "moderate", "weak"]).default("moderate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LinkedinConnection = typeof linkedinConnections.$inferSelect;
export type InsertLinkedinConnection = typeof linkedinConnections.$inferInsert;

// ─── Tech Stack Detection ─────────────────────────────────────
export const techStackDetections = mysqlTable("tech_stack_detections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  domain: varchar("domain", { length: 256 }).notNull(),
  technologies: text("technologies").notNull(), // JSON array of detected techs
  categories: text("categories"), // JSON: { cms, analytics, marketing, etc. }
  lastScannedAt: timestamp("lastScannedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TechStackDetection = typeof techStackDetections.$inferSelect;
export type InsertTechStackDetection = typeof techStackDetections.$inferInsert;

// ─── AI Agents (multi-agent orchestration) ────────────────────
export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  agentType: mysqlEnum("agentType", ["lead_qualifier", "email_writer", "data_enricher", "meeting_scheduler", "custom"]).default("custom").notNull(),
  config: text("config").notNull(), // JSON config for the agent
  isActive: boolean("isActive").default(false).notNull(),
  totalExecutions: int("totalExecutions").default(0).notNull(),
  successRate: int("successRate").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = typeof aiAgents.$inferInsert;

export const aiAgentLogs = mysqlTable("ai_agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId").notNull(),
  input: text("input"),
  output: text("output"),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).default("success").notNull(),
  durationMs: int("durationMs").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiAgentLog = typeof aiAgentLogs.$inferSelect;
export type InsertAiAgentLog = typeof aiAgentLogs.$inferInsert;

// ─── Email Sequences ─────────────────────────────────────────────
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailSequenceSteps = mysqlTable("email_sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  delayDays: int("delayDays").default(0).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  stepType: mysqlEnum("stepType", ["email", "linkedin_connect", "linkedin_message", "call"]).default("email").notNull(),
  linkedinNote: text("linkedinNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailSequenceEnrollments = mysqlTable("email_sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "unsubscribed"]).default("active").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  nextSendAt: timestamp("nextSendAt"),
  completedAt: timestamp("completedAt"),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;
export type EmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferSelect;

// ─── Tasks / Activity Tracker ────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["call", "email", "meeting", "follow_up", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["pending", "done", "cancelled"]).default("pending").notNull(),
  dueAt: timestamp("dueAt"),
  reminderAt: timestamp("reminderAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Capture Plans ───────────────────────────────────────────────
export const capturePlans = mysqlTable("capture_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  title: varchar("title", { length: 512 }).notNull(),
  companyName: varchar("companyName", { length: 256 }),
  stage: mysqlEnum("stage", ["identify", "research", "outreach", "qualify", "propose", "close"]).default("identify").notNull(),
  notes: text("notes"),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  probability: int("probability").default(10),
  expectedCloseAt: timestamp("expectedCloseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapturePlan = typeof capturePlans.$inferSelect;
export type InsertCapturePlan = typeof capturePlans.$inferInsert;

// ─── Market Intelligence Reports ─────────────────────────────────
export const marketIntelReports = mysqlTable("market_intel_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  reportData: text("reportData").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type MarketIntelReport = typeof marketIntelReports.$inferSelect;

// ─── Knowledge Base Articles ──────────────────────────────────────
export const knowledgeArticles = mysqlTable("knowledge_articles", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  readTime: int("readTime").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;

// ─── Competitive Landscape ────────────────────────────────────────
export const competitiveMaps = mysqlTable("competitive_maps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  mapData: text("mapData").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type CompetitiveMap = typeof competitiveMaps.$inferSelect;

// ─── AI Agent Memory ──────────────────────────────────────────────
export const aiAgentMemory = mysqlTable("ai_agent_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memoryType: mysqlEnum("memoryType", ["learning", "optimization", "preference", "insight"]).notNull(),
  key: varchar("key", { length: 256 }).notNull(),
  value: text("value").notNull(),
  confidence: decimal("confidence", { precision: 4, scale: 2 }).default("0.50"),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAgentMemory = typeof aiAgentMemory.$inferSelect;
export type InsertAiAgentMemory = typeof aiAgentMemory.$inferInsert;

// ─── AI Performance Log ───────────────────────────────────────────
export const aiPerformanceLog = mysqlTable("ai_performance_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleType: mysqlEnum("cycleType", ["scheduled", "manual", "triggered"]).default("scheduled").notNull(),
  metricsSnapshot: text("metricsSnapshot").notNull(), // JSON: leads, conversion, pipeline stats
  actionsPerformed: text("actionsPerformed").notNull(), // JSON: array of actions taken
  improvements: text("improvements").notNull(), // JSON: what was improved
  score: decimal("score", { precision: 5, scale: 2 }).default("0.00"), // performance score 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiPerformanceLog = typeof aiPerformanceLog.$inferSelect;
export type InsertAiPerformanceLog = typeof aiPerformanceLog.$inferInsert;

// ─── AI Chat History ──────────────────────────────────────────────
export const aiChatHistory = mysqlTable("ai_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  toolsUsed: text("toolsUsed"), // JSON: array of tool names used
  actionsExecuted: text("actionsExecuted"), // JSON: array of actions executed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;
// ─── User Persona Favorites ───────────────────────────────────────
export const userPersonaFavorites = mysqlTable("user_persona_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: varchar("personaId", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserPersonaFavorite = typeof userPersonaFavorites.$inferSelect;
export type InsertUserPersonaFavorite = typeof userPersonaFavorites.$inferInsert;
// ─── Persona Ratings ─────────────────────────────────────────────
export const personaRatings = mysqlTable("persona_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: varchar("personaId", { length: 100 }).notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  rating: mysqlEnum("rating", ["up", "down"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PersonaRating = typeof personaRatings.$inferSelect;
export type InsertPersonaRating = typeof personaRatings.$inferInsert;

// --- Morning Briefings ---
export const morningBriefings = mysqlTable("morning_briefings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  topLeads: text("topLeads"),
  pipelineAlerts: text("pipelineAlerts"),
  nextActions: text("nextActions"),
  dismissed: boolean("dismissed").default(false).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});
export type MorningBriefing = typeof morningBriefings.$inferSelect;
export type InsertMorningBriefing = typeof morningBriefings.$inferInsert;

// ─── Predictive Lead Scores ─────────────────────────────────────
export const predictiveScores = mysqlTable("predictive_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // 0.00 - 100.00
  scoreLabel: mysqlEnum("scoreLabel", ["hot", "warm", "cold"]).notNull(),
  factors: text("factors"), // JSON: [{factor, weight, value}]
  modelVersion: varchar("modelVersion", { length: 32 }).default("v1"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type PredictiveScore = typeof predictiveScores.$inferSelect;
export type InsertPredictiveScore = typeof predictiveScores.$inferInsert;

// ─── Meeting Links ────────────────────────────────────────────────
export const meetingLinks = mysqlTable("meeting_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  duration: int("duration").default(30).notNull(),
  description: text("description"),
  availabilityJson: text("availabilityJson"),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MeetingLink = typeof meetingLinks.$inferSelect;
export type InsertMeetingLink = typeof meetingLinks.$inferInsert;

// ─── Follow-up Sessions ───────────────────────────────────────────
export const followUpSessions = mysqlTable("follow_up_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "meeting_booked"]).default("active").notNull(),
  followUpCount: int("followUpCount").default(0).notNull(),
  maxFollowUps: int("maxFollowUps").default(5).notNull(),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  lastFollowUpAt: timestamp("lastFollowUpAt"),
  meetingBooked: boolean("meetingBooked").default(false).notNull(),
  meetingAt: timestamp("meetingAt"),
  meetingLinkId: int("meetingLinkId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FollowUpSession = typeof followUpSessions.$inferSelect;
export type InsertFollowUpSession = typeof followUpSessions.$inferInsert;

// ─── Call Recordings ─────────────────────────────────────────────
export const callRecordings = mysqlTable("call_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Url: text("s3Url").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  duration: int("duration"),
  transcription: text("transcription"),
  aiAnalysis: text("aiAnalysis"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  actionItems: text("actionItems"),
  callStatus: mysqlEnum("callStatus", ["uploaded", "transcribing", "analyzing", "done", "error"]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;


// ─── Sales CRM Super Module ──────────────────────────────────────

// Deals (prodejní příležitosti)
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  title: varchar("title", { length: 256 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  stage: mysqlEnum("stage", ["new", "qualified", "presentation", "proposal", "negotiation", "won", "lost"]).default("new").notNull(),
  probability: int("probability").default(0),
  expectedCloseDate: timestamp("expectedCloseDate"),
  lostReason: varchar("lostReason", { length: 512 }),
  lostTo: varchar("lostTo", { length: 256 }),
  wonAt: timestamp("wonAt"),
  aiScore: int("aiScore").default(0),
  aiScoreReasoning: text("aiScoreReasoning"),
  aiScoredAt: timestamp("aiScoredAt"),
  nextAction: text("nextAction"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// Deal Activities (aktivity na dealu)
export const dealActivities = mysqlTable("deal_activities", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "note", "task", "demo"]).notNull(),
  content: text("content"),
  duration: int("duration"),
  outcome: varchar("outcome", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DealActivity = typeof dealActivities.$inferSelect;
export type InsertDealActivity = typeof dealActivities.$inferInsert;

// Sales Playbooks
export const salesPlaybooks = mysqlTable("sales_playbooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["inbound", "outbound", "real_estate", "enterprise", "upsell"]).default("inbound").notNull(),
  stepsJson: text("stepsJson"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SalesPlaybook = typeof salesPlaybooks.$inferSelect;
export type InsertSalesPlaybook = typeof salesPlaybooks.$inferInsert;

// Commissions (provize)
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// Quotas (kvóty)
export const quotas = mysqlTable("quotas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: varchar("period", { length: 16 }).notNull(), // e.g. "2026-03", "2026-Q1"
  periodType: mysqlEnum("periodType", ["monthly", "quarterly", "yearly"]).default("monthly").notNull(),
  targetValue: decimal("targetValue", { precision: 12, scale: 2 }).notNull(),
  achievedValue: decimal("achievedValue", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Quota = typeof quotas.$inferSelect;
export type InsertQuota = typeof quotas.$inferInsert;

// Real Estate Listings (nemovitosti)
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  type: mysqlEnum("type", ["sale", "rent"]).default("sale").notNull(),
  propertyType: mysqlEnum("propertyType", ["apartment", "house", "land", "commercial", "garage", "other"]).default("apartment").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 512 }),
  city: varchar("city", { length: 128 }),
  district: varchar("district", { length: 128 }),
  price: decimal("price", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  area: decimal("area", { precision: 8, scale: 2 }),
  rooms: varchar("rooms", { length: 16 }),
  floor: int("floor"),
  totalFloors: int("totalFloors"),
  hasElevator: boolean("hasElevator").default(false),
  hasParking: boolean("hasParking").default(false),
  hasGarden: boolean("hasGarden").default(false),
  energyClass: varchar("energyClass", { length: 4 }),
  photosJson: text("photosJson"),
  portalSyncJson: text("portalSyncJson"),
  status: mysqlEnum("status", ["draft", "active", "reserved", "sold", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// Real Estate Transactions (transakce)
export const propertyTransactions = mysqlTable("property_transactions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  buyerName: varchar("buyerName", { length: 256 }),
  buyerEmail: varchar("buyerEmail", { length: 320 }),
  buyerPhone: varchar("buyerPhone", { length: 64 }),
  stage: mysqlEnum("stage", ["interest", "viewing", "reservation", "contract", "handover", "completed"]).default("interest").notNull(),
  reservationDate: timestamp("reservationDate"),
  contractDate: timestamp("contractDate"),
  handoverDate: timestamp("handoverDate"),
  finalPrice: decimal("finalPrice", { precision: 14, scale: 2 }),
  commission: decimal("commission", { precision: 12, scale: 2 }),
  documentsJson: text("documentsJson"),
  checklistJson: text("checklistJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PropertyTransaction = typeof propertyTransactions.$inferSelect;
export type InsertPropertyTransaction = typeof propertyTransactions.$inferInsert;

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

// ─── 5 Brains Analysis Sessions ─────────────────────────────────────────────
export const brainAnalyses = mysqlTable("brain_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  contextType: varchar("contextType", { length: 32 }).notNull().default("project"), // "project" | "campaign" | "custom"
  contextId: int("contextId"),       // projectId or campaignId (nullable for custom)
  contextData: text("contextData"),  // JSON snapshot of context passed to experts
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending | running | done | error
  // Individual expert outputs (stored as markdown text)
  pragmaticArchitect: text("pragmaticArchitect"),
  creativeVisionary: text("creativeVisionary"),
  criticalInvestor: text("criticalInvestor"),
  technicalPurist: text("technicalPurist"),
  growthHacker: text("growthHacker"),
  // Synthesized master report
  masterReport: text("masterReport"),
  // Advocate + Skeptic confidence scoring
  confidenceScore: int("confidenceScore"),           // 0-100 composite score
  advocateAnalysis: text("advocateAnalysis"),         // Advocate LLM output
  skepticAnalysis: text("skepticAnalysis"),           // Skeptic LLM output
  confidenceReasoning: text("confidenceReasoning"),   // Short explanation of the score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type BrainAnalysis = typeof brainAnalyses.$inferSelect;
export type InsertBrainAnalysis = typeof brainAnalyses.$inferInsert;

// Daily Report Configs
export const dailyReportConfigs = mysqlTable("daily_report_configs", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sendHour: int("send_hour").notNull().default(8), // UTC hour to send
  includeProjects: boolean("include_projects").notNull().default(true),
  includeCampaigns: boolean("include_campaigns").notNull().default(true),
  includeLeads: boolean("include_leads").notNull().default(true),
  lastSentAt: bigint("last_sent_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});

// AI Constitution — global company context injected into every AI call
export const aiConstitutions = mysqlTable("ai_constitutions", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  // Company identity
  companyName: varchar("company_name", { length: 255 }),
  companyDescription: text("company_description"),
  industry: varchar("industry", { length: 128 }),
  companySize: varchar("company_size", { length: 64 }),
  website: varchar("website", { length: 255 }),
  // ICP (Ideal Customer Profile)
  icpIndustries: text("icp_industries"),
  icpCompanySize: varchar("icp_company_size", { length: 64 }),
  icpSeniority: varchar("icp_seniority", { length: 128 }),
  icpGeography: varchar("icp_geography", { length: 255 }),
  icpPainPoints: text("icp_pain_points"),
  icpBuyingTriggers: text("icp_buying_triggers"),
  // Value proposition
  uniqueValueProp: text("unique_value_prop"),
  topCompetitors: text("top_competitors"),
  differentiators: text("differentiators"),
  // Communication style
  communicationTone: varchar("communication_tone", { length: 64 }).default("professional"),
  languageStyle: varchar("language_style", { length: 64 }).default("direct"),
  forbiddenWords: text("forbidden_words"),
  // Goals & priorities
  primaryGoal: varchar("primary_goal", { length: 128 }).default("generate_leads"),
  monthlyLeadTarget: int("monthly_lead_target"),
  avgDealValue: int("avg_deal_value"),
  salesCycleLength: varchar("sales_cycle_length", { length: 64 }),
  // Custom context
  customContext: text("custom_context"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type AiConstitution = typeof aiConstitutions.$inferSelect;
export type InsertAiConstitution = typeof aiConstitutions.$inferInsert;

// ── Captured Leads (exit-intent + smart popup email captures) ─────────────────
export const capturedLeads = mysqlTable("captured_leads", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  source: varchar("source", { length: 64 }).notNull().default("exit_intent"), // exit_intent | smart_popup | landing_cta
  firstName: varchar("first_name", { length: 128 }),
  utmSource: varchar("utm_source", { length: 128 }),
  utmMedium: varchar("utm_medium", { length: 128 }),
  utmCampaign: varchar("utm_campaign", { length: 128 }),
  pageUrl: text("page_url"),
  welcomeEmailSent: boolean("welcome_email_sent").notNull().default(false),
  welcomeEmailSentAt: bigint("welcome_email_sent_at", { mode: "number" }),
  convertedToUser: boolean("converted_to_user").notNull().default(false),
  convertedAt: bigint("converted_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type CapturedLead = typeof capturedLeads.$inferSelect;
export type InsertCapturedLead = typeof capturedLeads.$inferInsert;

// ── Benchmark Runs (persisted benchmark scores for correlation with confidence) ─
export const benchmarkRuns = mysqlTable("benchmark_runs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  totalScore: int("total_score").notNull().default(0),
  passRate: int("pass_rate").notNull().default(0),
  tasksRun: int("tasks_run").notNull().default(0),
  tierScores: json("tier_scores").$type<Record<string, number>>(),
  results: json("results").$type<Array<{ taskId: string; tier: string; score: number; passed: boolean; feedback: string }>>(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type BenchmarkRun = typeof benchmarkRuns.$inferSelect;
export type InsertBenchmarkRun = typeof benchmarkRuns.$inferInsert;

// ── HERMES — Core AI Orchestration Agent ──────────────────────────────────────
// HERMES is the meta-intelligence layer that routes, orchestrates, and synthesizes
// all sub-agents (5 Brains, NINJA BOTS, SDR, Benchmark, AI Advisor, Constitution).
export const hermesSessions = mysqlTable("hermes_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionName: varchar("session_name", { length: 255 }),
  intent: varchar("intent", { length: 64 }).notNull().default("general"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  messageCount: int("message_count").notNull().default(0),
  subAgentsUsed: json("sub_agents_used").$type<string[]>(),
  lastActivity: bigint("last_activity", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesSession = typeof hermesSessions.$inferSelect;
export type InsertHermesSession = typeof hermesSessions.$inferInsert;

export const hermesMessages = mysqlTable("hermes_messages", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  agentName: varchar("agent_name", { length: 64 }),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesMessage = typeof hermesMessages.$inferSelect;
export type InsertHermesMessage = typeof hermesMessages.$inferInsert;

export const hermesMissions = mysqlTable("hermes_missions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionId: int("session_id"),
  missionType: varchar("mission_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  plan: json("plan").$type<Array<{ step: string; agent: string; status: string }>>(),
  result: json("result").$type<Record<string, any>>(),
  subAgentsInvolved: json("sub_agents_involved").$type<string[]>(),
  startedAt: bigint("started_at", { mode: "number" }),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesMission = typeof hermesMissions.$inferSelect;
export type InsertHermesMission = typeof hermesMissions.$inferInsert;

// ── Ingested Leads (from external projects via /api/leads/ingest) ────────────────
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
  assignedUserId: int("assigned_user_id"),  // LeadOS user who owns this lead
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type IngestedLead = typeof ingestedLeads.$inferSelect;
export type InsertIngestedLead = typeof ingestedLeads.$inferInsert;

// ── DSR Snapshots — Push payloads from DeepSleepReset hourly_stats.py ─────────
export const dsrSnapshots = mysqlTable("dsr_snapshots", {
  id: int("id").primaryKey().autoincrement(),
  source: varchar("source", { length: 64 }).notNull().default("deep-sleep-reset"),
  totalRevenueCents: int("total_revenue_cents").notNull().default(0),
  todayRevenueCents: int("today_revenue_cents").notNull().default(0),
  last7dRevenueCents: int("last7d_revenue_cents").notNull().default(0),
  last30dRevenueCents: int("last30d_revenue_cents").notNull().default(0),
  totalOrders: int("total_orders").notNull().default(0),
  totalLeads: int("total_leads").notNull().default(0),
  convertedLeads: int("converted_leads").notNull().default(0),
  conversionRatePct: int("conversion_rate_pct").notNull().default(0),
  rawPayload: json("raw_payload").$type<Record<string, any>>(),
  pushedAt: bigint("pushed_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type DsrSnapshot = typeof dsrSnapshots.$inferSelect;
export type InsertDsrSnapshot = typeof dsrSnapshots.$inferInsert;

// ─── AI Skills Library (AI OS best practice from video) ──────────────────────
// GitHub-style centralized prompt/workflow library shared across the team
export const aiSkills = mysqlTable("ai_skills", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  // 'prompt' | 'workflow' | 'template' | 'sop'
  skillType: varchar("skill_type", { length: 32 }).notNull().default("prompt"),
  content: text("content").notNull(),
  // JSON: variables the skill accepts (e.g. {name, company, industry})
  variables: json("variables").$type<string[]>(),
  // JSON: example inputs for quick testing
  exampleInput: json("example_input").$type<Record<string, string>>(),
  tags: varchar("tags", { length: 512 }),
  // shared with whole team (team_id based) or private
  isShared: boolean("is_shared").notNull().default(false),
  usageCount: int("usage_count").notNull().default(0),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type AiSkill = typeof aiSkills.$inferSelect;
export type InsertAiSkill = typeof aiSkills.$inferInsert;

// ─── ROI Audit Sessions (4-step framework from video) ────────────────────────
export const roiAuditSessions = mysqlTable("roi_audit_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  // JSON array of process steps: [{name, description, timePerWeekHours, valueRating}]
  processes: json("processes").$type<Array<{name: string; description: string; timePerWeekHours: number; valueRating: number}>>(),
  // JSON: AI feasibility analysis result
  feasibilityAnalysis: json("feasibility_analysis").$type<Array<{processName: string; feasibilityScore: number; roiScore: number; recommendation: string; tools: string[]}>>(),
  totalTimeSavedHours: int("total_time_saved_hours"),
  estimatedMonthlySavingEur: int("estimated_monthly_saving_eur"),
  topPriorityProcess: varchar("top_priority_process", { length: 256 }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RoiAuditSession = typeof roiAuditSessions.$inferSelect;
export type InsertRoiAuditSession = typeof roiAuditSessions.$inferInsert;

// ─── API Keys Management (LeadOS CRM Integration) ─────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  keyHash: varchar("key_hash", { length: 256 }).notNull().unique(),
  // Permissions: 'read' | 'write' | 'email' | 'admin'
  permissions: varchar("permissions", { length: 512 }).notNull().default("read"),
  // Status: 'active' | 'revoked' | 'expired'
  status: mysqlEnum("status", ["active", "revoked", "expired"]).default("active").notNull(),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  revokedAt: bigint("revoked_at", { mode: "number" }),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Webhook Delivery Logs (Event Dispatch History) ────────────────────────────
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").primaryKey().autoincrement(),
  webhookConfigId: int("webhook_config_id").notNull(),
  userId: int("user_id").notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  // Payload sent to webhook
  payload: json("payload").$type<Record<string, any>>(),
  // HTTP status code from webhook endpoint
  statusCode: int("status_code"),
  // Response body from webhook endpoint
  response: text("response"),
  // Attempt number (1-based)
  attempt: int("attempt").notNull().default(1),
  // Status: 'pending' | 'success' | 'failed' | 'retrying'
  status: mysqlEnum("status", ["pending", "success", "failed", "retrying"]).default("pending").notNull(),
  nextRetryAt: bigint("next_retry_at", { mode: "number" }),
  error: text("error"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  completedAt: bigint("completed_at", { mode: "number" }),
});
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

// ─── Webhook Configs (CRM Integration) ────────────────────────────────────────
export const webhookConfigs = mysqlTable("webhook_configs_crm", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 256 }).notNull(), // HMAC secret for signing
  events: varchar("events", { length: 512 }).notNull(), // comma-separated: "new_lead,new_order,quiz_completed"
  status: mysqlEnum("status", ["active", "paused", "failed"]).default("active").notNull(),
  maxRetries: int("max_retries").default(3).notNull(),
  retryDelaySeconds: int("retry_delay_seconds").default(300).notNull(),
  headers: json("headers").$type<Record<string, string>>().$default(() => ({})),
  lastTriggeredAt: bigint("last_triggered_at", { mode: "number" }),
  failureCount: int("failure_count").default(0).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

// ─── Integration Settings (Brevo, Reddit Ads, TikTok Ads, Meta Pixel) ─────────
export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  integrationId: varchar("integration_id", { length: 64 }).notNull(), // e.g. "brevo", "reddit-ads", "tiktok-ads", "meta-pixel"
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  config: json("config").$type<Record<string, any>>().$default(() => ({})),
  status: mysqlEnum("status", ["active", "inactive", "error"]).default("inactive").notNull(),
  lastTestedAt: bigint("last_tested_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSetting = typeof integrationSettings.$inferInsert;

// ─── Google Maps Leads (Restaurant/Business scraper for web agency) ────────────
export const googleMapsLeads = mysqlTable("google_maps_leads", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  placeId: varchar("place_id", { length: 128 }),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 128 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  phone: varchar("phone", { length: 64 }),
  website: text("website"),
  hasWebsite: tinyint("has_website").default(0).notNull(),
  webQualityScore: int("web_quality_score"),
  rating: varchar("rating", { length: 8 }),
  reviewsCount: int("reviews_count"),
  lat: varchar("lat", { length: 32 }),
  lng: varchar("lng", { length: 32 }),
  googleMapsUrl: text("google_maps_url"),
  status: mysqlEnum("gml_status", ["new", "contacted", "interested", "converted", "rejected"]).default("new").notNull(),
  convertedToLeadId: int("converted_to_lead_id"),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type GoogleMapsLead = typeof googleMapsLeads.$inferSelect;
export type InsertGoogleMapsLead = typeof googleMapsLeads.$inferInsert;

// ─── Web Audits (AI-powered website quality analysis for web agency outreach) ──
export const webAudits = mysqlTable("web_audits", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  url: text("url").notNull(),
  businessName: varchar("business_name", { length: 256 }),
  overallScore: int("overall_score").notNull(),
  performanceScore: int("performance_score"),
  seoScore: int("seo_score"),
  mobileScore: int("mobile_score"),
  designScore: int("design_score"),
  speedMs: int("speed_ms"),
  issues: json("issues").$type<Array<{ severity: "critical"|"warning"|"info"; category: string; message: string }>>().$default(() => []),
  recommendations: json("recommendations").$type<Array<{ priority: number; title: string; description: string; impact: string }>>().$default(() => []),
  techStack: json("tech_stack").$type<string[]>().$default(() => []),
  hasContactForm: tinyint("has_contact_form").default(0),
  hasSsl: tinyint("has_ssl").default(0),
  hasMobileMenu: tinyint("has_mobile_menu").default(0),
  hasOnlineBooking: tinyint("has_online_booking").default(0),
  screenshotUrl: text("screenshot_url"),
  linkedGoogleMapsLeadId: int("linked_google_maps_lead_id"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type WebAudit = typeof webAudits.$inferSelect;
export type InsertWebAudit = typeof webAudits.$inferInsert;

// ─── Radar (AI Growth OS) — signal-based prospecting via community monitoring ──
// HERMES tech agent: watches Reddit communities for pain points & buying signals.

export const radarWatches = mysqlTable("radar_watches", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  /** Subreddit names without r/ prefix, e.g. ["smallbusiness", "Entrepreneur"] */
  subreddits: json("subreddits").$type<string[]>(),
  /** Optional keyword filter — post must mention at least one (empty = all posts) */
  keywords: json("keywords").$type<string[]>(),
  /** What the user sells — gives the analyzer context to judge opportunity fit */
  offerContext: text("offer_context"),
  /** Minimum opportunity score (0-100) for a post to be saved as a signal */
  minScore: int("min_score").notNull().default(60),
  isActive: int("is_active").notNull().default(1),
  lastScanAt: bigint("last_scan_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RadarWatch = typeof radarWatches.$inferSelect;
export type InsertRadarWatch = typeof radarWatches.$inferInsert;

export const radarSignals = mysqlTable("radar_signals", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  watchId: int("watch_id").notNull(),
  source: varchar("source", { length: 32 }).notNull().default("reddit"),
  /** Canonical URL of the source post — used for dedupe */
  sourceUrl: varchar("source_url", { length: 500 }).notNull(),
  subreddit: varchar("subreddit", { length: 128 }),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  /** AI-extracted pain point the author expresses */
  painPoint: text("pain_point"),
  /** AI-suggested business opportunity / outreach angle */
  opportunity: text("opportunity"),
  /** Opportunity fit score 0-100 */
  score: int("score").notNull().default(0),
  status: mysqlEnum("radar_status", ["new", "reviewed", "converted", "dismissed"]).notNull().default("new"),
  /** When the source post was published (unix ms) */
  postedAt: bigint("posted_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RadarSignal = typeof radarSignals.$inferSelect;
export type InsertRadarSignal = typeof radarSignals.$inferInsert;
