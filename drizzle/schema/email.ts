import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Email Templates ────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Email Sequences ─────────────────────────────────────────────
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailSequenceSteps = mysqlTable("email_sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  delayDays: int("delayDays").default(0).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  body: text("body").notNull(),
  stepType: mysqlEnum("stepType", ["email", "linkedin_connect", "linkedin_message", "call"]).default("email").notNull(),
  linkedinNote: text("linkedinNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailSequenceEnrollments = mysqlTable("email_sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "unsubscribed"]).default("active").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  nextSendAt: timestamp("nextSendAt"),
  completedAt: timestamp("completedAt"),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;
export type EmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferSelect;
