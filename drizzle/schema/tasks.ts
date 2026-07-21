import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

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
