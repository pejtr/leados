import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { getDb } from "./core";
import {
  travelDomains,
  travelEvents,
  travelCampaigns,
  travelCreatives,
  travelPlacements,
  travelTargetingRules,
  travelJourneys,
  travelAffiliateClicks,
  affiliatePartners,
  affiliateConversions,
  travelAuditLogs,
  type InsertTravelDomain,
  type InsertTravelEvent,
  type InsertTravelCampaign,
  type InsertTravelCreative,
  type InsertTravelPlacement,
  type InsertTravelTargetingRule,
  type InsertTravelJourney,
  type InsertTravelAffiliateClick,
  type InsertAffiliatePartner,
  type InsertAffiliateConversion,
  type InsertTravelAuditLog,
} from "../../drizzle/schema/travel-network";

// Memory fallbacks for test/no-db environment
const memoryDomains: Map<string, any> = new Map();
const memoryPartners: Map<string, any> = new Map();
const memoryConversions: Map<string, any> = new Map();

// ─── 1. Domains ──────────────────────────────────────────────────
export async function getTravelDomains() {
  const db = await getDb();
  if (!db) return Array.from(memoryDomains.values());
  return await db.select().from(travelDomains);
}

export async function getTravelDomainBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    for (const d of Array.from(memoryDomains.values())) {
      if (d.slug === slug) return d;
    }
    return null;
  }
  const rows = await db.select().from(travelDomains).where(eq(travelDomains.slug, slug));
  return rows[0] || null;
}

export async function getTravelDomainById(id: string) {
  const db = await getDb();
  if (!db) return memoryDomains.get(id) || null;
  const rows = await db.select().from(travelDomains).where(eq(travelDomains.id, id));
  return rows[0] || null;
}

export async function getTravelDomainByProjectKey(projectKey: string) {
  const db = await getDb();
  if (!db) {
    for (const d of Array.from(memoryDomains.values())) {
      if (d.projectKey === projectKey) return d;
    }
    return null;
  }
  const rows = await db.select().from(travelDomains).where(eq(travelDomains.projectKey, projectKey));
  return rows[0] || null;
}

export async function createTravelDomain(data: InsertTravelDomain) {
  memoryDomains.set(data.id, data);
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelDomains).values(data);
  return (await getTravelDomainById(data.id)) || (data as any);
}

// ─── 2. Events & Idempotency ────────────────────────────────────
export async function getTravelEventByIdempotencyKey(eventId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(travelEvents).where(eq(travelEvents.eventId, eventId));
  return rows[0] || null;
}

export async function insertTravelEvent(data: InsertTravelEvent) {
  const db = await getDb();
  if (!db) return { inserted: true, duplicate: false };
  try {
    await db.insert(travelEvents).values(data);
    return { inserted: true, duplicate: false };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate")) {
      return { inserted: false, duplicate: true };
    }
    throw err;
  }
}

// ─── 3. Campaigns & Creatives ───────────────────────────────────
export async function getTravelCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(travelCampaigns).orderBy(desc(travelCampaigns.createdAt));
}

export async function getTravelCampaignById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(travelCampaigns).where(eq(travelCampaigns.id, id));
  return rows[0] || null;
}

export async function createTravelCampaign(data: InsertTravelCampaign) {
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelCampaigns).values(data);
  return (await getTravelCampaignById(data.id)) || (data as any);
}

export async function updateCampaignEditorialStatus(id: string, status: any, actor: string) {
  const db = await getDb();
  if (!db) return null;
  const before = await getTravelCampaignById(id);
  if (!before) return null;

  await db
    .update(travelCampaigns)
    .set({ editorialStatus: status, updatedAt: new Date() })
    .where(eq(travelCampaigns.id, id));

  const after = await getTravelCampaignById(id);
  await logTravelAudit({
    actor,
    action: "update_editorial_status",
    entityType: "campaign",
    entityId: id,
    before: JSON.stringify(before),
    after: JSON.stringify(after),
  });
  return after;
}

