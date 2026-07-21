import {
  int,
  mysqlTable,
  timestamp,
  varchar,
  index,
  decimal,
} from "drizzle-orm/mysql-core";

export const llmUsage = mysqlTable("llm_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  model: varchar("model", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  promptTokens: int("promptTokens").default(0).notNull(),
  completionTokens: int("completionTokens").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),
  estimatedCostCents: decimal("estimatedCostCents", { precision: 10, scale: 4 }).default("0").notNull(),
  durationMs: int("durationMs"),
  route: varchar("route", { length: 64 }),
  success: int("success").default(1).notNull(),
  errorMessage: varchar("errorMessage", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_llmusage_userId").on(table.userId),
  createdAtIdx: index("idx_llmusage_createdAt").on(table.createdAt),
  modelIdx: index("idx_llmusage_model").on(table.model),
}));

export type LlmUsage = typeof llmUsage.$inferSelect;
export type InsertLlmUsage = typeof llmUsage.$inferInsert;