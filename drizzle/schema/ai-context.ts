import {
  int,
  varchar,
  mysqlTable,
  text,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// AI Constitution — global company context injected into every AI call
export const aiConstitutions = mysqlTable("ai_constitutions", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  // Company identity
  companyName: varchar("company_name", { length: 255 }),
  companyDescription: text("company_description"),
  industry: varchar("industry", { length: 128 }),
  companySize: varchar("company_size", { length: 64 }),
  website: varchar("website", { length: 255 }),
  // ICP (Ideal Customer Profile)
  icpIndustries: text("icp_industries"),
  icpCompanySize: varchar("icp_company_size", { length: 64 }),
  icpSeniority: varchar("icp_seniority", { length: 128 }),
  icpGeography: varchar("icp_geography", { length: 255 }),
  icpPainPoints: text("icp_pain_points"),
  icpBuyingTriggers: text("icp_buying_triggers"),
  // Value proposition
  uniqueValueProp: text("unique_value_prop"),
  topCompetitors: text("top_competitors"),
  differentiators: text("differentiators"),
  // Communication style
  communicationTone: varchar("communication_tone", { length: 64 }).default("professional"),
  languageStyle: varchar("language_style", { length: 64 }).default("direct"),
  forbiddenWords: text("forbidden_words"),
  // Goals & priorities
  primaryGoal: varchar("primary_goal", { length: 128 }).default("generate_leads"),
  monthlyLeadTarget: int("monthly_lead_target"),
  avgDealValue: int("avg_deal_value"),
  salesCycleLength: varchar("sales_cycle_length", { length: 64 }),
  // Custom context
  customContext: text("custom_context"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type AiConstitution = typeof aiConstitutions.$inferSelect;
export type InsertAiConstitution = typeof aiConstitutions.$inferInsert;
