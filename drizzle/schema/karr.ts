import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const karrReviews = mysqlTable("karr_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetType: mysqlEnum("targetType", ["email", "lead", "message", "workflow", "campaign", "mission"]).notNull(),
  targetId: int("targetId"),
  contentPreview: text("contentPreview"),
  reviewResult: mysqlEnum("reviewResult", ["approved", "flagged", "rejected"]).notNull(),
  issues: json("issues"),
  summary: varchar("summary", { length: 512 }),
  reviewerModel: varchar("reviewerModel", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  targetIdx: index("idx_karr_target").on(table.targetType, table.targetId),
  userIdIdx: index("idx_karr_userId").on(table.userId),
}));

export type KarrReview = typeof karrReviews.$inferSelect;
export type InsertKarrReview = typeof karrReviews.$inferInsert;

export type KarrIssue = {
  severity: "critical" | "warning" | "info";
  category: "factual" | "policy" | "quality" | "security" | "brand";
  description: string;
  suggestion: string;
};