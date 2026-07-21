import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

// ─── Real Estate ─────────────────────────────────────────────────

// Real Estate Listings (nemovitosti)
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dealId: int("dealId"),
  type: mysqlEnum("type", ["sale", "rent"]).default("sale").notNull(),
  propertyType: mysqlEnum("propertyType", ["apartment", "house", "land", "commercial", "garage", "other"]).default("apartment").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 512 }),
  city: varchar("city", { length: 128 }),
  district: varchar("district", { length: 128 }),
  price: decimal("price", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("CZK").notNull(),
  area: decimal("area", { precision: 8, scale: 2 }),
  rooms: varchar("rooms", { length: 16 }),
  floor: int("floor"),
  totalFloors: int("totalFloors"),
  hasElevator: boolean("hasElevator").default(false),
  hasParking: boolean("hasParking").default(false),
  hasGarden: boolean("hasGarden").default(false),
  energyClass: varchar("energyClass", { length: 4 }),
  photosJson: text("photosJson"),
  portalSyncJson: text("portalSyncJson"),
  status: mysqlEnum("status", ["draft", "active", "reserved", "sold", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// Real Estate Transactions (transakce)
export const propertyTransactions = mysqlTable("property_transactions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  userId: int("userId").notNull(),
  buyerName: varchar("buyerName", { length: 256 }),
  buyerEmail: varchar("buyerEmail", { length: 320 }),
  buyerPhone: varchar("buyerPhone", { length: 64 }),
  stage: mysqlEnum("stage", ["interest", "viewing", "reservation", "contract", "handover", "completed"]).default("interest").notNull(),
  reservationDate: timestamp("reservationDate"),
  contractDate: timestamp("contractDate"),
  handoverDate: timestamp("handoverDate"),
  finalPrice: decimal("finalPrice", { precision: 14, scale: 2 }),
  commission: decimal("commission", { precision: 12, scale: 2 }),
  documentsJson: text("documentsJson"),
  checklistJson: text("checklistJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PropertyTransaction = typeof propertyTransactions.$inferSelect;
export type InsertPropertyTransaction = typeof propertyTransactions.$inferInsert;
