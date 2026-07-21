import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Condition-Based Campaigns (If/Then) ──────────────────────
export const campaignRules = mysqlTable("campaign_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  // IF condition
  triggerType: mysqlEnum("triggerType", [
    "lead_created", "status_changed", "email_opened", "email_replied",
    "intent_score_above", "visitor_returned", "deal_value_above"
  ]).notNull(),
  triggerValue: varchar("triggerValue", { length: 256 }),
  // THEN action
  actionType: mysqlEnum("actionType", [
    "send_email", "change_status", "assign_to", "add_to_list",
    "send_webhook", "send_slack", "create_task"
  ]).notNull(),
  actionValue: text("actionValue"), // JSON config for the action
  isActive: boolean("isActive").default(true).notNull(),
  totalExecutions: int("totalExecutions").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignRule = typeof campaignRules.$inferSelect;
export type InsertCampaignRule = typeof campaignRules.$inferInsert;

// ─── Agency Panel (multi-tenant) ──────────────────────────────
export const agencyClients = mysqlTable("agency_clients", {
  id: int("id").autoincrement().primaryKey(),
  agencyUserId: int("agencyUserId").notNull(), // the agency owner
  clientName: varchar("clientName", { length: 256 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientDomain: varchar("clientDomain", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  brandColor: varchar("brandColor", { length: 16 }),
  brandLogo: text("brandLogo"),
  totalLeads: int("totalLeads").default(0).notNull(),
  totalCampaigns: int("totalCampaigns").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgencyClient = typeof agencyClients.$inferSelect;
export type InsertAgencyClient = typeof agencyClients.$inferInsert;
