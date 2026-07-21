import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

export const dataProvenance = mysqlTable("data_provenance", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("source_id", { length: 128 }).notNull(),
  providerName: varchar("provider_name", { length: 128 }).notNull(),
  sourceType: varchar("source_type", { length: 64 }).notNull(),
  collectedAt: timestamp("collected_at").notNull(),
  collectedBy: varchar("collected_by", { length: 128 }).notNull(),
  ingestionMethod: varchar("ingestion_method", { length: 64 }).notNull(),
  licenseStatus: varchar("license_status", { length: 32 }).default("unknown"),
  redistributionAllowed: boolean("redistribution_allowed").default(false),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).default("0.00"),
  lastVerifiedAt: timestamp("last_verified_at"),
  rawReference: text("raw_reference"),
  normalizedReference: text("normalized_reference"),
  clientVisibleStatus: boolean("client_visible_status").default(false),
  internalOnlyStatus: boolean("internal_only_status").default(true),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sourceIdIdx: index("idx_dp_source_id").on(table.sourceId),
  providerNameIdx: index("idx_dp_provider_name").on(table.providerName),
  sourceTypeIdx: index("idx_dp_source_type").on(table.sourceType),
  userIdIdx: index("idx_dp_user_id").on(table.userId),
  confidenceIdx: index("idx_dp_confidence").on(table.confidenceScore),
}));

export const attributionTrail = mysqlTable("attribution_trail", {
  id: int("id").autoincrement().primaryKey(),
  provenanceId: int("provenance_id").notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: int("entity_id").notNull(),
  attributionValue: varchar("attribution_value", { length: 256 }),
  attributedBy: int("attributed_by"),
  attributedAt: timestamp("attributed_at").defaultNow().notNull(),
  note: text("note"),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  provenanceIdIdx: index("idx_at_provenance_id").on(table.provenanceId),
  entityIdx: index("idx_at_entity").on(table.entityType, table.entityId),
  userIdIdx: index("idx_at_user_id").on(table.userId),
}));

export type DataProvenance = typeof dataProvenance.$inferSelect;
export type InsertDataProvenance = typeof dataProvenance.$inferInsert;
export type AttributionTrail = typeof attributionTrail.$inferSelect;
export type InsertAttributionTrail = typeof attributionTrail.$inferInsert;
