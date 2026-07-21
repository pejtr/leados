import {
  int,
  varchar,
  mysqlTable,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

// ─── 5 Brains Analysis Sessions ─────────────────────────────────────────────
export const brainAnalyses = mysqlTable("brain_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  contextType: varchar("contextType", { length: 32 }).notNull().default("project"), // "project" | "campaign" | "custom"
  contextId: int("contextId"),       // projectId or campaignId (nullable for custom)
  contextData: text("contextData"),  // JSON snapshot of context passed to experts
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending | running | done | error
  // Individual expert outputs (stored as markdown text)
  pragmaticArchitect: text("pragmaticArchitect"),
  creativeVisionary: text("creativeVisionary"),
  criticalInvestor: text("criticalInvestor"),
  technicalPurist: text("technicalPurist"),
  growthHacker: text("growthHacker"),
  // Synthesized master report
  masterReport: text("masterReport"),
  // Advocate + Skeptic confidence scoring
  confidenceScore: int("confidenceScore"),           // 0-100 composite score
  advocateAnalysis: text("advocateAnalysis"),         // Advocate LLM output
  skepticAnalysis: text("skepticAnalysis"),           // Skeptic LLM output
  confidenceReasoning: text("confidenceReasoning"),   // Short explanation of the score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type BrainAnalysis = typeof brainAnalyses.$inferSelect;
export type InsertBrainAnalysis = typeof brainAnalyses.$inferInsert;
