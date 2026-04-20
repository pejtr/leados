import type { Express, Request, Response } from "express";
import { getProjectByApiKey, ingestEvent } from "./projectsDb";
import { getDb } from "./db";
import { adCampaigns, adCampaignSnapshots, dsrSnapshots, ingestedLeads } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * When a 'sale' event is ingested for a project, automatically
 * increment the revenue of all Ad Campaigns linked to that project.
 */
async function autoUpdateCampaignRevenue(projectId: number, saleValue: number) {
  try {
    const db = await getDb();
    if (!db || saleValue <= 0) return;

    // 1. Update revenue + conversions on all campaigns linked to this project
    await db
      .update(adCampaigns)
      .set({
        revenue: sql`${adCampaigns.revenue} + ${saleValue}`,
        conversions: sql`${adCampaigns.conversions} + 1`,
      })
      .where(eq(adCampaigns.projectId, projectId));

    // 2. Auto-snapshot: record today's state for each linked campaign
    const today = new Date().toISOString().slice(0, 10);
    const linkedCampaigns = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.projectId, projectId));

    for (const campaign of linkedCampaigns) {
      const spend = parseFloat(campaign.adSpend as string) || 0;
      // Revenue already incremented above — re-read the updated value
      const rev = (parseFloat(campaign.revenue as string) || 0) + saleValue;
      const roas = spend > 0 ? rev / spend : 0;
      const pno = rev > 0 ? (spend / rev) * 100 : 0;

      // Upsert snapshot for today
      await db
        .delete(adCampaignSnapshots)
        .where(
          and(
            eq(adCampaignSnapshots.campaignId, campaign.id),
            eq(adCampaignSnapshots.snapshotDate, today)
          )
        );
      await db.insert(adCampaignSnapshots).values({
        campaignId: campaign.id,
        userId: campaign.userId,
        snapshotDate: today,
        adSpend: spend.toString(),
        revenue: rev.toString(),
        conversions: (campaign.conversions || 0) + 1,
        clicks: campaign.clicks || 0,
        roas: roas.toFixed(4),
        pno: pno.toFixed(4),
      });
    }

    console.log(`[Ingest] Auto-snapshot created for ${linkedCampaigns.length} campaign(s) on project ${projectId}`);
  } catch (err: any) {
    console.error("[Ingest] autoUpdateCampaignRevenue error:", err?.message);
  }
}

/**
 * Public API endpoint for external projects to push analytics events.
 * POST /api/ingest/:apiKey
 *
 * Body (single event):
 * { eventType: "sale" | "pageview" | "signup" | "refund" | "adspend" | "custom",
 *   value?: number, currency?: string, metadata?: object, occurredAt?: string }
 *
 * Body (batch events):
 * { events: [{ eventType, value, currency, metadata, occurredAt }] }
 */
