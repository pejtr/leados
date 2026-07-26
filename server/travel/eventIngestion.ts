import { z } from "zod";
import { getTravelDomainById, getTravelDomainByProjectKey, insertTravelEvent } from "../db/travel-network";

// ─── 18 Mandatory Event Names ────────────────────────────────────
export const MANDATORY_EVENT_NAMES = [
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
] as const;

// ─── Single Event Zod Schema ─────────────────────────────────────
export const SingleEventSchema = z.object({
  event_id: z.string().uuid(),
  event_name: z.enum(MANDATORY_EVENT_NAMES),
  occurred_at: z.string().datetime(),
  domain_id: z.string().uuid(),
  source_domain: z.string().min(1).max(128),
  target_domain: z.string().max(128).nullable().optional(),
  anonymous_visitor_id: z.string().min(1).max(128),
  session_id: z.string().min(1).max(128),
  journey_id: z.string().max(128).nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  creative_id: z.string().uuid().nullable().optional(),
  placement_id: z.string().uuid().nullable().optional(),
  page_url: z.string().url().max(2048),
  page_path: z.string().max(512).optional(),
  page_type: z.string().max(64).optional(),
  content_category: z.string().max(128).optional(),
  destination: z.string().max(128).optional(),
  departure_airport: z.string().max(16).nullable().optional(),
  device_type: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
  traffic_source: z.enum(["organic", "direct", "social", "email", "paid", "referral"]).default("direct"),
  utm_source: z.string().max(128).nullable().optional(),
  utm_medium: z.string().max(128).nullable().optional(),
  utm_campaign: z.string().max(128).nullable().optional(),
  affiliate_partner: z.string().max(64).nullable().optional(),
  affiliate_click_id: z.string().max(128).nullable().optional(),
  currency: z.string().length(3).default("CZK"),
  revenue: z.number().default(0),
  metadata: z.record(z.string(), z.any()).optional(),

});

export const BatchEventSchema = z.object({
  project_key: z.string().min(1).max(64).optional(),
  events: z.array(SingleEventSchema).min(1).max(50),
});

export type SingleEventInput = z.infer<typeof SingleEventSchema>;

/**
 * Validate and ingest a batch of events securely.
 */
export async function processEventIngestion(
  body: unknown,
  originHeader?: string,
  projectKeyHeader?: string
) {
  const parsed = BatchEventSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: "INVALID_PAYLOAD",
        details: parsed.error.issues,
      },
    };
  }

  const { events } = parsed.data;
  const projectKey = projectKeyHeader || parsed.data.project_key;

  // Validate Project Key if provided or check registered domain
  if (projectKey) {
    const registeredDomain = await getTravelDomainByProjectKey(projectKey);
    if (!registeredDomain || registeredDomain.status === "offline") {
      return {
        status: 403,
        body: { error: "UNAUTHORIZED_DOMAIN", message: "Invalid or inactive project key" },
      };
    }
  }

  const results = {
    received: events.length,
    processed: 0,
    duplicates: 0,
    errors: 0,
  };

  for (const event of events) {
    // Validate domainId exists
    const domain = await getTravelDomainById(event.domain_id);
    if (!domain || !domain.trackingEnabled || domain.status === "offline") {
      results.errors++;
      continue;
    }

    // Metadata size check (max 4KB stringified)
    const metadataStr = event.metadata ? JSON.stringify(event.metadata) : null;
    if (metadataStr && metadataStr.length > 4096) {
      results.errors++;
      continue;
    }

    const insertResult = await insertTravelEvent({
      eventId: event.event_id,
      eventName: event.event_name,
      occurredAt: new Date(event.occurred_at),
      domainId: event.domain_id,
      sourceDomain: event.source_domain,
      targetDomain: event.target_domain || null,
      anonymousVisitorId: event.anonymous_visitor_id,
      sessionId: event.session_id,
      journeyId: event.journey_id || null,
      campaignId: event.campaign_id || null,
      creativeId: event.creative_id || null,
      placementId: event.placement_id || null,
      pageUrl: event.page_url,
      pagePath: event.page_path || null,
      pageType: event.page_type || null,
      contentCategory: event.content_category || null,
      destination: event.destination || null,
      departureAirport: event.departure_airport || null,
      deviceType: event.device_type,
      trafficSource: event.traffic_source,
      utmSource: event.utm_source || null,
      utmMedium: event.utm_medium || null,
      utmCampaign: event.utm_campaign || null,
      affiliatePartner: event.affiliate_partner || null,
      affiliateClickId: event.affiliate_click_id || null,
      currency: event.currency,
      revenue: event.revenue.toFixed(2),
      metadata: metadataStr,
    });

    if (insertResult.inserted) {
      results.processed++;
    } else if (insertResult.duplicate) {
      results.duplicates++;
    } else {
      results.errors++;
    }
  }

  return {
    status: 200,
    body: {
      status: "success",
      results,
    },
  };
}
