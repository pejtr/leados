import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

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
