import { randomUUID as uuidv4 } from "node:crypto";
import {
  getTravelDomainById,
  getTravelPlacementByKey,
  getTravelCampaigns,
  getTravelCreativesByCampaign,
  getTargetingRulesByCampaign,
  logTravelAudit,
  upsertTravelJourney,
} from "../db/travel-network";
import { signJourneyToken } from "./journeyToken";

export interface DecisionRequest {
  domainId: string;
  placementKey: string;
  pageUrl: string;
  pageType?: string;
  destination?: string;
  contentCategory?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  trafficSource?: string;
  anonymousVisitorId: string;
  sessionId: string;
  journeyId?: string;
}

export interface DecisionResponse {
  decisionId: string;
  campaignId: string | null;
  creativeId: string | null;
  placementId: string | null;
  format?: string;
  headline?: string;
  body?: string;
  ctaText?: string;
  targetUrl?: string;
  imageUrl?: string | null;
  validUntil?: string | null;
  tracking?: {
    impressionToken: string;
    clickToken: string;
  };
  creative?: any;
  reason?: string;
}

/**
 * Helper to match targeting rules against request parameters
 */
function evaluateTargetingRules(
  rules: Array<{ field: string; operator: string; value: string }>,
  req: DecisionRequest
): boolean {
  if (rules.length === 0) return true;

  for (const rule of rules) {
    let actualValue: string | undefined = undefined;

    switch (rule.field) {
      case "domain":
        actualValue = req.domainId;
        break;
      case "page_type":
        actualValue = req.pageType;
        break;
      case "destination":
        actualValue = req.destination;
        break;
      case "content_category":
        actualValue = req.contentCategory;
        break;
      case "device_type":
        actualValue = req.deviceType;
        break;
      case "traffic_source":
        actualValue = req.trafficSource;
        break;
    }

    if (!actualValue) {
      if (rule.operator === "not_exists") continue;
      if (rule.operator === "exists") return false;
    }

    const targetVal = rule.value.toLowerCase().trim();
    const currentVal = (actualValue || "").toLowerCase().trim();

    switch (rule.operator) {
      case "equals":
        if (currentVal !== targetVal) return false;
        break;
      case "not_equals":
        if (currentVal === targetVal) return false;
        break;
      case "contains":
        if (!currentVal.includes(targetVal)) return false;
        break;
      case "not_contains":
        if (currentVal.includes(targetVal)) return false;
        break;
      case "in": {
        const allowed = targetVal.split(",").map((s) => s.trim());
        if (!allowed.includes(currentVal)) return false;
        break;
      }
      case "not_in": {
        const disallowed = targetVal.split(",").map((s) => s.trim());
        if (disallowed.includes(currentVal)) return false;
        break;
      }
      case "exists":
        if (!actualValue) return false;
        break;
      case "not_exists":
        if (actualValue) return false;
        break;
    }
  }

  return true;
}

/**
 * Execute Decision API evaluation for a cross-promo placement.
 */
