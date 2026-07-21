import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

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
