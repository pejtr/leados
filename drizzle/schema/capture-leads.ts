import {
  int,
  varchar,
  mysqlTable,
  text,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// ── Captured Leads (exit-intent + smart popup email captures) ─────────────────
export const capturedLeads = mysqlTable("captured_leads", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  source: varchar("source", { length: 64 }).notNull().default("exit_intent"), // exit_intent | smart_popup | landing_cta
  firstName: varchar("first_name", { length: 128 }),
  utmSource: varchar("utm_source", { length: 128 }),
  utmMedium: varchar("utm_medium", { length: 128 }),
  utmCampaign: varchar("utm_campaign", { length: 128 }),
  pageUrl: text("page_url"),
  welcomeEmailSent: boolean("welcome_email_sent").notNull().default(false),
  welcomeEmailSentAt: bigint("welcome_email_sent_at", { mode: "number" }),
  convertedToUser: boolean("converted_to_user").notNull().default(false),
  convertedAt: bigint("converted_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type CapturedLead = typeof capturedLeads.$inferSelect;
export type InsertCapturedLead = typeof capturedLeads.$inferInsert;
