import {
  int,
  varchar,
  mysqlTable,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ── DSR Snapshots — Push payloads from DeepSleepReset hourly_stats.py ─────────
export const dsrSnapshots = mysqlTable("dsr_snapshots", {
  id: int("id").primaryKey().autoincrement(),
  source: varchar("source", { length: 64 }).notNull().default("deep-sleep-reset"),
  totalRevenueCents: int("total_revenue_cents").notNull().default(0),
  todayRevenueCents: int("today_revenue_cents").notNull().default(0),
  last7dRevenueCents: int("last7d_revenue_cents").notNull().default(0),
  last30dRevenueCents: int("last30d_revenue_cents").notNull().default(0),
  totalOrders: int("total_orders").notNull().default(0),
  totalLeads: int("total_leads").notNull().default(0),
  convertedLeads: int("converted_leads").notNull().default(0),
  conversionRatePct: int("conversion_rate_pct").notNull().default(0),
  rawPayload: json("raw_payload").$type<Record<string, any>>(),
  pushedAt: bigint("pushed_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type DsrSnapshot = typeof dsrSnapshots.$inferSelect;
export type InsertDsrSnapshot = typeof dsrSnapshots.$inferInsert;
