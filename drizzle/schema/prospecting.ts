import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Email Verifications ──────────────────────────────────────
export const emailVerifications = mysqlTable("email_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["valid", "invalid", "risky", "unknown", "pending"]).default("pending").notNull(),
  provider: varchar("provider", { length: 64 }).default("bouncer"),
  score: int("score"), // 0-100
  reason: varchar("reason", { length: 256 }),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;

// ─── Speed-to-Lead ────────────────────────────────────────────
export const speedToLeadConfigs = mysqlTable("speed_to_lead_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Auto-response settings
  autoEmailEnabled: boolean("autoEmailEnabled").default(true).notNull(),
  autoEmailTemplateId: int("autoEmailTemplateId"), // FK to email_templates
  responseDelaySeconds: int("responseDelaySeconds").default(60).notNull(), // how fast to respond
  // Notification
  notifyOnNewLead: boolean("notifyOnNewLead").default(true).notNull(),
  notifyChannel: mysqlEnum("notifyChannel", ["email", "slack", "both"]).default("email"),
  notifyTarget: text("notifyTarget"),
  totalAutoResponses: int("totalAutoResponses").default(0).notNull(),
  avgResponseTime: int("avgResponseTime").default(0), // seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpeedToLeadConfig = typeof speedToLeadConfigs.$inferSelect;
export type InsertSpeedToLeadConfig = typeof speedToLeadConfigs.$inferInsert;

// ─── ICP Builder ──────────────────────────────────────────────
export const icpProfiles = mysqlTable("icp_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  // Firmographic
  industries: text("industries").notNull(),
  companySizeMin: int("companySizeMin").default(10),
  companySizeMax: int("companySizeMax").default(500),
  revenueRange: varchar("revenueRange", { length: 64 }),
  locations: text("locations").notNull(),
  // Technographic
  technologies: text("technologies"),
  // Behavioral
  buyingSignals: text("buyingSignals"),
  painPoints: text("painPoints"),
  // Scoring
  fitScore: int("fitScore").default(0), // AI-calculated 0-100
  matchedLeads: int("matchedLeads").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IcpProfile = typeof icpProfiles.$inferSelect;
export type InsertIcpProfile = typeof icpProfiles.$inferInsert;

// ─── LinkedIn Mutual Connections ──────────────────────────────
export const linkedinConnections = mysqlTable("linkedin_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  connectionName: varchar("connectionName", { length: 256 }).notNull(),
  connectionTitle: varchar("connectionTitle", { length: 256 }),
  connectionCompany: varchar("connectionCompany", { length: 256 }),
  connectionLinkedinUrl: varchar("connectionLinkedinUrl", { length: 512 }),
  relationshipStrength: mysqlEnum("relationshipStrength", ["strong", "moderate", "weak"]).default("moderate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LinkedinConnection = typeof linkedinConnections.$inferSelect;
export type InsertLinkedinConnection = typeof linkedinConnections.$inferInsert;

// ─── Tech Stack Detection ─────────────────────────────────────
export const techStackDetections = mysqlTable("tech_stack_detections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  domain: varchar("domain", { length: 256 }).notNull(),
  technologies: text("technologies").notNull(), // JSON array of detected techs
  categories: text("categories"), // JSON: { cms, analytics, marketing, etc. }
  lastScannedAt: timestamp("lastScannedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TechStackDetection = typeof techStackDetections.$inferSelect;
export type InsertTechStackDetection = typeof techStackDetections.$inferInsert;
