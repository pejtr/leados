import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

// ─── Predictive Lead Scores ─────────────────────────────────────
export const predictiveScores = mysqlTable("predictive_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // 0.00 - 100.00
  scoreLabel: mysqlEnum("scoreLabel", ["hot", "warm", "cold"]).notNull(),
  factors: text("factors"), // JSON: [{factor, weight, value}]
  modelVersion: varchar("modelVersion", { length: 32 }).default("v1"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type PredictiveScore = typeof predictiveScores.$inferSelect;
export type InsertPredictiveScore = typeof predictiveScores.$inferInsert;