export async function updateCampaignRuntimeHealth(id: string, health: any, reason?: string) {
  const db = await getDb();
  if (!db) return null;
  const before = await getTravelCampaignById(id);
  if (!before) return null;

  await db
    .update(travelCampaigns)
    .set({ runtimeHealth: health, updatedAt: new Date() })
    .where(eq(travelCampaigns.id, id));

  const after = await getTravelCampaignById(id);
  await logTravelAudit({
    actor: "system_health_monitor",
    action: "update_runtime_health",
    entityType: "campaign",
    entityId: id,
    before: JSON.stringify(before),
    after: JSON.stringify(after),
    metadata: reason ? JSON.stringify({ reason }) : undefined,
  });
  return after;
}

export async function getTravelCreativesByCampaign(campaignId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(travelCreatives)
    .where(eq(travelCreatives.campaignId, campaignId));
}

export async function createTravelCreative(data: InsertTravelCreative) {
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelCreatives).values(data);
  const rows = await db.select().from(travelCreatives).where(eq(travelCreatives.id, data.id));
  return rows[0] || (data as any);
}

// ─── 4. Placements & Targeting Rules ────────────────────────────
export async function getTravelPlacementByKey(domainId: string, placementKey: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(travelPlacements)
    .where(
      and(
        eq(travelPlacements.domainId, domainId),
        eq(travelPlacements.placementKey, placementKey)
      )
    );
  return rows[0] || null;
}

export async function createTravelPlacement(data: InsertTravelPlacement) {
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelPlacements).values(data);
  const rows = await db.select().from(travelPlacements).where(eq(travelPlacements.id, data.id));
  return rows[0] || (data as any);
}

export async function getTargetingRulesByCampaign(campaignId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(travelTargetingRules)
    .where(eq(travelTargetingRules.campaignId, campaignId));
}

export async function createTargetingRule(data: InsertTravelTargetingRule) {
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelTargetingRules).values(data);
  const rows = await db.select().from(travelTargetingRules).where(eq(travelTargetingRules.id, data.id));
  return rows[0] || (data as any);
}

// ─── 5. Journeys & Affiliate Clicks ─────────────────────────────
export async function getTravelJourneyById(journeyId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(travelJourneys).where(eq(travelJourneys.id, journeyId));
  return rows[0] || null;
}

export async function upsertTravelJourney(data: InsertTravelJourney) {
  const db = await getDb();
  if (!db) return data as any;
  const existing = await getTravelJourneyById(data.id);
  if (existing) {
    let assisted: string[] = [];
    try {
      assisted = JSON.parse(existing.assistedDomains || "[]");
    } catch (e) {
      assisted = [];
    }
    if (data.originDomain && !assisted.includes(data.originDomain)) {
      assisted.push(data.originDomain);
    }
    await db
      .update(travelJourneys)
      .set({
        assistedDomains: JSON.stringify(assisted),
        updatedAt: new Date(),
      })
      .where(eq(travelJourneys.id, data.id));
    return await getTravelJourneyById(data.id);
  } else {
    const assisted = [data.originDomain];
    await db.insert(travelJourneys).values({
      ...data,
      assistedDomains: JSON.stringify(assisted),
    });
    return await getTravelJourneyById(data.id);
  }
}

export async function registerAffiliateClick(data: InsertTravelAffiliateClick) {
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(travelAffiliateClicks).values(data);
  const rows = await db.select().from(travelAffiliateClicks).where(eq(travelAffiliateClicks.id, data.id));
  return rows[0] || (data as any);
}

export async function getAffiliateClickById(clickId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(travelAffiliateClicks).where(eq(travelAffiliateClicks.id, clickId));
  return rows[0] || null;
}

// ─── 6. Affiliate Partners & Conversions ────────────────────────
export async function getAffiliatePartners() {
  const db = await getDb();
  if (!db) return Array.from(memoryPartners.values());
  return await db.select().from(affiliatePartners);
}

export async function createAffiliatePartner(data: InsertAffiliatePartner) {
  memoryPartners.set(data.id, data);
  const db = await getDb();
  if (!db) return data as any;
  await db.insert(affiliatePartners).values(data);
  const rows = await db.select().from(affiliatePartners).where(eq(affiliatePartners.id, data.id));
  return rows[0] || (data as any);
}

