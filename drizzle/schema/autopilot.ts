import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

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