export async function evaluateDecision(req: DecisionRequest): Promise<DecisionResponse> {
  const decisionId = uuidv4();

  // 1. Verify source domain exists and is active
  const domain = await getTravelDomainById(req.domainId);
  if (!domain || domain.status === "offline" || !domain.crossPromoEnabled) {
    return { decisionId, campaignId: null, creativeId: null, placementId: null, creative: null, reason: "NO_ELIGIBLE_CAMPAIGN" };
  }

  // 2. Lookup placement
  const placement = await getTravelPlacementByKey(req.domainId, req.placementKey);
  if (!placement || placement.status !== "active") {
    return { decisionId, campaignId: null, creativeId: null, placementId: null, creative: null, reason: "NO_ELIGIBLE_CAMPAIGN" };
  }

  // 3. Fetch all campaigns and filter eligible ones
  const campaigns = await getTravelCampaigns();
  const now = new Date();

  const eligibleCampaigns = [];

  for (const campaign of campaigns) {
    // Check source domain match
    if (campaign.sourceDomainId !== req.domainId) continue;

    // Check editorial status: must be approved or active
    if (campaign.editorialStatus !== "approved" && campaign.editorialStatus !== "active") continue;

    // Check runtime health
    if (campaign.runtimeHealth === "invalid" || campaign.runtimeHealth === "expired" || campaign.runtimeHealth === "offline") {
      await logTravelAudit({
        actor: "decision_engine",
        action: "creative_suppressed_health",
        entityType: "campaign",
        entityId: campaign.id,
        before: JSON.stringify({ editorialStatus: campaign.editorialStatus, runtimeHealth: campaign.runtimeHealth }),
        after: JSON.stringify({ suppressed: true, reason: `runtime_health_${campaign.runtimeHealth}` }),
      });
      continue;
    }

    // Check date window
    if (campaign.startsAt && new Date(campaign.startsAt) > now) continue;
    if (campaign.endsAt && new Date(campaign.endsAt) < now) continue;

    // Check impression limits
    if (campaign.totalImpressionLimit && campaign.impressionsCount >= campaign.totalImpressionLimit) continue;

    // Check targeting rules
    const rules = await getTargetingRulesByCampaign(campaign.id);
    const ruleMatch = evaluateTargetingRules(rules, req);
    if (!ruleMatch) continue;

    eligibleCampaigns.push(campaign);
  }

  if (eligibleCampaigns.length === 0) {
    return { decisionId, campaignId: null, creativeId: null, placementId: null, creative: null, reason: "NO_ELIGIBLE_CAMPAIGN" };
  }

  // Sort by priority ascending
  eligibleCampaigns.sort((a, b) => a.priority - b.priority);
  const selectedCampaign = eligibleCampaigns[0];

  // Fetch creatives for selected campaign
  const creatives = await getTravelCreativesByCampaign(selectedCampaign.id);
  const validCreatives = creatives.filter(
    (c: any) => c.runtimeHealth === "healthy" || c.runtimeHealth === "warning"
  );


  if (validCreatives.length === 0) {
    return { decisionId, campaignId: null, creativeId: null, placementId: null, creative: null, reason: "NO_ELIGIBLE_CAMPAIGN" };
  }

  const selectedCreative = validCreatives[0];

  // Generate or update journey record
  const journeyId = req.journeyId || `journ_${uuidv4()}`;
  await upsertTravelJourney({
    id: journeyId,
    anonymousVisitorId: req.anonymousVisitorId,
    originDomain: domain.baseUrl,
    entryPage: req.pageUrl,
  });

  // Sign journey token SERVER-SIDE only (Constraint 1 & 2)
  const journeyToken = signJourneyToken({
    anonymousVisitorId: req.anonymousVisitorId,
    sessionId: req.sessionId,
    journeyId: journeyId,
    originDomain: domain.baseUrl,
    campaignId: selectedCampaign.id,
    creativeId: selectedCreative.id,
    placementId: placement.id,
  });

  // Append signed journey token to target URL
  let signedTargetUrl = selectedCreative.targetUrl;
  if (journeyToken) {
    const separator = signedTargetUrl.includes("?") ? "&" : "?";
    signedTargetUrl = `${signedTargetUrl}${separator}onyx_journey=${encodeURIComponent(journeyToken)}`;
  }

  return {
    decisionId,
    campaignId: selectedCampaign.id,
    creativeId: selectedCreative.id,
    placementId: placement.id,
    format: selectedCreative.format,
    headline: selectedCreative.headline,
    body: selectedCreative.body,
    ctaText: selectedCreative.ctaText,
    targetUrl: signedTargetUrl,
    imageUrl: selectedCreative.imageUrl || null,
    validUntil: selectedCreative.validTo ? new Date(selectedCreative.validTo).toISOString() : null,
    tracking: {
      impressionToken: `imp_${decisionId}`,
      clickToken: `clk_${decisionId}`,
    },
  };
}
