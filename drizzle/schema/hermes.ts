import {
  int,
  varchar,
  mysqlTable,
  text,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ── HERMES — Core AI Orchestration Agent ──────────────────────────────────────
// HERMES is the meta-intelligence layer that routes, orchestrates, and synthesizes
// all sub-agents (5 Brains, NINJA BOTS, SDR, Benchmark, AI Advisor, Constitution).
export const hermesSessions = mysqlTable("hermes_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionName: varchar("session_name", { length: 255 }),
  intent: varchar("intent", { length: 64 }).notNull().default("general"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  messageCount: int("message_count").notNull().default(0),
  subAgentsUsed: json("sub_agents_used").$type<string[]>(),
  lastActivity: bigint("last_activity", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesSession = typeof hermesSessions.$inferSelect;
export type InsertHermesSession = typeof hermesSessions.$inferInsert;

export const hermesMessages = mysqlTable("hermes_messages", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  agentName: varchar("agent_name", { length: 64 }),
  content: text("content").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesMessage = typeof hermesMessages.$inferSelect;
export type InsertHermesMessage = typeof hermesMessages.$inferInsert;

export const hermesMissions = mysqlTable("hermes_missions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionId: int("session_id"),
  missionType: varchar("mission_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  plan: json("plan").$type<Array<{ step: string; agent: string; status: string }>>(),
  result: json("result").$type<Record<string, any>>(),
  subAgentsInvolved: json("sub_agents_involved").$type<string[]>(),
  startedAt: bigint("started_at", { mode: "number" }),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type HermesMission = typeof hermesMissions.$inferSelect;
export type InsertHermesMission = typeof hermesMissions.$inferInsert;
