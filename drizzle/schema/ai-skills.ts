import {
  int,
  varchar,
  mysqlTable,
  text,
  json,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── AI Skills Library (AI OS best practice from video) ──────────────────────
// GitHub-style centralized prompt/workflow library shared across the team
export const aiSkills = mysqlTable("ai_skills", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  // 'prompt' | 'workflow' | 'template' | 'sop'
  skillType: varchar("skill_type", { length: 32 }).notNull().default("prompt"),
  content: text("content").notNull(),
  // JSON: variables the skill accepts (e.g. {name, company, industry})
  variables: json("variables").$type<string[]>(),
  // JSON: example inputs for quick testing
  exampleInput: json("example_input").$type<Record<string, string>>(),
  tags: varchar("tags", { length: 512 }),
  // shared with whole team (team_id based) or private
  isShared: boolean("is_shared").notNull().default(false),
  usageCount: int("usage_count").notNull().default(0),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type AiSkill = typeof aiSkills.$inferSelect;
export type InsertAiSkill = typeof aiSkills.$inferInsert;
