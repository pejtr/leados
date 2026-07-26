import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── 1. Travel Domains (Central Domain Registry) ────────────────
export const travelDomains = mysqlTable("travel_domains", {
  id: varchar("id", { length: 36 }).primaryKey(), // Stable UUID
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  baseUrl: varchar("baseUrl", { length: 512 }).notNull(),
  projectKey: varchar("projectKey", { length: 64 }).notNull().unique(), // Public tracking key for client auth
  domainType: mysqlEnum("domainType", [
    "flight_search",
    "package_holiday",
    "destination_content",
    "travel_content",
    "other",
  ]).notNull(),
  status: mysqlEnum("status", [
    "draft",
    "active",
    "paused",
    "degraded",
    "offline",
    "archived",
  ]).default("draft").notNull(),
  trackingEnabled: boolean("trackingEnabled").default(true).notNull(),
  crossPromoEnabled: boolean("crossPromoEnabled").default(true).notNull(),
  affiliateEnabled: boolean("affiliateEnabled").default(true).notNull(),
  defaultCurrency: varchar("defaultCurrency", { length: 3 }).default("CZK").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Europe/Prague").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TravelDomain = typeof travelDomains.$inferSelect;
export type InsertTravelDomain = typeof travelDomains.$inferInsert;

// ─── 2. Travel Events (Idempotent Raw Event Log) ────────────────
export const travelEvents = mysqlTable("travel_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull().unique(), // Idempotency key
  eventName: mysqlEnum("eventName", [
    "page_view",
    "crosspromo_request",
    "crosspromo_impression",
    "crosspromo_click",
    "search_start",
    "search_submit",
    "offer_impression",
    "offer_view",
    "offer_click",
    "affiliate_redirect",
    "booking_start",
    "booking_complete",
    "revenue_pending",
    "revenue_confirmed",
    "revenue_cancelled",
    "cross_domain_arrival",
    "empty_results",
    "tracking_error",
  ]).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  domainId: varchar("domainId", { length: 36 }).notNull(),
  sourceDomain: varchar("sourceDomain", { length: 128 }).notNull(),
  targetDomain: varchar("targetDomain", { length: 128 }),
  anonymousVisitorId: varchar("anonymousVisitorId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  journeyId: varchar("journeyId", { length: 128 }),
  campaignId: varchar("campaignId", { length: 36 }),
  creativeId: varchar("creativeId", { length: 36 }),
  placementId: varchar("placementId", { length: 36 }),
  pageUrl: text("pageUrl").notNull(),
  pagePath: varchar("pagePath", { length: 512 }),
  pageType: varchar("pageType", { length: 64 }),
  contentCategory: varchar("contentCategory", { length: 128 }),
  destination: varchar("destination", { length: 128 }),
  departureAirport: varchar("departureAirport", { length: 16 }),
  deviceType: mysqlEnum("deviceType", ["desktop", "mobile", "tablet"]).default("desktop").notNull(),
  trafficSource: mysqlEnum("trafficSource", [
    "organic",
    "direct",
    "social",
    "email",
    "paid",
    "referral",
  ]).default("direct").notNull(),
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  affiliatePartner: varchar("affiliatePartner", { length: 64 }),
  affiliateClickId: varchar("affiliateClickId", { length: 128 }),
  currency: varchar("currency", { length: 3 }).default("CZK").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  metadata: text("metadata"), // Max 4KB validated JSON string
}, (table) => ({
  eventIdUnique: uniqueIndex("event_id_unique").on(table.eventId),
  domainIdx: index("event_domain_idx").on(table.domainId),
  eventNameIdx: index("event_name_idx").on(table.eventName),
  occurredAtIdx: index("event_occurred_idx").on(table.occurredAt),
  journeyIdx: index("event_journey_idx").on(table.journeyId),
}));

export type TravelEvent = typeof travelEvents.$inferSelect;
export type InsertTravelEvent = typeof travelEvents.$inferInsert;

// ─── 3. Travel Campaigns ─────────────────────────────────────────
export const travelCampaigns = mysqlTable("travel_campaigns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull(),
  objective: mysqlEnum("objective", [
    "affiliate_revenue",
    "cross_sell",
    "destination_discovery",
    "package_upgrade",
    "flight_alternative",
    "content_discovery",
    "newsletter_signup",
  ]).notNull(),
  editorialStatus: mysqlEnum("editorialStatus", [
    "draft",
    "review",
    "approved",
    "scheduled",
    "active",
    "paused",
    "rejected",
    "archived",
  ]).default("draft").notNull(),
  runtimeHealth: mysqlEnum("runtimeHealth", [
    "unknown",
    "healthy",
    "warning",
    "invalid",
    "expired",
    "offline",
  ]).default("healthy").notNull(),
  priority: int("priority").default(100).notNull(), // Lower = higher priority
  sourceDomainId: varchar("sourceDomainId", { length: 36 }).notNull(),
  targetDomainId: varchar("targetDomainId", { length: 36 }).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  dailyImpressionLimit: int("dailyImpressionLimit"),
  totalImpressionLimit: int("totalImpressionLimit"),
  impressionsCount: int("impressionsCount").default(0).notNull(),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  approvedBy: varchar("approvedBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  editorialStatusIdx: index("campaign_editorial_idx").on(table.editorialStatus),
  runtimeHealthIdx: index("campaign_health_idx").on(table.runtimeHealth),
  sourceTargetIdx: index("campaign_source_target_idx").on(table.sourceDomainId, table.targetDomainId),
}));

export type TravelCampaign = typeof travelCampaigns.$inferSelect;
export type InsertTravelCampaign = typeof travelCampaigns.$inferInsert;

// ─── 4. Travel Creatives ─────────────────────────────────────────
export const travelCreatives = mysqlTable("travel_creatives", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaignId", { length: 36 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  format: mysqlEnum("format", [
    "native_card",
    "horizontal_banner",
    "inline_banner",
    "compact_card",
    "search_alternative",
    "empty_state",
    "footer_link",
    "header_link",
  ]).notNull(),
  headline: varchar("headline", { length: 256 }).notNull(),
  body: text("body").notNull(),
  ctaText: varchar("ctaText", { length: 128 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  mobileImageUrl: varchar("mobileImageUrl", { length: 512 }),
  targetUrl: varchar("targetUrl", { length: 1024 }).notNull(),
  destination: varchar("destination", { length: 128 }),
  priceValue: decimal("priceValue", { precision: 12, scale: 2 }),
  priceCurrency: varchar("priceCurrency", { length: 3 }),
  priceLabel: varchar("priceLabel", { length: 64 }),
  validFrom: timestamp("validFrom"),
  validTo: timestamp("validTo"),
  runtimeHealth: mysqlEnum("runtimeHealth", [
    "unknown",
    "healthy",
    "warning",
    "invalid",
    "expired",
    "offline",
  ]).default("healthy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  campaignIdx: index("creative_campaign_idx").on(table.campaignId),
  healthIdx: index("creative_health_idx").on(table.runtimeHealth),
}));

