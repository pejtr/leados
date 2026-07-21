import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Call Recordings ─────────────────────────────────────────────
export const callRecordings = mysqlTable("call_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Url: text("s3Url").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  duration: int("duration"),
  transcription: text("transcription"),
  aiAnalysis: text("aiAnalysis"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  actionItems: text("actionItems"),
  callStatus: mysqlEnum("callStatus", ["uploaded", "transcribing", "analyzing", "done", "error"]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;
