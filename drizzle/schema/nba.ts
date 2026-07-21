import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

// ─── NBA Recommendations ───────────────────────────────────────
export const nbaRecommendations = mysqlTable("nba_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  action: mysqlEnum("action", ["call", "email", "linkedin", "qualify", "disqualify", "wait"]).notNull(),
  priority: int("priority").default(50).notNull(),
  reason: text("reason").notNull(),
  aiScore: int("aiScore").default(50).notNull(),
  status: mysqlEnum("status", ["pending", "actioned", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  actionedAt: timestamp("actionedAt"),
});

export type NbaRecommendation = typeof nbaRecommendations.$inferSelect;
export type InsertNbaRecommendation = typeof nbaRecommendations.$inferInsert;
