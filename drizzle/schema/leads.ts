import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

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
  dataSource: mysqlEnum("dataSource", [
    "mock",
    "linkedin_apify",
    "xing_apify",
    "google_maps",
    "web_audit",
    "katastr_online",
  ])
    .default("mock")
    .notNull(),

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