export async function importAffiliateConversion(data: InsertAffiliateConversion) {
  memoryConversions.set(data.id, data);
  const db = await getDb();
  if (!db) return { success: true, duplicate: false, conversion: data as any };

  const existing = await db
    .select()
    .from(affiliateConversions)
    .where(
      and(
        eq(affiliateConversions.partnerId, data.partnerId),
        eq(affiliateConversions.externalConversionId, data.externalConversionId)
      )
    );

  if (existing.length > 0) {
    const prev = existing[0];
    if (prev.status !== data.status) {
      await db
        .update(affiliateConversions)
        .set({
          status: data.status,
          confirmedAt: data.status === "confirmed" ? new Date() : prev.confirmedAt,
          cancelledAt: data.status === "cancelled" ? new Date() : prev.cancelledAt,
          updatedAt: new Date(),
        })
        .where(eq(affiliateConversions.id, prev.id));

      await logTravelAudit({
        actor: "conversion_importer",
        action: "conversion_status_changed",
        entityType: "affiliate_conversion",
        entityId: prev.id,
        before: JSON.stringify(prev),
        after: JSON.stringify({ ...prev, status: data.status }),
      });
    }
    return { success: true, duplicate: true, conversion: existing[0] };
  }

  await db.insert(affiliateConversions).values(data);
  const rows = await db.select().from(affiliateConversions).where(eq(affiliateConversions.id, data.id));
  return { success: true, duplicate: false, conversion: rows[0] || (data as any) };
}

// ─── 7. Dashboard Overview Aggregation ──────────────────────────
export async function getTravelOverviewMetrics() {
  const db = await getDb();
  if (!db) {
    let pendingConversions = 0;
    let confirmedConversions = 0;
    let pendingCommission = 0;
    let confirmedCommission = 0;

    for (const conv of Array.from(memoryConversions.values())) {
      const val = parseFloat(conv.commissionValue || "0");
      if (conv.status === "pending") {
        pendingConversions++;
        pendingCommission += val;
      } else if (conv.status === "confirmed") {
        confirmedConversions++;
        confirmedCommission += val;
      }
    }

    return {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      crossDomainArrivals: 0,
      affiliateClicks: 0,
      pendingConversions,
      confirmedConversions,
      pendingCommission: Math.round(pendingCommission * 100) / 100,
      confirmedCommission: Math.round(confirmedCommission * 100) / 100,
    };
  }

  const events = await db.select().from(travelEvents);
  let impressions = 0;
  let clicks = 0;
  let crossDomainArrivals = 0;
  let affiliateClickEvents = 0;

  for (const ev of events) {
    if (ev.eventName === "crosspromo_impression") impressions++;
    if (ev.eventName === "crosspromo_click") clicks++;
    if (ev.eventName === "cross_domain_arrival") crossDomainArrivals++;
    if (ev.eventName === "affiliate_redirect") affiliateClickEvents++;
  }

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const conversions = await db.select().from(affiliateConversions);
  let pendingConversions = 0;
  let confirmedConversions = 0;
  let pendingCommission = 0;
  let confirmedCommission = 0;

  for (const conv of conversions) {
    const val = parseFloat(conv.commissionValue || "0");
    if (conv.status === "pending") {
      pendingConversions++;
      pendingCommission += val;
    } else if (conv.status === "confirmed") {
      confirmedConversions++;
      confirmedCommission += val;
    }
  }

  return {
    impressions,
    clicks,
    ctr: Math.round(ctr * 100) / 100,
    crossDomainArrivals,
    affiliateClicks: affiliateClickEvents,
    pendingConversions,
    confirmedConversions,
    pendingCommission: Math.round(pendingCommission * 100) / 100,
    confirmedCommission: Math.round(confirmedCommission * 100) / 100,
  };
}

// ─── 8. Audit Log Helper ─────────────────────────────────────────
export async function logTravelAudit(data: InsertTravelAuditLog) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(travelAuditLogs).values(data);
  } catch (err) {
    console.error("[TravelAuditLog] Error logging audit:", err);
  }
}
