/**
 * @onyx/travel-tracking SDK
 * Lightweight browser tracking library for LeadOS Travel Revenue Network.
 * IMPORTANT: Does NOT perform any HMAC secret handling or local token signing.
 * Token signing and journey link creation occur exclusively server-side via Decision API.
 */

export interface TravelTrackingConfig {
  domainId: string;
  projectKey?: string;
  endpoint?: string;
  consentMode?: boolean;
}

export interface TravelEventPayload {
  eventName: string;
  targetDomain?: string;
  campaignId?: string;
  creativeId?: string;
  placementId?: string;
  pageUrl?: string;
  pagePath?: string;
  pageType?: string;
  contentCategory?: string;
  destination?: string;
  departureAirport?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  trafficSource?: "organic" | "direct" | "social" | "email" | "paid" | "referral";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  affiliatePartner?: string;
  affiliateClickId?: string;
  currency?: string;
  revenue?: number;
  metadata?: Record<string, any>;
}

let trackingConfig: TravelTrackingConfig | null = null;
let anonymousVisitorIdCache: string | null = null;
let sessionIdCache: string | null = null;
let currentJourneyIdCache: string | null = null;

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnonymousVisitorId(): string {
  if (anonymousVisitorIdCache) return anonymousVisitorIdCache;
  if (typeof window !== "undefined" && window.localStorage) {
    let stored = localStorage.getItem("onyx_travel_vid");
    if (!stored) {
      stored = `anon_${generateUUID().replace(/-/g, "")}`;
      localStorage.setItem("onyx_travel_vid", stored);
    }
    anonymousVisitorIdCache = stored;
    return stored;
  }
  return `anon_${generateUUID().replace(/-/g, "")}`;
}

export function getSessionId(): string {
  if (sessionIdCache) return sessionIdCache;
  if (typeof window !== "undefined" && window.sessionStorage) {
    let stored = sessionStorage.getItem("onyx_travel_sid");
    if (!stored) {
      stored = `sess_${generateUUID().replace(/-/g, "")}`;
      sessionStorage.setItem("onyx_travel_sid", stored);
    }
    sessionIdCache = stored;
    return stored;
  }
  return `sess_${generateUUID().replace(/-/g, "")}`;
}

export function getJourneyId(): string | null {
  if (currentJourneyIdCache) return currentJourneyIdCache;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("onyx_journey");
    if (token) {
      try {
        const payloadBase64 = token.split(".")[0];
        const payloadStr = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = JSON.parse(payloadStr);
        if (parsed?.journeyId) {
          currentJourneyIdCache = parsed.journeyId;
          return parsed.journeyId;
        }
      } catch (e) {
        // Ignored if invalid token format
      }
    }
  }
  return null;
}

export function initTravelTracking(config: TravelTrackingConfig) {
  trackingConfig = {
    endpoint: "https://leados.example.com/api/travel/events",
    consentMode: true,
    ...config,
  };
  getAnonymousVisitorId();
  getSessionId();
  getJourneyId();
  return {
    trackEvent,
    trackPageView,
    trackCrossPromoImpression,
    trackCrossPromoClick,
    createJourneyLink,
    getAnonymousVisitorId,
    getSessionId,
    getJourneyId,
  };
}

export async function trackEvent(payload: TravelEventPayload) {
  if (!trackingConfig) {
    console.warn("[OnyxTravelTracking] SDK not initialized. Call initTravelTracking() first.");
    return;
  }

  const endpoint = trackingConfig.endpoint || "/api/travel/events";
  const eventId = generateUUID();
  const occurredAt = new Date().toISOString();

  const deviceType =
    payload.deviceType ||
    (typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop");

  const fullEvent = {
    event_id: eventId,
    event_name: payload.eventName,
    occurred_at: occurredAt,
    domain_id: trackingConfig.domainId,
    source_domain: typeof window !== "undefined" ? window.location.hostname : "unknown",
    target_domain: payload.targetDomain || null,
    anonymous_visitor_id: getAnonymousVisitorId(),
    session_id: getSessionId(),
    journey_id: getJourneyId(),
    campaign_id: payload.campaignId || null,
    creative_id: payload.creativeId || null,
    placement_id: payload.placementId || null,
    page_url: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : "http://unknown"),
    page_path: payload.pagePath || (typeof window !== "undefined" ? window.location.pathname : "/"),
    page_type: payload.pageType || "article",
    content_category: payload.contentCategory,
    destination: payload.destination,
    departure_airport: payload.departureAirport,
    device_type: deviceType,
    traffic_source: payload.trafficSource || "direct",
    utm_source: payload.utmSource,
    utm_medium: payload.utmMedium,
    utm_campaign: payload.utmCampaign,
    affiliate_partner: payload.affiliatePartner,
    affiliate_click_id: payload.affiliateClickId,
    currency: payload.currency || "CZK",
    revenue: payload.revenue || 0,
    metadata: payload.metadata || {},
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (trackingConfig.projectKey) {
      headers["x-onyx-project-key"] = trackingConfig.projectKey;
    }

    if (typeof fetch !== "undefined") {
      await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_key: trackingConfig.projectKey,
          events: [fullEvent],
        }),
      });
    }
  } catch (err) {
    console.error("[OnyxTravelTracking] Failed to dispatch event:", err);
  }
}

export function trackPageView(pageData?: Partial<TravelEventPayload>) {
  return trackEvent({
    eventName: "page_view",
    ...pageData,
  });
}

export function trackCrossPromoImpression(promoData: Partial<TravelEventPayload>) {
  return trackEvent({
    eventName: "crosspromo_impression",
    ...promoData,
  });
}

export function trackCrossPromoClick(promoData: Partial<TravelEventPayload>) {
  return trackEvent({
    eventName: "crosspromo_click",
    ...promoData,
  });
}

/**
 * Consumes a server-signed URL or token returned by Decision API.
 * DOES NOT perform HMAC signing in browser (Constraint 2).
 */
export function createJourneyLink(serverSignedTargetUrl: string): string {
  if (!serverSignedTargetUrl) return "#";
  return serverSignedTargetUrl;
}
