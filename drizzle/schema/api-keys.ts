import {
  int,
  mysqlEnum,
  mysqlTable,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── API Keys Management (ONYX OS CRM Integration) ─────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  keyHash: varchar("key_hash", { length: 256 }).notNull().unique(),
  // Permissions: 'read' | 'write' | 'email' | 'admin'
  permissions: varchar("permissions", { length: 512 }).notNull().default("read"),
  // Status: 'active' | 'revoked' | 'expired'
  status: mysqlEnum("status", ["active", "revoked", "expired"]).default("active").notNull(),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  revokedAt: bigint("revoked_at", { mode: "number" }),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
