import {
  int,
  varchar,
  mysqlEnum,
  mysqlTable,
  text,
  tinyint,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Google Maps Leads (Restaurant/Business scraper for web agency) ────────────
export const googleMapsLeads = mysqlTable("google_maps_leads", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  placeId: varchar("place_id", { length: 128 }),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 128 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  phone: varchar("phone", { length: 64 }),
  website: text("website"),
  hasWebsite: tinyint("has_website").default(0).notNull(),
  webQualityScore: int("web_quality_score"),
  rating: varchar("rating", { length: 8 }),
  reviewsCount: int("reviews_count"),
  lat: varchar("lat", { length: 32 }),
  lng: varchar("lng", { length: 32 }),
  googleMapsUrl: text("google_maps_url"),
  status: mysqlEnum("gml_status", ["new", "contacted", "interested", "converted", "rejected"]).default("new").notNull(),
  convertedToLeadId: int("converted_to_lead_id"),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type GoogleMapsLead = typeof googleMapsLeads.$inferSelect;
export type InsertGoogleMapsLead = typeof googleMapsLeads.$inferInsert;

// ─── Web Audits (AI-powered website quality analysis for web agency outreach) ──
export const webAudits = mysqlTable("web_audits", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  url: text("url").notNull(),
  businessName: varchar("business_name", { length: 256 }),
  overallScore: int("overall_score").notNull(),
  performanceScore: int("performance_score"),
  seoScore: int("seo_score"),
  mobileScore: int("mobile_score"),
  designScore: int("design_score"),
  speedMs: int("speed_ms"),
  issues: json("issues").$type<Array<{ severity: "critical"|"warning"|"info"; category: string; message: string }>>().$default(() => []),
  recommendations: json("recommendations").$type<Array<{ priority: number; title: string; description: string; impact: string }>>().$default(() => []),
  techStack: json("tech_stack").$type<string[]>().$default(() => []),
  hasContactForm: tinyint("has_contact_form").default(0),
  hasSsl: tinyint("has_ssl").default(0),
  hasMobileMenu: tinyint("has_mobile_menu").default(0),
  hasOnlineBooking: tinyint("has_online_booking").default(0),
  screenshotUrl: text("screenshot_url"),
  linkedGoogleMapsLeadId: int("linked_google_maps_lead_id"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type WebAudit = typeof webAudits.$inferSelect;
export type InsertWebAudit = typeof webAudits.$inferInsert;
