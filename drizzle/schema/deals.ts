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
