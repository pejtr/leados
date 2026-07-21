import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── B2B Match Profiles ────────────────────────────────────────
export const matchProfiles = mysqlTable("match_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  industries: text("industries").notNull(),
  companySizeMin: int("companySizeMin").default(10),
  companySizeMax: int("companySizeMax").default(500),
  revenueMin: varchar("revenueMin", { length: 32 }),
  revenueMax: varchar("revenueMax", { length: 32 }),
  locations: text("locations").notNull(),
  keywords: text("keywords"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchProfile = typeof matchProfiles.$inferSelect;
export type InsertMatchProfile = typeof matchProfiles.$inferInsert;
