import { z } from "zod";
import { randomUUID as uuidv4 } from "node:crypto";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getTravelDomains,
  createTravelDomain,
  getTravelCampaigns,
  getTravelCampaignById,
  createTravelCampaign,
  updateCampaignEditorialStatus,
  getTravelCreativesByCampaign,
  createTravelCreative,
  createTravelPlacement,
  getTravelOverviewMetrics,
  importAffiliateConversion,
  createAffiliatePartner,
  getAffiliatePartners,
  logTravelAudit,
  getTravelDomainBySlug,
} from "../db/travel-network";

export const travelNetworkRouter = router({
  // ─── Overview Dashboard Metrics ──────────────────────────────────
  getOverview: protectedProcedure.query(async () => {
    return await getTravelOverviewMetrics();
  }),

  // ─── Domain Registry ──────────────────────────────────────────────
  getDomains: protectedProcedure.query(async () => {
    return await getTravelDomains();
  }),

  seedPilotDomains: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await getTravelDomains();
    if (existing.length > 0) {
      return { seeded: false, message: "Domains already seeded" };
    }

    const domainList = [
      {
        id: uuidv4(),
        name: "Akční letenky",
        slug: "akcni-letenky.com",
        baseUrl: "https://www.akcni-letenky.com",
        projectKey: `proj_akcni_${uuidv4().substring(0, 8)}`,
        domainType: "flight_search" as const,
        status: "active" as const,
      },
      {
        id: uuidv4(),
        name: "Last Minute dovolené",
        slug: "lastminutedovolene.cz",
        baseUrl: "https://lastminutedovolene.cz",
        projectKey: `proj_last_${uuidv4().substring(0, 8)}`,
        domainType: "package_holiday" as const,
        status: "active" as const,
      },
      {
        id: uuidv4(),
        name: "Do Itálie",
        slug: "do-italie.cz",
        baseUrl: "https://www.do-italie.cz",
        projectKey: `proj_italie_${uuidv4().substring(0, 8)}`,
        domainType: "destination_content" as const,
        status: "active" as const,
      },
    ];

    for (const d of domainList) {
      await createTravelDomain(d);
    }

    return { seeded: true, count: domainList.length };
  }),

  // ─── Campaign Manager ─────────────────────────────────────────────
  getCampaigns: protectedProcedure.query(async () => {
    const campaigns = await getTravelCampaigns();
    const result = [];
    for (const c of campaigns) {
      const creatives = await getTravelCreativesByCampaign(c.id);
      result.push({
        ...c,
        creatives,
      });
    }
    return result;
  }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        objective: z.enum([
          "affiliate_revenue",
          "cross_sell",
          "destination_discovery",
          "package_upgrade",
          "flight_alternative",
          "content_discovery",
          "newsletter_signup",
        ]),
        sourceDomainId: z.string().uuid(),
        targetDomainId: z.string().uuid(),
        priority: z.number().default(100),
        headline: z.string().min(1),
        body: z.string().min(1),
        ctaText: z.string().min(1),
        format: z.enum([
          "native_card",
          "horizontal_banner",
          "inline_banner",
          "compact_card",
          "search_alternative",
          "empty_state",
          "footer_link",
          "header_link",
        ]),
        targetUrl: z.string().url(),
        destination: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const campaignId = uuidv4();
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const campaign = await createTravelCampaign({
        id: campaignId,
        name: input.name,
        slug,
        objective: input.objective,
        editorialStatus: "draft",
        runtimeHealth: "healthy",
        priority: input.priority,
        sourceDomainId: input.sourceDomainId,
        targetDomainId: input.targetDomainId,
        createdBy: (ctx.user as any)?.email || "admin",
      });

      const creativeId = uuidv4();
      const creative = await createTravelCreative({
        id: creativeId,
        campaignId,
        name: `${input.name} - Creative 1`,
        format: input.format,
        headline: input.headline,
        body: input.body,
        ctaText: input.ctaText,
        targetUrl: input.targetUrl,
        destination: input.destination || null,
        runtimeHealth: "healthy",
      });

      await logTravelAudit({
        actor: (ctx.user as any)?.email || "admin",
        action: "campaign_created",
        entityType: "campaign",
        entityId: campaignId,
        after: JSON.stringify(campaign),
      });

      return { campaign, creative };
    }),

  submitForReview: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const actor = (ctx.user as any)?.email || "admin";
      return await updateCampaignEditorialStatus(input.campaignId, "review", actor);
    }),

  approveCampaign: adminProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const actor = (ctx.user as any)?.email || "admin";
      return await updateCampaignEditorialStatus(input.campaignId, "approved", actor);
    }),

  activateCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const actor = (ctx.user as any)?.email || "admin";
      return await updateCampaignEditorialStatus(input.campaignId, "active", actor);
    }),

  pauseCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const actor = (ctx.user as any)?.email || "admin";
      return await updateCampaignEditorialStatus(input.campaignId, "paused", actor);
    }),

  // ─── Conversion Import (Admin/Test Procedure) ──────────────────────
  importConversion: protectedProcedure
    .input(
      z.object({
        partnerSlug: z.string().default("tradedoubler"),
        externalConversionId: z.string().min(1),
        affiliateClickId: z.string().optional(),
        partnerSubId: z.string().optional(),
        status: z.enum(["pending", "confirmed", "cancelled", "rejected"]).default("pending"),
        grossRevenue: z.number().default(0),
        commissionValue: z.number().default(0),
        bookingValue: z.number().default(0),
        currency: z.string().default("CZK"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let partners = await getAffiliatePartners();
      let partner = partners.find((p: any) => p.slug === input.partnerSlug);

      if (!partner) {
        partner = await createAffiliatePartner({
          id: uuidv4(),
          name: input.partnerSlug.toUpperCase(),
          slug: input.partnerSlug,
          status: "active",
          currency: input.currency,
        });
      }

      const partnerId = partner ? partner.id : uuidv4();
      const conversionId = uuidv4();
      const now = new Date();

      const result = await importAffiliateConversion({
        id: conversionId,
        partnerId,
        externalConversionId: input.externalConversionId,
        affiliateClickId: input.affiliateClickId || null,
        partnerSubId: input.partnerSubId || null,
        status: input.status,
        grossRevenue: input.grossRevenue.toFixed(2),
        commissionValue: input.commissionValue.toFixed(2),
        bookingValue: input.bookingValue.toFixed(2),
        currency: input.currency,
        occurredAt: now,
        confirmedAt: input.status === "confirmed" ? now : null,
        cancelledAt: input.status === "cancelled" ? now : null,
      });

      return result;
    }),

  // ─── Pilot Seed Campaign ──────────────────────────────────────────
  seedPilotCampaign: protectedProcedure.mutation(async ({ ctx }) => {
    const campaigns = await getTravelCampaigns();
    const existing = campaigns.find((c: any) => c.name === "Itálie -> Akční letenky Pilot");
    if (existing) {
      return { seeded: false, message: "Pilot campaign already exists", campaign: existing };
    }

    let italieDomain = await getTravelDomainBySlug("do-italie.cz");
    let letenkyDomain = await getTravelDomainBySlug("akcni-letenky.com");

    if (!italieDomain || !letenkyDomain) {
      const italieId = uuidv4();
      const letenkyId = uuidv4();
      italieDomain = await createTravelDomain({
        id: italieId,
        name: "Do Itálie",
        slug: "do-italie.cz",
        baseUrl: "https://www.do-italie.cz",
        projectKey: "proj_italie_pilot",
        domainType: "destination_content",
        status: "active",
      });
      letenkyDomain = await createTravelDomain({
        id: letenkyId,
        name: "Akční letenky",
        slug: "akcni-letenky.com",
        baseUrl: "https://www.akcni-letenky.com",
        projectKey: "proj_letenky_pilot",
        domainType: "flight_search",
        status: "active",
      });
    }

    const italieDomainId = italieDomain ? italieDomain.id : uuidv4();
    const letenkyDomainId = letenkyDomain ? letenkyDomain.id : uuidv4();

    // Create placement for article_mid_content
    await createTravelPlacement({
      id: uuidv4(),
      domainId: italieDomainId,
      name: "Article Mid Content Placement",
      placementKey: "article_mid_content",
      pageType: "article",
      position: "mid_content",
      deviceScope: "all",
      status: "active",
    });

    const campaignId = uuidv4();
    const campaign = await createTravelCampaign({
      id: campaignId,
      name: "Itálie -> Akční letenky Pilot",
      slug: "italie-akcni-letenky-pilot",
      objective: "affiliate_revenue",
      editorialStatus: "draft", // Strictly draft per Constraint 10
      runtimeHealth: "healthy",
      priority: 10,
      sourceDomainId: italieDomainId,
      targetDomainId: letenkyDomainId,
      createdBy: "admin",
    });

    const creative = await createTravelCreative({
      id: uuidv4(),
      campaignId,
      name: "Najděte levné letenky do Itálie",
      format: "native_card",
      headline: "Najděte levné letenky do Itálie",
      body: "Porovnejte aktuální odlety z Česka a okolních letišť.",
      ctaText: "Najít letenky",
      targetUrl: "https://www.akcni-letenky.com/italie",
      destination: "Itálie",
      runtimeHealth: "healthy",
    });

    return { seeded: true, campaign, creative };
  }),
});