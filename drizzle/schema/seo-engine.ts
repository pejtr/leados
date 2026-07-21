import { mysqlTable, serial, text, timestamp, int, uniqueIndex } from "drizzle-orm/mysql-core";

export const seoKeywords = mysqlTable("seo_keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  volume: int("volume").default(0),
  difficulty: int("difficulty").default(0),
  intent: text("intent").default("informational"),
  competitorScore: int("competitor_score").default(0),
  suggestions: text("suggestions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  keywordIdx: uniqueIndex("idx_sk_keyword").on(table.keyword),
}));

export const seoContentScores = mysqlTable("seo_content_scores", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: int("content_id").notNull(),
  readabilityScore: int("readability_score").default(0),
  seoScore: int("seo_score").default(0),
  keywordDensity: text("keyword_density"),
  suggestions: text("suggestions"),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

export type SeoKeyword = typeof seoKeywords.$inferSelect;
export type InsertSeoKeyword = typeof seoKeywords.$inferInsert;
export type SeoContentScore = typeof seoContentScores.$inferSelect;
export type InsertSeoContentScore = typeof seoContentScores.$inferInsert;
