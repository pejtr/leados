import {
  int,
  varchar,
  mysqlTable,
  text,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// Daily Report Configs
export const dailyReportConfigs = mysqlTable("daily_report_configs", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sendHour: int("send_hour").notNull().default(8), // UTC hour to send
  includeProjects: boolean("include_projects").notNull().default(true),
  includeCampaigns: boolean("include_campaigns").notNull().default(true),
  includeLeads: boolean("include_leads").notNull().default(true),
  lastSentAt: bigint("last_sent_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
