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