export type TravelCreative = typeof travelCreatives.$inferSelect;
export type InsertTravelCreative = typeof travelCreatives.$inferInsert;

// ─── 5. Travel Placements ────────────────────────────────────────
export const travelPlacements = mysqlTable("travel_placements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  domainId: varchar("domainId", { length: 36 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  placementKey: varchar("placementKey", { length: 128 }).notNull(), // e.g., 'article_mid_content'
  pageType: varchar("pageType", { length: 64 }),
  position: varchar("position", { length: 64 }),
  deviceScope: mysqlEnum("deviceScope", ["all", "desktop_only", "mobile_only"]).default("all").notNull(),
  maxCreatives: int("maxCreatives").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  domainKeyIdx: uniqueIndex("placement_domain_key_unique").on(table.domainId, table.placementKey),
}));

export type TravelPlacement = typeof travelPlacements.$inferSelect;
export type InsertTravelPlacement = typeof travelPlacements.$inferInsert;

// ─── 6. Travel Targeting Rules ───────────────────────────────────
export const travelTargetingRules = mysqlTable("travel_targeting_rules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaignId", { length: 36 }).notNull(),
  ruleGroup: varchar("ruleGroup", { length: 64 }).default("default").notNull(),
  field: mysqlEnum("field", [
    "domain",
    "page_type",
    "page_path",
    "destination",
    "content_category",
    "departure_airport",
    "device_type",
    "traffic_source",
    "utm_source",
    "returning_visitor",
    "pages_viewed",
    "previous_domain",
    "local_hour",
    "weekday",
  ]).notNull(),
  operator: mysqlEnum("operator", [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "in",
    "not_in",
    "greater_than",
    "less_than",
    "exists",
    "not_exists",
  ]).notNull(),
  value: text("value").notNull(),
  priority: int("priority").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index("rule_campaign_idx").on(table.campaignId),
}));

