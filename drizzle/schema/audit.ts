import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  index,
} from "drizzle-orm/mysql-core";

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: int("resourceId"),
  oldValue: json("oldValue"),
  newValue: json("newValue"),
  metadata: json("metadata"),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_audit_userId").on(table.userId),
  eventTypeIdx: index("idx_audit_eventType").on(table.eventType),
  resourceIdx: index("idx_audit_resource").on(table.resourceType, table.resourceId),
  createdAtIdx: index("idx_audit_createdAt").on(table.createdAt),
}));

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;
