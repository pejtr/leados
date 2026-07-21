import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Market Intelligence Reports ─────────────────────────────────
export const marketIntelReports = mysqlTable("market_intel_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  reportData: text("reportData").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type MarketIntelReport = typeof marketIntelReports.$inferSelect;

// ─── Knowledge Base Articles ──────────────────────────────────────
export const knowledgeArticles = mysqlTable("knowledge_articles", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  readTime: int("readTime").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;

// ─── Competitive Landscape ────────────────────────────────────────
export const competitiveMaps = mysqlTable("competitive_maps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  industry: varchar("industry", { length: 128 }).notNull(),
  mapData: text("mapData").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type CompetitiveMap = typeof competitiveMaps.$inferSelect;