export type TravelTargetingRule = typeof travelTargetingRules.$inferSelect;
export type InsertTravelTargetingRule = typeof travelTargetingRules.$inferInsert;

// ─── 7. Travel Journeys (Cross-Domain Navigation Journey) ───────
export const travelJourneys = mysqlTable("travel_journeys", {
  id: varchar("id", { length: 128 }).primaryKey(), // journey_id
  anonymousVisitorId: varchar("anonymousVisitorId", { length: 128 }).notNull(),
  originDomain: varchar("originDomain", { length: 128 }).notNull(),
  entryPage: varchar("entryPage", { length: 512 }),
  assistedDomains: text("assistedDomains"), // JSON array of domain strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TravelJourney = typeof travelJourneys.$inferSelect;
export type InsertTravelJourney = typeof travelJourneys.$inferInsert;

// ─── 8. Travel Affiliate Clicks ──────────────────────────────────
export const travelAffiliateClicks = mysqlTable("travel_affiliate_clicks", {
  id: varchar("id", { length: 128 }).primaryKey(), // click_id
  journeyId: varchar("journeyId", { length: 128 }).notNull(),
  decisionId: varchar("decisionId", { length: 128 }),
  campaignId: varchar("campaignId", { length: 36 }),
  creativeId: varchar("creativeId", { length: 36 }),
  placementId: varchar("placementId", { length: 36 }),
  sourceDomain: varchar("sourceDomain", { length: 128 }).notNull(),
  targetDomain: varchar("targetDomain", { length: 128 }).notNull(),
  affiliatePartner: varchar("affiliatePartner", { length: 64 }),
  partnerSubId: varchar("partnerSubId", { length: 128 }),
  destinationUrl: text("destinationUrl").notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => ({
  journeyIdx: index("click_journey_idx").on(table.journeyId),
  partnerSubIdx: index("click_partner_sub_idx").on(table.partnerSubId),
}));

export type TravelAffiliateClick = typeof travelAffiliateClicks.$inferSelect;
export type InsertTravelAffiliateClick = typeof travelAffiliateClicks.$inferInsert;

// ─── 9. Affiliate Partners ───────────────────────────────────────
export const affiliatePartners = mysqlTable("affiliate_partners", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  currency: varchar("currency", { length: 3 }).default("CZK").notNull(),
  attributionWindowDays: int("attributionWindowDays").default(30).notNull(),
  subIdParameter: varchar("subIdParameter", { length: 64 }).default("sub_id").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliatePartner = typeof affiliatePartners.$inferSelect;
export type InsertAffiliatePartner = typeof affiliatePartners.$inferInsert;

// ─── 10. Affiliate Conversions ───────────────────────────────────
export const affiliateConversions = mysqlTable("affiliate_conversions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  partnerId: varchar("partnerId", { length: 36 }).notNull(),
  externalConversionId: varchar("externalConversionId", { length: 128 }).notNull(),
  affiliateClickId: varchar("affiliateClickId", { length: 128 }),
  partnerSubId: varchar("partnerSubId", { length: 128 }),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "cancelled",
    "rejected",
    "unknown",
  ]).default("pending").notNull(),
  grossRevenue: decimal("grossRevenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  commissionValue: decimal("commissionValue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("CZK").notNull(),
  bookingValue: decimal("bookingValue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
  rawPayload: text("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueExternalPartner: uniqueIndex("conv_partner_ext_unique").on(table.partnerId, table.externalConversionId),
  statusIdx: index("conv_status_idx").on(table.status),
  clickIdx: index("conv_click_idx").on(table.affiliateClickId),
}));

export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertAffiliateConversion = typeof affiliateConversions.$inferInsert;

// ─── 11. Travel Audit Logs ───────────────────────────────────────
export const travelAuditLogs = mysqlTable("travel_audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  actor: varchar("actor", { length: 128 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: varchar("entityId", { length: 128 }).notNull(),
  before: text("before"),
  after: text("after"),
  correlationId: varchar("correlationId", { length: 128 }),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("audit_entity_idx").on(table.entityType, table.entityId),
  actionIdx: index("audit_action_idx").on(table.action),
}));

export type TravelAuditLog = typeof travelAuditLogs.$inferSelect;
export type InsertTravelAuditLog = typeof travelAuditLogs.$inferInsert;