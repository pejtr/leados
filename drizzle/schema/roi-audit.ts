import {
  int,
  varchar,
  mysqlTable,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── ROI Audit Sessions (4-step framework from video) ────────────────────────
export const roiAuditSessions = mysqlTable("roi_audit_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  // JSON array of process steps: [{name, description, timePerWeekHours, valueRating}]
  processes: json("processes").$type<Array<{name: string; description: string; timePerWeekHours: number; valueRating: number}>>(),
  // JSON: AI feasibility analysis result
  feasibilityAnalysis: json("feasibility_analysis").$type<Array<{processName: string; feasibilityScore: number; roiScore: number; recommendation: string; tools: string[]}>>(),
  totalTimeSavedHours: int("total_time_saved_hours"),
  estimatedMonthlySavingEur: int("estimated_monthly_saving_eur"),
  topPriorityProcess: varchar("top_priority_process", { length: 256 }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RoiAuditSession = typeof roiAuditSessions.$inferSelect;
export type InsertRoiAuditSession = typeof roiAuditSessions.$inferInsert;
