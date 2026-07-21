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

// ─── AI Agents (multi-agent orchestration) ────────────────────
export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  agentType: mysqlEnum("agentType", ["lead_qualifier", "email_writer", "data_enricher", "meeting_scheduler", "custom"]).default("custom").notNull(),
  config: text("config").notNull(), // JSON config for the agent
  isActive: boolean("isActive").default(false).notNull(),
  totalExecutions: int("totalExecutions").default(0).notNull(),
  successRate: int("successRate").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = typeof aiAgents.$inferInsert;

export const aiAgentLogs = mysqlTable("ai_agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId").notNull(),
  input: text("input"),
  output: text("output"),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).default("success").notNull(),
  durationMs: int("durationMs").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiAgentLog = typeof aiAgentLogs.$inferSelect;
export type InsertAiAgentLog = typeof aiAgentLogs.$inferInsert;

// ─── AI Agent Memory ──────────────────────────────────────────────
export const aiAgentMemory = mysqlTable("ai_agent_memory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memoryType: mysqlEnum("memoryType", ["learning", "optimization", "preference", "insight"]).notNull(),
  key: varchar("key", { length: 256 }).notNull(),
  value: text("value").notNull(),
  confidence: decimal("confidence", { precision: 4, scale: 2 }).default("0.50"),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAgentMemory = typeof aiAgentMemory.$inferSelect;
export type InsertAiAgentMemory = typeof aiAgentMemory.$inferInsert;

// ─── AI Performance Log ───────────────────────────────────────────
export const aiPerformanceLog = mysqlTable("ai_performance_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cycleType: mysqlEnum("cycleType", ["scheduled", "manual", "triggered"]).default("scheduled").notNull(),
  metricsSnapshot: text("metricsSnapshot").notNull(), // JSON: leads, conversion, pipeline stats
  actionsPerformed: text("actionsPerformed").notNull(), // JSON: array of actions taken
  improvements: text("improvements").notNull(), // JSON: what was improved
  score: decimal("score", { precision: 5, scale: 2 }).default("0.00"), // performance score 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiPerformanceLog = typeof aiPerformanceLog.$inferSelect;
export type InsertAiPerformanceLog = typeof aiPerformanceLog.$inferInsert;

// ─── AI Chat History ──────────────────────────────────────────────
export const aiChatHistory = mysqlTable("ai_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  toolsUsed: text("toolsUsed"), // JSON: array of tool names used
  actionsExecuted: text("actionsExecuted"), // JSON: array of actions executed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;
