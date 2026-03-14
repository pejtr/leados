import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
  decimal,
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
  dataSource: mysqlEnum("dataSource", ["mock", "linkedin_apify"]).default("mock").notNull(),

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

// ─── Webhook Configs ────────────────────────────────────────────
export const webhookConfigs = mysqlTable("webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["generic", "clickup", "slack"]).default("generic").notNull(),
  // For generic webhooks: the URL to POST to
  webhookUrl: text("webhookUrl"),
  // For ClickUp: API token + list ID
  clickupApiKey: text("clickupApiKey"),
  clickupListId: varchar("clickupListId", { length: 64 }),
  // For Slack: webhook URL
  slackWebhookUrl: text("slackWebhookUrl"),
  // Trigger events
  triggerOnGenerate: boolean("triggerOnGenerate").default(true).notNull(),
  triggerOnStatusChange: boolean("triggerOnStatusChange").default(false).notNull(),
  triggerOnDealClose: boolean("triggerOnDealClose").default(false).notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

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
