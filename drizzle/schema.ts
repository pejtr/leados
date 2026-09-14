import { bigint, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  businessDescription: text("businessDescription"),
  packageType: varchar("packageType", { length: 50 }),
  /** Questionnaire answers beyond the core fields, stored as JSON (goals, pages, materials, budget, deadline…). */
  details: text("details"),
  /** Where the lead came from — e.g. "dotaznik", "demo:kavarna", "chat". */
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["new", "contacted", "converted"]).default("new").notNull(),
  notes: text("notes"),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export const portfolioProjects = mysqlTable("portfolio_projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  testimonialAuthor: varchar("testimonialAuthor", { length: 255 }),
  testimonialText: text("testimonialText"),
  testimonialRating: int("testimonialRating"),
  results: text("results"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type InsertPortfolioProject = typeof portfolioProjects.$inferInsert;

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  author: varchar("author", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  company: varchar("company", { length: 255 }),
  text: text("text").notNull(),
  rating: int("rating"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const nichePackages = mysqlTable("niche_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Price in CZK (e.g., 1290 for 1 290 Kč)
  features: text("features").notNull(), // JSON array of features
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NichePackage = typeof nichePackages.$inferSelect;
export type InsertNichePackage = typeof nichePackages.$inferInsert;

export const customerSubscriptions = mysqlTable("customer_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(), // References inquiries.id
  packageId: int("packageId").notNull(), // References nichePackages.id
  active: int("active").default(1).notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  monthlyPrice: int("monthlyPrice").notNull(), // Price in CZK
  nextBillingDate: timestamp("nextBillingDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerSubscription = typeof customerSubscriptions.$inferSelect;
export type InsertCustomerSubscription = typeof customerSubscriptions.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  packageType: varchar("packageType", { length: 100 }).notNull(),
  totalPrice: int("totalPrice").notNull(),
  depositPercentage: int("depositPercentage").default(30).notNull(),
  depositAmount: int("depositAmount").notNull(),
  remainingAmount: int("remainingAmount").notNull(),
  status: mysqlEnum("status", ["pending", "deposit_paid", "completed", "cancelled"]).default("pending").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["deposit", "final", "refund"]).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  invoiceUrl: varchar("invoiceUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const manusTaskLogs = mysqlTable("manus_task_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 100 }).notNull(),
  eventType: varchar("eventType", { length: 50 }).notNull(),
  agentStatus: varchar("agentStatus", { length: 30 }),
  content: text("content"),
  rawEvent: text("rawEvent"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ManusTaskLog = typeof manusTaskLogs.$inferSelect;
export type InsertManusTaskLog = typeof manusTaskLogs.$inferInsert;

// LeadOS Projects — orchestrated via Manus API v2
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  leadsOsProjectId: varchar("leadsOsProjectId", { length: 255 }), // Manus API project ID
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  packageType: varchar("packageType", { length: 50 }).notNull(), // lite, basic, lead_gen, automation
  assignedTo: varchar("assignedTo", { length: 255 }), // Team member email
  deadline: bigint("deadline", { mode: "number" }), // Unix timestamp (ms)
  completionPercentage: int("completionPercentage").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Project Milestones — track progress within a project
export const projectMilestones = mysqlTable("project_milestones", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("projectId", { length: 64 }).notNull().references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  dueDate: bigint("dueDate", { mode: "number" }), // Unix timestamp (ms)
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

// Heartbeat Job Tracking — autonomous monitoring and healing
export const heartbeatJobs = mysqlTable("heartbeat_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  taskUid: varchar("taskUid", { length: 255 }).notNull().unique(),
  projectId: varchar("projectId", { length: 64 }).references(() => projects.id),
  jobType: varchar("jobType", { length: 50 }).notNull(), // monitoring, alert, healing
  name: varchar("name", { length: 255 }).notNull(),
  cronExpression: varchar("cronExpression", { length: 50 }).notNull(),
  isActive: int("isActive").default(1),
  lastExecutedAt: bigint("lastExecutedAt", { mode: "number" }),
  nextExecutionAt: bigint("nextExecutionAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HeartbeatJob = typeof heartbeatJobs.$inferSelect;
export type InsertHeartbeatJob = typeof heartbeatJobs.$inferInsert;

// Brand Memory — stores brand knowledge per client for AI agents
export const brandMemories = mysqlTable("brand_memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  tagline: varchar("tagline", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  targetAudience: text("targetAudience"),
  brandVoice: text("brandVoice"),       // tone: formal, friendly, bold...
  uniqueValue: text("uniqueValue"),      // USP / what makes them different
  products: text("products"),           // JSON: list of products/services
  painPoints: text("painPoints"),       // customer pain points solved
  competitors: text("competitors"),     // JSON: competitor names
  pastCampaigns: text("pastCampaigns"), // what worked, what didn't
  website: varchar("website", { length: 500 }),
  socialLinks: text("socialLinks"),     // JSON: { instagram, facebook, linkedin }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandMemory = typeof brandMemories.$inferSelect;
export type InsertBrandMemory = typeof brandMemories.$inferInsert;

// Agent Sessions — individual conversation sessions with AI agents
export const agentSessions = mysqlTable("agent_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  agentType: varchar("agentType", { length: 50 }).notNull(), // cmo, copywriter, analyst, seo, ads
  skillId: varchar("skillId", { length: 100 }),              // which skill is active
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentSession = typeof agentSessions.$inferSelect;
export type InsertAgentSession = typeof agentSessions.$inferInsert;

// Agent Messages — messages within an agent session
export const agentMessages = mysqlTable("agent_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => agentSessions.id),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

// Sales Chat Conversations — customer-facing chatbot na landing page (lead capture)
export const salesConversations = mysqlTable("sales_conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),       // client-generated session id
  personaId: varchar("personaId", { length: 64 }).notNull().default("onyxweb-sales"),
  visitorEmail: varchar("visitorEmail", { length: 255 }), // captured lead email
  visitorName: varchar("visitorName", { length: 255 }),
  visitorPhone: varchar("visitorPhone", { length: 64 }),
  capturedLead: int("capturedLead").default(0).notNull(), // 0/1 — became a lead
  inquiryId: int("inquiryId"),                            // linked inquiry if converted
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesConversation = typeof salesConversations.$inferSelect;
export type InsertSalesConversation = typeof salesConversations.$inferInsert;

export const salesMessages = mysqlTable("sales_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull().references(() => salesConversations.id),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesMessage = typeof salesMessages.$inferSelect;
export type InsertSalesMessage = typeof salesMessages.$inferInsert;

// ─── LinkedIn Outreach System ─────────────────────────────────────────────────

export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  linkedinId: varchar("linkedinId", { length: 100 }), // LinkedIn profile ID
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 500 }),
  title: varchar("title", { length: 255 }), // Job title
  industry: varchar("industry", { length: 100 }),
  employeeCount: varchar("employeeCount", { length: 50 }), // e.g., "1-10", "11-50"
  revenue: varchar("revenue", { length: 50 }), // e.g., "2-5 mil. Kč"
  location: varchar("location", { length: 255 }),
  about: text("about"), // LinkedIn "About" section
  currentRole: text("currentRole"), // Current job description
  painPoints: text("painPoints"), // AI-identified pain points
  icpScore: int("icpScore").default(0).notNull(), // 0-100 ICP match score
  icpReason: text("icpReason"), // Why they match ICP
  status: mysqlEnum("status", ["new", "qualified", "contacted", "replied", "converted", "rejected", "unqualified"]).default("new").notNull(),
  source: varchar("source", { length: 100 }), // how they were found
  tags: text("tags"), // JSON array of tags
  notes: text("notes"),
  lastContactedAt: timestamp("lastContactedAt"),
  lastRepliedAt: timestamp("lastRepliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  leadState: mysqlEnum("leadState", [
    "DISCOVERED",
    "RESEARCHED",
    "QUALIFIED",
    "MESSAGE_READY",
    "APPROVED",
    "MANUALLY_SENT",
    "CONNECTED",
    "REPLIED",
    "MEETING",
    "PROPOSAL",
    "WON",
    "LOST",
    "NURTURE",
  ]).default("DISCOVERED").notNull(),
  timingScore: int("timingScore").default(0).notNull(),
  creepRisk: int("creepRisk").default(0).notNull(),
  verifiedSignals: text("verifiedSignals"),
  sourceEvidence: text("sourceEvidence"),
  whyThisCompany: text("whyThisCompany"),
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

export const outreachSequences = mysqlTable("outreach_sequences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetIndustry: varchar("targetIndustry", { length: 100 }),
  targetTitle: varchar("targetTitle", { length: 255 }),
  targetRevenue: varchar("targetRevenue", { length: 50 }),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  totalSteps: int("totalSteps").default(0).notNull(),
  totalProspects: int("totalProspects").default(0).notNull(),
  totalContacted: int("totalContacted").default(0).notNull(),
  totalReplied: int("totalReplied").default(0).notNull(),
  totalConverted: int("totalConverted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachSequence = typeof outreachSequences.$inferSelect;
export type InsertOutreachSequence = typeof outreachSequences.$inferInsert;

export const outreachSteps = mysqlTable("outreach_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => outreachSequences.id),
  stepNumber: int("stepNumber").notNull(), // 1, 2, 3...
  stepType: mysqlEnum("stepType", ["linkedin_connect", "linkedin_message", "email", "sms", "whatsapp", "wait"]).notNull(),
  delayDays: int("delayDays").default(0).notNull(), // Days to wait before this step
  delayHours: int("delayHours").default(0).notNull(), // Hours to wait
  messageTemplate: text("messageTemplate"), // AI prompt or template
  messageSubject: varchar("messageSubject", { length: 500 }), // For email steps
  condition: varchar("condition", { length: 100 }), // e.g., "no_reply", "replied", "connected"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutreachStep = typeof outreachSteps.$inferSelect;
export type InsertOutreachStep = typeof outreachSteps.$inferInsert;

export const outreachMessages = mysqlTable("outreach_messages", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull().references(() => outreachSequences.id),
  stepId: int("stepId").notNull().references(() => outreachSteps.id),
  prospectId: int("prospectId").notNull().references(() => prospects.id),
  stepType: varchar("stepType", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  replyContent: text("replyContent"),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"), // JSON: linkedin_message_id, email_id, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachMessage = typeof outreachMessages.$inferSelect;
export type InsertOutreachMessage = typeof outreachMessages.$inferInsert;

export const outreachTemplates = mysqlTable("outreach_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // connection_request, first_message, follow_up, breakup
  industry: varchar("industry", { length: 100 }),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(), // AI prompt or template
  variables: text("variables"), // JSON array of variable names
  performanceScore: int("performanceScore").default(0).notNull(), // 0-100 based on reply rate
  totalUses: int("totalUses").default(0).notNull(),
  totalReplies: int("totalReplies").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export type InsertOutreachTemplate = typeof outreachTemplates.$inferInsert;

// ---------------------------------------------------------------------------
// OPTIHUB edge (api.optihub.cz) persistence
//
// These tables are the only durable state of the public edge. They are written
// by the edge credential/audit/rate-limit stores and by the internal
// provisioning module. There is no HTTP surface that manages them.
//
// All time columns are epoch milliseconds (bigint) so behaviour does not depend
// on the database/session timezone. Raw secrets are never stored: only
// `secretHash` (SHA-256 hex).
// ---------------------------------------------------------------------------

export const optihubEdgeCredentials = mysqlTable(
  "optihub_edge_credentials",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    tenantId: varchar("tenantId", { length: 128 }).notNull(),
    actorId: varchar("actorId", { length: 128 }).notNull(),
    /** SHA-256 hex of the bearer secret. Never the raw secret. */
    secretHash: varchar("secretHash", { length: 64 }).notNull().unique(),
    /** Monotonic per rotation chain. */
    version: int("version").notNull().default(1),
    /** active | revoked | expired */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    scopes: json("scopes").$type<string[]>().notNull(),
    metadata: json("metadata").$type<Record<string, string>>().notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    expiresAt: bigint("expiresAt", { mode: "number" }),
    revokedAt: bigint("revokedAt", { mode: "number" }),
    lastUsedAt: bigint("lastUsedAt", { mode: "number" }),
    rotatedFromId: varchar("rotatedFromId", { length: 64 }),
    /** Set atomically by the rotation claim. Also the CAS marker. */
    rotatedToId: varchar("rotatedToId", { length: 64 }),
  },
  table => ({
    tenantIdx: index("optihub_edge_credentials_tenant_idx").on(table.tenantId),
    rotatedFromIdx: index("optihub_edge_credentials_rotated_from_idx").on(table.rotatedFromId),
  }),
);

export type OptiHubEdgeCredential = typeof optihubEdgeCredentials.$inferSelect;
export type InsertOptiHubEdgeCredential = typeof optihubEdgeCredentials.$inferInsert;

/**
 * Append-only security audit trail. The edge only ever INSERTs here; there is no
 * update/delete path in application code. Free-form payloads never reach it.
 */
export const optihubEdgeAudit = mysqlTable(
  "optihub_edge_audit",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    requestId: varchar("requestId", { length: 64 }).notNull(),
    externalRequestId: varchar("externalRequestId", { length: 128 }),
    surface: varchar("surface", { length: 16 }).notNull(),
    host: varchar("host", { length: 255 }).notNull(),
    method: varchar("method", { length: 8 }).notNull(),
    route: varchar("route", { length: 255 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    resource: varchar("resource", { length: 255 }),
    credentialId: varchar("credentialId", { length: 64 }),
    tenantId: varchar("tenantId", { length: 128 }),
    actorId: varchar("actorId", { length: 128 }),
    decision: varchar("decision", { length: 8 }).notNull(),
    code: varchar("code", { length: 48 }),
    reason: varchar("reason", { length: 128 }).notNull(),
    status: int("status").notNull(),
    ipHash: varchar("ipHash", { length: 64 }),
    userAgent: varchar("userAgent", { length: 256 }),
  },
  table => ({
    requestIdx: index("optihub_edge_audit_request_idx").on(table.requestId),
    tenantIdx: index("optihub_edge_audit_tenant_idx").on(table.tenantId),
    timestampIdx: index("optihub_edge_audit_timestamp_idx").on(table.timestamp),
  }),
);

export type OptiHubEdgeAudit = typeof optihubEdgeAudit.$inferSelect;
export type InsertOptiHubEdgeAudit = typeof optihubEdgeAudit.$inferInsert;

/**
 * Shared fixed-window rate-limit state. `bucketKey` is a hashed composite of
 * tenant/credential/action (or pre-auth key), never a raw identifier.
 */
export const optihubEdgeRateWindows = mysqlTable("optihub_edge_rate_windows", {
  bucketKey: varchar("bucketKey", { length: 255 }).primaryKey(),
  windowStart: bigint("windowStart", { mode: "number" }).notNull(),
  count: int("count").notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type OptiHubEdgeRateWindow = typeof optihubEdgeRateWindows.$inferSelect;

// Canonical aggregation: re-export the modular schema (drizzle/schema/*) so
// `from "../drizzle/schema"` resolves the complete table set. The three names
// that also exist locally (`users`, `projectMilestones`, `heartbeatJobs`) keep
// their local declarations — an explicit export always shadows `export *`.
export * from "./schema/index";

