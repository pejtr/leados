import {
  int,
  varchar,
  mysqlEnum,
  mysqlTable,
  text,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Radar (AI Growth OS) — signal-based prospecting via community monitoring ──
// HERMES tech agent: watches Reddit communities for pain points & buying signals.

export const radarWatches = mysqlTable("radar_watches", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  /** Subreddit names without r/ prefix, e.g. ["smallbusiness", "Entrepreneur"] */
  subreddits: json("subreddits").$type<string[]>(),
  /** Optional keyword filter — post must mention at least one (empty = all posts) */
  keywords: json("keywords").$type<string[]>(),
  /** What the user sells — gives the analyzer context to judge opportunity fit */
  offerContext: text("offer_context"),
  /** Minimum opportunity score (0-100) for a post to be saved as a signal */
  minScore: int("min_score").notNull().default(60),
  isActive: int("is_active").notNull().default(1),
  lastScanAt: bigint("last_scan_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RadarWatch = typeof radarWatches.$inferSelect;
export type InsertRadarWatch = typeof radarWatches.$inferInsert;

export const radarSignals = mysqlTable("radar_signals", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  watchId: int("watch_id").notNull(),
  source: varchar("source", { length: 32 }).notNull().default("reddit"),
  /** Canonical URL of the source post — used for dedupe */
  sourceUrl: varchar("source_url", { length: 500 }).notNull(),
  subreddit: varchar("subreddit", { length: 128 }),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  /** AI-extracted pain point the author expresses */
  painPoint: text("pain_point"),
  /** AI-suggested business opportunity / outreach angle */
  opportunity: text("opportunity"),
  /** Opportunity fit score 0-100 */
  score: int("score").notNull().default(0),
  status: mysqlEnum("radar_status", ["new", "reviewed", "converted", "dismissed"]).notNull().default("new"),
  /** When the source post was published (unix ms) */
  postedAt: bigint("posted_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RadarSignal = typeof radarSignals.$inferSelect;
export type InsertRadarSignal = typeof radarSignals.$inferInsert;
