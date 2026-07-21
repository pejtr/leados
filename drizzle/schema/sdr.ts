import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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
