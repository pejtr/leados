import {
  int,
  mysqlTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";

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
