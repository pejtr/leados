import { bigint, boolean, int, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const omniAdSites = mysqlTable("omni_ad_sites", {
  siteKey: varchar("siteKey", { length: 96 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  enabled: boolean("enabled").notNull().default(false),
  customStreamEnabled: boolean("customStreamEnabled").notNull().default(true),
  mainstreamFallbackEnabled: boolean("mainstreamFallbackEnabled").notNull().default(true),
  autoPlacement: boolean("autoPlacement").notNull().default(false),
  frequencyCap: int("frequencyCap").notNull().default(3),
  frequencyWindowHours: int("frequencyWindowHours").notNull().default(168),
  minRepeatMinutes: int("minRepeatMinutes").notNull().default(360),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const omniAdCreatives = mysqlTable("omni_ad_creatives", {
  creativeKey: varchar("creativeKey", { length: 128 }).primaryKey(),
  advertiserKey: varchar("advertiserKey", { length: 96 }).notNull(),
  stream: varchar("stream", { length: 32 }).notNull().default("mainstream"),
  format: varchar("format", { length: 32 }).notNull().default("image"),
  title: varchar("title", { length: 255 }).notNull(),
  assetUrl: varchar("assetUrl", { length: 1024 }).notNull(),
  destinationUrl: varchar("destinationUrl", { length: 1024 }).notNull(),
  altText: varchar("altText", { length: 512 }),
  tags: json("tags").$type<string[]>().notNull(),
  targetSiteKeys: json("targetSiteKeys").$type<string[]>().notNull(),
  priority: int("priority").notNull().default(100),
  frequencyCap: int("frequencyCap").notNull().default(3),
  frequencyWindowHours: int("frequencyWindowHours").notNull().default(168),
  minRepeatMinutes: int("minRepeatMinutes").notNull().default(360),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const omniAdEvents = mysqlTable("omni_ad_events", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  siteKey: varchar("siteKey", { length: 96 }).notNull(),
  creativeKey: varchar("creativeKey", { length: 128 }).notNull(),
  eventType: varchar("eventType", { length: 16 }).notNull(),
  placement: varchar("placement", { length: 96 }),
  pagePath: varchar("pagePath", { length: 512 }),
  referrerHost: varchar("referrerHost", { length: 255 }),
});

export type OmniAdSite = typeof omniAdSites.$inferSelect;
export type OmniAdCreative = typeof omniAdCreatives.$inferSelect;