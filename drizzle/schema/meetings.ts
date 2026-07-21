import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Meeting Links ────────────────────────────────────────────────
export const meetingLinks = mysqlTable("meeting_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  duration: int("duration").default(30).notNull(),
  description: text("description"),
  availabilityJson: text("availabilityJson"),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MeetingLink = typeof meetingLinks.$inferSelect;
export type InsertMeetingLink = typeof meetingLinks.$inferInsert;

// ─── Follow-up Sessions ───────────────────────────────────────────
export const followUpSessions = mysqlTable("follow_up_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "meeting_booked"]).default("active").notNull(),
  followUpCount: int("followUpCount").default(0).notNull(),
  maxFollowUps: int("maxFollowUps").default(5).notNull(),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  lastFollowUpAt: timestamp("lastFollowUpAt"),
  meetingBooked: boolean("meetingBooked").default(false).notNull(),
  meetingAt: timestamp("meetingAt"),
  meetingLinkId: int("meetingLinkId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FollowUpSession = typeof followUpSessions.$inferSelect;
export type InsertFollowUpSession = typeof followUpSessions.$inferInsert;