export function registerIngestRoute(app: Express) {
  app.post("/api/ingest/:apiKey", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.params;

      if (!apiKey || apiKey.length < 10) {
        return res.status(401).json({ error: "Invalid API key format" });
      }

      const project = await getProjectByApiKey(apiKey);
      if (!project) {
        return res.status(401).json({ error: "Invalid or inactive API key" });
      }

      const body = req.body;

      // Batch mode: { events: [...] }
      if (Array.isArray(body.events)) {
        const events = body.events.slice(0, 100); // max 100 events per batch
        for (const ev of events) {
          await ingestEvent({
            projectId: project.id,
            eventType: ev.eventType || "custom",
            value: ev.value ? parseFloat(ev.value) : 0,
            currency: ev.currency || project.currency,
            metadata: ev.metadata || {},
            occurredAt: ev.occurredAt ? new Date(ev.occurredAt) : new Date(),
          });
        }
        return res.json({ ok: true, ingested: events.length, projectId: project.id });
      }

      // Single event mode
      const eventType = body.eventType || "custom";
      const value = body.value ? parseFloat(body.value) : 0;
      const currency = body.currency || project.currency;
      const metadata = body.metadata || {};
      const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();

      await ingestEvent({ projectId: project.id, eventType, value, currency, metadata, occurredAt });

      // Auto-update linked Ad Campaign revenue on sale events
      if (eventType === "sale" && value > 0) {
        await autoUpdateCampaignRevenue(project.id, value);
      }

      return res.json({ ok: true, ingested: 1, projectId: project.id, eventType, value });
    } catch (err: any) {
      console.error("[Ingest] Error:", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── POST /api/dsr/ingest — DeepSleepReset push ingest ─────────────────────
  // Auth: X-API-Key header must match DEEP_SLEEP_RESET_API_KEY env var
  // Payload: { kpis, leads, orders, source?, pushedAt? } (same shape as DSR analytics)
  app.post("/api/dsr/ingest", async (req: Request, res: Response) => {
    try {
      const apiKey = (req.headers["x-api-key"] as string) ||
        (req.headers["authorization"] as string)?.replace("Bearer ", "");
      const expectedKey = process.env.DEEP_SLEEP_RESET_API_KEY;
      if (!expectedKey || apiKey !== expectedKey) {
        return res.status(401).json({ ok: false, error: "Invalid API key" });
      }
      const body = req.body || {};
      const kpis = body.kpis || body.analytics?.kpis || {};
      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, error: "DB unavailable" });
      // dsrSnapshots imported at top of file
      const toUsdCents = (v: string | number | undefined) =>
        Math.round(parseFloat(String(v || 0)) * 100);
      await db.insert(dsrSnapshots).values({
        source: String(body.source || "deep-sleep-reset"),
        totalRevenueCents: toUsdCents(kpis.totalRevenueUsd),
        todayRevenueCents: toUsdCents(kpis.todayRevenueUsd),
        last7dRevenueCents: toUsdCents(kpis.last7DaysRevenueUsd),
        last30dRevenueCents: toUsdCents(kpis.last30DaysRevenueUsd),
        totalOrders: parseInt(String(kpis.totalOrders || 0)),
        totalLeads: parseInt(String(kpis.totalLeads || body.leads?.total || 0)),
        convertedLeads: parseInt(String(kpis.convertedLeads || 0)),
        conversionRatePct: Math.round(parseFloat(String(kpis.conversionRatePct || 0))),
        rawPayload: body,
        pushedAt: Date.now(),
        createdAt: Date.now(),
      });
      console.log(
        `[DSR Ingest] Snapshot stored — revenue: $${kpis.totalRevenueUsd || 0}, orders: ${kpis.totalOrders || 0}`
      );
      return res.json({ ok: true, stored: true, receivedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("[DSR Ingest] Error:", err?.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  // ── POST /api/leads/ingest — Universal lead capture from external projects ──────
  // Auth: X-LeadOS-Key header = project apiKey from connectedProjects table
  // Payload: { source, name?, email, phone?, interest?, url?, utm_source?, utm_medium?, utm_campaign?, ...extra }
  app.post("/api/leads/ingest", async (req: Request, res: Response) => {
    try {
      const apiKey = (req.headers["x-leados-key"] as string) ||
        (req.headers["x-api-key"] as string) ||
        (req.headers["authorization"] as string)?.replace("Bearer ", "");

      if (!apiKey || apiKey.length < 8) {
        return res.status(401).json({ ok: false, error: "Missing X-LeadOS-Key header" });
      }

      const project = await getProjectByApiKey(apiKey);
      if (!project) {
        return res.status(401).json({ ok: false, error: "Invalid or inactive API key" });
      }

      const body = req.body || {};
      const email = (body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return res.status(400).json({ ok: false, error: "Valid email is required" });
      }

      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, error: "DB unavailable" });

      // Extract known fields, put the rest in extraData
      const { source, name, phone, interest, url, utm_source, utm_medium, utm_campaign, ...rest } = body;
      const extraData: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (!['email'].includes(k)) extraData[k] = v;
      }

      const [inserted] = await db.insert(ingestedLeads).values({
        projectId: project.id,
        projectName: project.name,
        source: String(source || project.name),
        name: name ? String(name).slice(0, 256) : undefined,
        email,
        phone: phone ? String(phone).slice(0, 64) : undefined,
        interest: interest ? String(interest).slice(0, 512) : undefined,
        pageUrl: url ? String(url) : undefined,
        utmSource: utm_source ? String(utm_source).slice(0, 128) : undefined,
        utmMedium: utm_medium ? String(utm_medium).slice(0, 128) : undefined,
        utmCampaign: utm_campaign ? String(utm_campaign).slice(0, 128) : undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined,
        userAgent: (req.headers['user-agent'] as string)?.slice(0, 512) || undefined,
        extraData: Object.keys(extraData).length > 0 ? extraData : undefined,
        status: 'new',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Also fire a 'signup' event into projectEvents for analytics tracking
      await ingestEvent({
        projectId: project.id,
        eventType: 'signup',
        value: 0,
        currency: project.currency,
        metadata: { email, name: name || '', source: source || project.name },
        occurredAt: new Date(),
      });

      console.log(`[Leads Ingest] New lead from ${project.name}: ${email}`);
      return res.json({ ok: true, leadId: (inserted as any)?.insertId, project: project.name });
    } catch (err: any) {
      console.error("[Leads Ingest] Error:", err?.message);
      return res.status(500).json({ ok: false, error: "Internal server error" });
    }
  });

  // GET /api/ingest/:apiKey/ping — health check for external projects
  app.get("/api/ingest/:apiKey/ping", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.params;
      const project = await getProjectByApiKey(apiKey);
      if (!project) return res.status(401).json({ ok: false, error: "Invalid API key" });
      return res.json({ ok: true, projectName: project.name, projectId: project.id });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });
}
